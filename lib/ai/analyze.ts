import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { aiConfigured, aiModelName, maxTokens } from "@/lib/config";
import type { AuditResult, CaseKind, CaseRecord, JurisdictionResult, RejectionDiagnosis } from "@/lib/types";
import { auditPrompt, jurisdictionPrompt, rejectionPrompt } from "@/lib/ai/prompts";
import { consumeRateLimit } from "@/lib/ai/rate-limit";
import { sampleAudit, sampleJurisdiction, sampleRejection } from "@/lib/ai/samples";
import { callPoaEngine, isPoaEngineConfigured } from "@/lib/ai/poa-engine-client";
import {
  auditResultSchema,
  jurisdictionResultSchema,
  normalizeAudit,
  normalizeJurisdiction,
  normalizeRejection,
  parseModelJson,
  rejectionDiagnosisSchema,
} from "@/lib/ai/schemas";
import { normalizeMime, MAX_UPLOAD_BYTES } from "@/lib/uploads";
import { saveCase } from "@/lib/store";

type PreparedFile = {
  name: string;
  mimeType: "application/pdf" | "image/png" | "image/jpeg" | "image/webp";
  base64: string;
};

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
  | { ok: false; status: number; error: string; retryAfter?: number };

const SYSTEM =
  "You review powers of attorney for ConcretePOA. Return one JSON object and no markdown. Quote the uploaded document when you can. This is an informational compliance aid, not legal advice.";

function fileError(file: File, label: string): string | null {
  if (file.size <= 0) return `${label} is empty.`;
  if (file.size > MAX_UPLOAD_BYTES) return `${label} must be 4 MB or smaller.`;
  if (!normalizeMime(file.type)) return `${label} must be a PDF, PNG, JPEG, or WebP file.`;
  return null;
}

async function prepare(file: File): Promise<PreparedFile> {
  const mimeType = normalizeMime(file.type);
  if (!mimeType) throw new Error("unsupported");
  const bytes = Buffer.from(await file.arrayBuffer());
  return { name: file.name.slice(0, 180), mimeType, base64: bytes.toString("base64") };
}

function contentBlock(file: PreparedFile): Anthropic.ContentBlockParam {
  if (file.mimeType === "application/pdf") {
    return {
      type: "document",
      title: file.name,
      source: { type: "base64", media_type: "application/pdf", data: file.base64 },
    };
  }
  return {
    type: "image",
    source: { type: "base64", media_type: file.mimeType, data: file.base64 },
  };
}

async function complete(blocks: Anthropic.ContentBlockParam[]) {
  const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
  if (!apiKey) return null;
  const client = new Anthropic({ apiKey, timeout: 55_000 });
  const message = await client.messages.create({
    model: aiModelName(),
    max_tokens: maxTokens(),
    system: SYSTEM,
    messages: [{ role: "user", content: blocks }],
  });
  return message.content
    .filter((block): block is Anthropic.TextBlock => block.type === "text")
    .map((block) => block.text)
    .join("\n");
}

function summaryFor(mode: CaseKind, findings: AuditResult | RejectionDiagnosis | JurisdictionResult) {
  if (mode === "audit") return (findings as AuditResult).primaryRedFlags[0] ?? "Audit complete.";
  if (mode === "diagnosis") return (findings as RejectionDiagnosis).rejectionReason.slice(0, 280);
  const jurisdiction = findings as JurisdictionResult;
  return jurisdiction.statutoryDrift[0]?.description ?? `${jurisdiction.state} statutory review complete.`;
}

export async function analyzeUpload(input: AnalyzeRequest): Promise<AnalyzeResponse> {
  const poaProblem = fileError(input.poa, "The POA");
  if (poaProblem) return { ok: false, status: 400, error: poaProblem };
  if (input.mode === "audit" && !input.bank?.trim()) {
    return { ok: false, status: 400, error: "Choose a target institution." };
  }
  if (input.mode === "diagnosis") {
    if (!input.rejection) return { ok: false, status: 400, error: "Upload the rejection letter." };
    const rejectionProblem = fileError(input.rejection, "The rejection letter");
    if (rejectionProblem) return { ok: false, status: 400, error: rejectionProblem };
  }
  if (input.customRules && input.customRules.length > 4000) {
    return { ok: false, status: 400, error: "Custom rules must be 4000 characters or fewer." };
  }

  const limit = await consumeRateLimit(input.userId);
  if (!limit.ok) {
    return {
      ok: false,
      status: 429,
      error: "Too many analyses for this account. Wait a minute and try again.",
      retryAfter: limit.retryAfter,
    };
  }

  const id = crypto.randomUUID();
  let findings: AuditResult | RejectionDiagnosis | JurisdictionResult | null = null;
  let isSample = false;

  try {
    // 1. Primary: POA Deterministic Rules Engine (Cloud Run)
    if (isPoaEngineConfigured()) {
      const engineResponse = await callPoaEngine({
        poa: input.poa,
        mode: input.mode,
        bank: input.bank,
        rejection: input.rejection,
        customRules: input.customRules,
      });

      if (engineResponse && typeof engineResponse === "object") {
        if (input.mode === "audit") {
          findings = auditResultSchema.parse(normalizeAudit(engineResponse, { id, bank: input.bank || "Other" }));
        } else if (input.mode === "diagnosis") {
          findings = rejectionDiagnosisSchema.parse(normalizeRejection(engineResponse, id));
        } else {
          findings = jurisdictionResultSchema.parse(normalizeJurisdiction(engineResponse, id));
        }
      }
    }

    // 2. Secondary: Anthropic Claude (if POA engine not configured or returned null)
    if (!findings && aiConfigured()) {
      const poa = await prepare(input.poa);
      const blocks: Anthropic.ContentBlockParam[] = [contentBlock(poa)];
      if (input.mode === "diagnosis" && input.rejection) {
        blocks.push(contentBlock(await prepare(input.rejection)));
      }
      const prompt =
        input.mode === "audit"
          ? auditPrompt(input.bank || "Other", input.customRules)
          : input.mode === "diagnosis"
            ? rejectionPrompt()
            : jurisdictionPrompt();
      blocks.push({ type: "text", text: prompt });
      const text = await complete(blocks);
      if (text) {
        const parsed = parseModelJson(text);
        if (input.mode === "audit") {
          findings = auditResultSchema.parse(normalizeAudit(parsed, { id, bank: input.bank || "Other" }));
        } else if (input.mode === "diagnosis") {
          findings = rejectionDiagnosisSchema.parse(normalizeRejection(parsed, id));
        } else {
          findings = jurisdictionResultSchema.parse(normalizeJurisdiction(parsed, id));
        }
      }
    }

    // 3. Fallback: Labelled sample report
    if (!findings) {
      isSample = true;
      findings =
        input.mode === "audit"
          ? sampleAudit(input.bank || "Other")
          : input.mode === "diagnosis"
            ? sampleRejection()
            : sampleJurisdiction();
      findings = { ...findings, id, timestamp: Date.now() };
    }
  } catch {
    return { ok: false, status: 400, error: "Analysis could not be completed. Check the file and try again." };
  }

  const audit = input.mode === "audit" ? (findings as AuditResult) : null;
  const diagnosis = input.mode === "diagnosis" ? (findings as RejectionDiagnosis) : null;
  const jurisdiction = input.mode === "jurisdiction" ? (findings as JurisdictionResult) : null;
  const principal = audit?.extractedData.principal || null;
  const agent = audit?.extractedData.agent || null;
  const state = audit?.extractedData.state || jurisdiction?.state || null;
  const bankTarget = audit?.bankTarget || diagnosis?.bankName || input.bank || null;
  const score = audit?.acceptanceProbability ?? jurisdiction?.overallComplianceScore ?? null;
  const titleBase = principal || input.poa.name.replace(/\.[^.]+$/, "");
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
    fileName: input.poa.name.slice(0, 180),
    score: score === null ? null : Math.round(score),
    summary: summaryFor(input.mode, findings),
    findings,
    isDemo: false,
    isSample,
    createdAt: new Date().toISOString(),
  };

  try {
    await saveCase(record);
  } catch {
    return { ok: false, status: 400, error: "The review finished but could not be saved. Try again." };
  }

  return { ok: true, record, remaining: limit.remaining };
}
