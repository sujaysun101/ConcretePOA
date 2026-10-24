import { describe, expect, it } from "vitest";
import { demoCases } from "@/lib/demo-data";
import {
  auditResultSchema,
  jurisdictionResultSchema,
  rejectionDiagnosisSchema,
} from "@/lib/ai/schemas";
import { auditPrompt, jurisdictionPrompt, rejectionPrompt } from "@/lib/ai/prompts";
import { consumeRateLimit, resetRateLimitMemory } from "@/lib/ai/rate-limit";
import { sampleAudit, sampleJurisdiction, sampleRejection } from "@/lib/ai/samples";
import { builtinRules } from "@/lib/library";
import { buildDashboard } from "@/lib/metrics";
import { caseToPdf } from "@/lib/report";
import type { AuditResult, JurisdictionResult, RejectionDiagnosis } from "@/lib/types";

describe("verify-lib core regression tests", () => {
  it("validates demo matters against zod schemas", () => {
    const cases = demoCases("org_test");
    expect(cases.length).toBeGreaterThanOrEqual(8);

    for (const record of cases) {
      if (record.kind === "audit") {
        expect(() => auditResultSchema.parse(record.findings)).not.toThrow();
      }
      if (record.kind === "diagnosis") {
        expect(() => rejectionDiagnosisSchema.parse(record.findings)).not.toThrow();
      }
      if (record.kind === "jurisdiction") {
        expect(() => jurisdictionResultSchema.parse(record.findings)).not.toThrow();
      }
      expect(JSON.stringify(record)).not.toContain("GEMINI_API_KEY");
    }
  });

  it("validates sample generator payloads", () => {
    expect(() => auditResultSchema.parse(sampleAudit("Chase"))).not.toThrow();
    expect(() => rejectionDiagnosisSchema.parse(sampleRejection())).not.toThrow();
    expect(() => jurisdictionResultSchema.parse(sampleJurisdiction())).not.toThrow();
  });

  it("ensures prompts contain required preambles and rubric", () => {
    const audit = auditPrompt("Chase", "Require two witnesses.");
    expect(audit).toContain("ConcretePOA");
    expect(audit).toContain("INSTITUTIONAL RUBRIC");
    expect(audit).toContain("Require two witnesses.");

    expect(jurisdictionPrompt()).toContain("Caution to the Principal");
    expect(rejectionPrompt()).toContain("Rejection Diagnostic Engine");
  });

  it("verifies built-in rule library contents", () => {
    const rules = builtinRules();
    expect(
      rules.some((rule) => rule.jurisdiction === "Florida" && rule.citation?.includes("709"))
    ).toBe(true);
    expect(rules.some((rule) => rule.institution === "Vanguard")).toBe(true);
  });

  it("generates correct dashboard metrics", () => {
    const cases = demoCases("org_test");
    const dashboard = buildDashboard(cases, "memory");
    expect(dashboard.totals.cases).toBe(cases.length);
    expect(
      dashboard.priority?.id === "case_vasquez_fidelity" ||
        (dashboard.priority?.score ?? 100) <= 31
    ).toBe(true);
    expect(dashboard.byMonth.length).toBeGreaterThanOrEqual(4);
  });

  it("enforces in-memory rate limiting", async () => {
    resetRateLimitMemory();
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;

    for (let i = 0; i < 10; i += 1) {
      const result = await consumeRateLimit("user_verify");
      expect(result.ok).toBe(true);
    }
    const blocked = await consumeRateLimit("user_verify");
    expect(blocked.ok).toBe(false);
  });

  it("produces valid PDF exports with %PDF- header", async () => {
    const cases = demoCases("org_test");
    const pdf = await caseToPdf(cases[0]);
    const header = Buffer.from(pdf.slice(0, 5)).toString("utf8");
    expect(header).toBe("%PDF-");
  });

  it("ensures structured remediation sections are populated", () => {
    const cases = demoCases("org_test");
    const auditFindings = cases.find((item) => item.kind === "audit")?.findings as AuditResult;
    const diagnosis = cases.find((item) => item.kind === "diagnosis")?.findings as RejectionDiagnosis;
    const jurisdiction = cases.find((item) => item.kind === "jurisdiction")
      ?.findings as JurisdictionResult;

    expect(auditFindings.remediationBlueprint.affidavitTemplate).toContain("AFFIDAVIT");
    expect(diagnosis.actionPlan.step3.length).toBeGreaterThan(10);
    expect(jurisdiction.statutoryDrift.length).toBeGreaterThan(0);
  });
});
