import "server-only";
import type { AuditResult, CaseKind, CaseRecord, JurisdictionResult, RejectionDiagnosis } from "@/lib/types";
import { auditPrompt, jurisdictionPrompt, rejectionPrompt, PROMPT_VERSION, RULE_LIBRARY_VERSION } from "@/lib/ai/prompts";
import { consumeRateLimit } from "@/lib/ai/rate-limit";
import { getProvider, PreparedDocument } from "@/lib/ai/provider";
import { assertUnderSpendCeiling, recordUsageEvent } from "@/lib/ai/usage";
import { sampleAudit, sampleJurisdiction, sampleRejection } from "@/lib/ai/samples";
import { recordAuditEvent } from "@/lib/audit";
import {
  auditResultSchema,
  jurisdictionResultSchema,
  normalizeAudit,
  normalizeJurisdiction,
  normalizeRejection,
  parseModelJson,
  rejectionDiagnosisSchema,
} from "@/lib/ai/schemas";
import { validateUploadedFile } from "@/lib/uploads";
import { saveCase } from "@/lib/store";
import {
  AppError,
  BadRequestError,
  ModelOutputInvalidError,
  RateLimitedError,
} from "@/lib/errors";
import { logger } from "@/lib/log";

export type AnalyzeRequest = {
  userId: string;
  orgId: string;
  mode: CaseKind;
  bank?: string;
  customRules?: string;
  poa: File;
  rejection?: File | null;
};

export type AnalyzeResponse =
  | { ok: true; record: CaseRecord; remaining: number }
  | { ok: false; status: number; error: string; code?: string; retryAfter?: number };

function summaryFor(mode: CaseKind, findings: AuditResult | RejectionDiagnosis | JurisdictionResult) {
  if (mode === "audit") return (findings as AuditResult).primaryRedFlags[0] ?? "Audit complete.";
  if (mode === "diagnosis") return (findings as RejectionDiagnosis).rejectionReason.slice(0, 280);
  const jurisdiction = findings as JurisdictionResult;
  return jurisdiction.statutoryDrift[0]?.description ?? `${jurisdiction.state} statutory review complete.`;
}

export async function analyzeUpload(input: AnalyzeRequest): Promise<AnalyzeResponse> {
  const startTime = Date.now();
  let validatedPoa: Awaited<ReturnType<typeof validateUploadedFile>>;
  let validatedRejection: Awaited<ReturnType<typeof validateUploadedFile>> | null = null;

  try {
    // 1. Upload Hardening & Magic Bytes Validation
    validatedPoa = await validateUploadedFile(input.poa, "The POA");

    if (input.mode === "audit" && !input.bank?.trim()) {
      throw new BadRequestError("Choose a target institution.");
    }

    if (input.mode === "diagnosis") {
      if (!input.rejection) {
        throw new BadRequestError("Upload the rejection letter.");
      }
      validatedRejection = await validateUploadedFile(input.rejection, "The rejection letter");
    }

    // 2. Spend Ceiling & Rate Limit Guards
    await assertUnderSpendCeiling(0.01);

    const limit = await consumeRateLimit(input.userId);
    if (!limit.ok) {
      throw new RateLimitedError(limit.retryAfter ?? 60, "Too many analyses for this account. Wait a minute and try again.");
    }

    const id = crypto.randomUUID();
    let findings: AuditResult | RejectionDiagnosis | JurisdictionResult | null = null;
    let isSample = false;
    let usedProvider = "mock";
    let usedModel = "unknown";
    let inputTokens = 0;
    let outputTokens = 0;

    // 3. Provider Resolution
    const provider = getProvider();
    usedProvider = provider.name;

    const poaDoc: PreparedDocument = {
      name: validatedPoa.name,
      mimeType: validatedPoa.mimeType,
      base64: validatedPoa.base64,
      buffer: validatedPoa.buffer,
    };

    const rejectionDoc: PreparedDocument | null = validatedRejection
      ? {
          name: validatedRejection.name,
          mimeType: validatedRejection.mimeType,
          base64: validatedRejection.base64,
          buffer: validatedRejection.buffer,
        }
      : null;

    let prompt =
      input.mode === "audit"
        ? auditPrompt(input.bank || "Other", input.customRules)
        : input.mode === "diagnosis"
          ? rejectionPrompt()
          : jurisdictionPrompt();

    // 4. Execution Loop with 1 Retry on Schema / Parse Failure
    let attempts = 0;
    const maxValidationAttempts = 2;
    let lastValidationError: string | null = null;

    while (attempts < maxValidationAttempts) {
      attempts++;
      try {
        const result = await provider.complete({
          mode: input.mode,
          prompt,
          poa: poaDoc,
          rejection: rejectionDoc,
          bank: input.bank,
          customRules: input.customRules,
        });

        usedModel = result.model;
        inputTokens = result.inputTokens ?? 0;
        outputTokens = result.outputTokens ?? 0;

        const parsed = parseModelJson(result.rawText);

        if (input.mode === "audit") {
          findings = auditResultSchema.parse(
            normalizeAudit(parsed, { id, bank: input.bank || "Other" })
          );
        } else if (input.mode === "diagnosis") {
          findings = rejectionDiagnosisSchema.parse(normalizeRejection(parsed, id));
        } else {
          findings = jurisdictionResultSchema.parse(normalizeJurisdiction(parsed, id));
        }

        // Successfully parsed and validated
        break;
      } catch (err: unknown) {
        lastValidationError = err instanceof Error ? err.message : String(err);
        if (attempts < maxValidationAttempts) {
          logger.warn({
            event: "model_validation_retry",
            code: "model_output_invalid",
            outcome: `attempt_${attempts}_failed`,
          });
          prompt = `${prompt}\n\nIMPORTANT: Previous output failed validation with error: ${lastValidationError}. Return strictly valid JSON matching the exact schema with all fields populated.`;
        }
      }
    }

    if (!findings) {
      // In production, fail closed; in dev/test, fallback if sample allowed
      if (process.env.NODE_ENV === "production") {
        throw new ModelOutputInvalidError(`Model output failed schema validation: ${lastValidationError}`);
      }
      isSample = true;
      findings =
        input.mode === "audit"
          ? sampleAudit(input.bank || "Other")
          : input.mode === "diagnosis"
            ? sampleRejection()
            : sampleJurisdiction();
      findings = { ...findings, id, timestamp: Date.now() };
    }

    // 5. Usage Metering
    const totalLatency = Date.now() - startTime;
    await recordUsageEvent({
      userId: input.userId,
      orgId: input.orgId,
      mode: input.mode,
      provider: usedProvider,
      model: usedModel,
      inputTokens,
      outputTokens,
      latencyMs: totalLatency,
      outcome: "ok",
      attempts,
    });

    const audit = input.mode === "audit" ? (findings as AuditResult) : null;
    const diagnosis = input.mode === "diagnosis" ? (findings as RejectionDiagnosis) : null;
    const jurisdiction = input.mode === "jurisdiction" ? (findings as JurisdictionResult) : null;
    const principal = audit?.extractedData.principal || null;
    const agent = audit?.extractedData.agent || null;
    const state = audit?.extractedData.state || jurisdiction?.state || null;
    const bankTarget = audit?.bankTarget || diagnosis?.bankName || input.bank || null;
    const score = audit?.acceptanceProbability ?? jurisdiction?.overallComplianceScore ?? null;
    const titleBase = principal || validatedPoa.name.replace(/\.[^.]+$/, "");

    const record: CaseRecord = {
      id,
      orgId: input.orgId,
      userId: input.userId,
      title: bankTarget ? `${titleBase} · ${bankTarget}` : `${titleBase} · statutory review`,
      kind: input.mode,
      status: isSample ? "sample" : "ready",
      bankTarget,
      state,
      principal,
      agent,
      executionDate: audit?.extractedData.date || null,
      fileName: validatedPoa.name,
      score: score === null ? null : Math.round(score),
      summary: summaryFor(input.mode, findings),
      findings,
      isDemo: false,
      isSample,
      createdAt: new Date().toISOString(),
    };

    // 6. Save Case and Record Security Audit
    await saveCase(record);

    await recordAuditEvent({
      actorUserId: input.userId,
      actorType: "user",
      scopeType: input.orgId ? "org" : "personal",
      scopeId: input.orgId || input.userId,
      action: "case.create",
      targetType: "case",
      targetId: id,
      metadata: {
        mode: input.mode,
        score: record.score,
        promptVersion: PROMPT_VERSION,
        ruleLibraryVersion: RULE_LIBRARY_VERSION,
        isSample,
      },
    });

    return { ok: true, record, remaining: limit.remaining };
  } catch (err: unknown) {
    const latency = Date.now() - startTime;
    if (err instanceof AppError) {
      await recordUsageEvent({
        userId: input.userId,
        orgId: input.orgId,
        mode: input.mode,
        provider: "unknown",
        model: "unknown",
        latencyMs: latency,
        outcome: err.code === "spend_capped" ? "spend_capped" : "provider_error",
      }).catch(() => {});

      return {
        ok: false,
        status: err.statusCode,
        error: err.message,
        code: err.code,
        retryAfter: err.retryAfter,
      };
    }

    const message = err instanceof Error ? err.message : "Review could not be completed.";
    return {
      ok: false,
      status: 400,
      error: message,
      code: "invalid_input",
    };
  }
}
