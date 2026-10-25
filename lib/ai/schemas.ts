import { z } from "zod";
import { sanitizeEvidenceQuote } from "@/lib/ai/sanitizer";

export const statusSchema = z.enum(["compliant", "non-compliant", "missing"]);
export const severitySchema = z.enum(["high", "medium", "low"]);

export const findingSchema = z.object({
  rule_id: z.string().optional(),
  title: z.string().min(1).max(200),
  severity: severitySchema,
  status: z.enum(["verified", "unverified"]).default("unverified"),
  evidence: z
    .object({
      quote: z.string().max(300),
      page: z.number().int().positive().optional(),
    })
    .nullable()
    .optional(),
  confidence: z.number().min(0).max(1).default(1),
  remediation: z.string().max(4000),
});

export const auditResultSchema = z.object({
  id: z.string().min(1),
  timestamp: z.number(),
  bankTarget: z.string().min(1),
  acceptanceProbability: z.number().min(0).max(100),
  primaryRedFlags: z.array(z.string()).max(30),
  clauseAudit: z.array(z.string()).max(40),
  executionAudit: z.array(z.string()).max(40),
  findingsList: z.array(findingSchema).optional(),
  remediationBlueprint: z.object({
    action1: z.string(),
    action2: z.string(),
    concreteFix: z.string(),
    affidavitTemplate: z.string(),
  }),
  extractedData: z.object({
    principal: z.string(),
    agent: z.string(),
    state: z.string(),
    date: z.string(),
    rawText: z.string().max(20000).optional(),
  }),
});

export const rejectionDiagnosisSchema = z.object({
  id: z.string().min(1),
  timestamp: z.number(),
  bankName: z.string().min(1),
  rejectionReason: z.string(),
  legaleseTranslation: z.string(),
  poaConflictSection: z.string(),
  evidence: z
    .object({
      quote: z.string().max(300),
      page: z.number().int().positive().optional(),
    })
    .nullable()
    .optional(),
  actionPlan: z.object({
    step1: z.string(),
    step2: z.string(),
    step3: z.string(),
  }),
  remediationText: z.string(),
});

export const jurisdictionResultSchema = z.object({
  id: z.string().min(1),
  timestamp: z.number(),
  state: z.string().min(1),
  statutoryYear: z.number(),
  rulesEffectiveAsOf: z.string().optional(),
  verification: z.enum(["verified", "unverified"]).default("unverified"),
  cautionSectionVerbatim: z.object({
    status: statusSchema,
    requiredText: z.string(),
    actualText: z.string().optional(),
    driftDetails: z.string(),
  }),
  agentSignaturePage: z.object({
    status: statusSchema,
    requirements: z.string(),
    driftDetails: z.string(),
  }),
  statutoryDrift: z
    .array(
      z.object({
        title: z.string(),
        description: z.string(),
        severity: severitySchema,
        remediation: z.string(),
      }),
    )
    .max(30),
  overallComplianceScore: z.number().min(0).max(100),
});

export const analyzeInputSchema = z.object({
  mode: z.enum(["audit", "diagnosis", "jurisdiction"]),
  bank: z.string().trim().min(1).max(80).optional(),
  customRules: z.string().trim().max(4000).optional(),
});

export const ruleInputSchema = z
  .object({
    scope: z.enum(["jurisdiction", "institution"]),
    jurisdiction: z.string().trim().max(80).optional(),
    institution: z.string().trim().max(80).optional(),
    topic: z.string().trim().min(3).max(140),
    requirement: z.string().trim().min(10).max(2000),
    severity: severitySchema,
    citation: z.string().trim().max(240).optional(),
    notes: z.string().trim().max(2000).optional(),
  })
  .superRefine((value, ctx) => {
    if (value.scope === "jurisdiction" && !value.jurisdiction) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Jurisdiction is required.", path: ["jurisdiction"] });
    }
    if (value.scope === "institution" && !value.institution) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Institution is required.", path: ["institution"] });
    }
  });

function clip(value: unknown, max = 4000) {
  return String(value ?? "").slice(0, max);
}

function asStringList(value: unknown, max = 30) {
  if (!Array.isArray(value)) return [];
  return value.slice(0, max).map((item) => clip(item, 2000));
}

export function normalizeAudit(raw: unknown, fallback: { id: string; bank: string }) {
  const source = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const remediation =
    source.remediationBlueprint && typeof source.remediationBlueprint === "object"
      ? (source.remediationBlueprint as Record<string, unknown>)
      : {};
  const extracted =
    source.extractedData && typeof source.extractedData === "object"
      ? (source.extractedData as Record<string, unknown>)
      : {};
  const score = Number(source.acceptanceProbability);

  const findingsListRaw = Array.isArray(source.findingsList)
    ? source.findingsList
    : Array.isArray(source.findings)
      ? source.findings
      : [];

  const findingsList = findingsListRaw.map((f: unknown) => {
    const item = f && typeof f === "object" ? (f as Record<string, unknown>) : {};
    const ev = item.evidence && typeof item.evidence === "object" ? (item.evidence as Record<string, unknown>) : null;
    return {
      rule_id: item.rule_id ? clip(item.rule_id, 80) : undefined,
      title: clip(item.title, 200) || "Audit item",
      severity: item.severity === "high" || item.severity === "low" ? item.severity : "medium",
      status: item.status === "verified" ? "verified" : "unverified",
      evidence: ev
        ? {
            quote: sanitizeEvidenceQuote(String(ev.quote ?? "")),
            page: typeof ev.page === "number" && ev.page > 0 ? ev.page : undefined,
          }
        : null,
      confidence: typeof item.confidence === "number" ? Math.max(0, Math.min(1, item.confidence)) : 1,
      remediation: clip(item.remediation, 2000) || "",
    };
  });

  return {
    id: clip(source.id || fallback.id, 80),
    timestamp: Number(source.timestamp) || Date.now(),
    bankTarget: clip(source.bankTarget || fallback.bank, 80),
    acceptanceProbability: Number.isFinite(score) ? Math.max(0, Math.min(100, score)) : 0,
    primaryRedFlags: asStringList(source.primaryRedFlags),
    clauseAudit: asStringList(source.clauseAudit, 40),
    executionAudit: asStringList(source.executionAudit, 40),
    ...(findingsList.length > 0 ? { findingsList } : {}),
    remediationBlueprint: {
      action1: clip(remediation.action1),
      action2: clip(remediation.action2),
      concreteFix: clip(remediation.concreteFix),
      affidavitTemplate: clip(remediation.affidavitTemplate, 12000),
    },
    extractedData: {
      principal: clip(extracted.principal, 200),
      agent: clip(extracted.agent, 200),
      state: clip(extracted.state, 80),
      date: clip(extracted.date, 80),
    },
  };
}

export function normalizeRejection(raw: unknown, fallbackId: string) {
  const source = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const plan = source.actionPlan && typeof source.actionPlan === "object" ? (source.actionPlan as Record<string, unknown>) : {};
  const ev = source.evidence && typeof source.evidence === "object" ? (source.evidence as Record<string, unknown>) : null;

  return {
    id: clip(source.id || fallbackId, 80),
    timestamp: Number(source.timestamp) || Date.now(),
    bankName: clip(source.bankName, 80),
    rejectionReason: clip(source.rejectionReason),
    legaleseTranslation: clip(source.legaleseTranslation),
    poaConflictSection: clip(source.poaConflictSection),
    ...(ev
      ? {
          evidence: {
            quote: sanitizeEvidenceQuote(String(ev.quote ?? "")),
            page: typeof ev.page === "number" && ev.page > 0 ? ev.page : undefined,
          },
        }
      : {}),
    actionPlan: {
      step1: clip(plan.step1),
      step2: clip(plan.step2),
      step3: clip(plan.step3),
    },
    remediationText: clip(source.remediationText, 12000),
  };
}

export function normalizeJurisdiction(raw: unknown, fallbackId: string) {
  const source = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const caution =
    source.cautionSectionVerbatim && typeof source.cautionSectionVerbatim === "object"
      ? (source.cautionSectionVerbatim as Record<string, unknown>)
      : {};
  const agent =
    source.agentSignaturePage && typeof source.agentSignaturePage === "object"
      ? (source.agentSignaturePage as Record<string, unknown>)
      : {};
  const status = (value: unknown) => {
    const text = String(value ?? "").toLowerCase();
    if (text === "compliant" || text === "non-compliant" || text === "missing") return text;
    return "missing";
  };
  const severity = (value: unknown) => {
    const text = String(value ?? "").toLowerCase();
    if (text === "high" || text === "medium" || text === "low") return text;
    return "medium";
  };
  const drift = Array.isArray(source.statutoryDrift) ? source.statutoryDrift.slice(0, 30) : [];
  const score = Number(source.overallComplianceScore);
  return {
    id: clip(source.id || fallbackId, 80),
    timestamp: Number(source.timestamp) || Date.now(),
    state: clip(source.state, 80),
    statutoryYear: Number(source.statutoryYear) || 2026,
    rulesEffectiveAsOf: clip(source.rulesEffectiveAsOf || "2026-01-01", 30),
    verification: source.verification === "verified" ? "verified" : "unverified",
    cautionSectionVerbatim: {
      status: status(caution.status),
      requiredText: clip(caution.requiredText),
      ...(caution.actualText ? { actualText: clip(caution.actualText) } : {}),
      driftDetails: clip(caution.driftDetails),
    },
    agentSignaturePage: {
      status: status(agent.status),
      requirements: clip(agent.requirements),
      driftDetails: clip(agent.driftDetails),
    },
    statutoryDrift: drift.map((item) => {
      const row = item && typeof item === "object" ? (item as Record<string, unknown>) : {};
      return {
        title: clip(row.title, 200),
        description: clip(row.description),
        severity: severity(row.severity),
        remediation: clip(row.remediation),
      };
    }),
    overallComplianceScore: Number.isFinite(score) ? Math.max(0, Math.min(100, score)) : 0,
  };
}

export function parseModelJson(text: string): unknown {
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const body = fenced?.[1] ?? trimmed;
  const start = body.indexOf("{");
  const end = body.lastIndexOf("}");
  if (start < 0 || end <= start) {
    throw new Error("The model did not return JSON.");
  }
  return JSON.parse(body.slice(start, end + 1)) as unknown;
}
