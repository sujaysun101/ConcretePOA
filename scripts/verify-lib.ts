import { demoCases } from "../lib/demo-data";
import { auditResultSchema, jurisdictionResultSchema, rejectionDiagnosisSchema } from "../lib/ai/schemas";
import { auditPrompt, jurisdictionPrompt, rejectionPrompt } from "../lib/ai/prompts";
import { consumeRateLimit, resetRateLimitMemory } from "../lib/ai/rate-limit";
import { sampleAudit, sampleJurisdiction, sampleRejection } from "../lib/ai/samples";
import { builtinRules } from "../lib/library";
import { buildDashboard } from "../lib/metrics";
import { caseToPdf } from "../lib/report";
import type { AuditResult, JurisdictionResult, RejectionDiagnosis } from "../lib/types";

function assert(condition: unknown, message: string) {
  if (!condition) throw new Error(message);
}

const cases = demoCases("org_test");
assert(cases.length >= 8, "expected seeded demo matters");
for (const record of cases) {
  if (record.kind === "audit") auditResultSchema.parse(record.findings);
  if (record.kind === "diagnosis") rejectionDiagnosisSchema.parse(record.findings);
  if (record.kind === "jurisdiction") jurisdictionResultSchema.parse(record.findings);
  assert(!JSON.stringify(record).includes("GEMINI_API_KEY"), "demo payload mentioned a client key");
}

auditResultSchema.parse(sampleAudit("Chase"));
rejectionDiagnosisSchema.parse(sampleRejection());
jurisdictionResultSchema.parse(sampleJurisdiction());

const audit = auditPrompt("Chase", "Require two witnesses.");
assert(audit.includes("ConcretePOA"), "audit prompt drifted");
assert(audit.includes("INSTITUTIONAL RUBRIC"), "audit prompt lost the rubric");
assert(audit.includes("Require two witnesses."), "custom rules were dropped");
assert(jurisdictionPrompt().includes("Caution to the Principal"), "jurisdiction prompt drifted");
assert(rejectionPrompt().includes("Rejection Diagnostic Engine"), "rejection prompt drifted");

const rules = builtinRules();
assert(rules.some((rule) => rule.jurisdiction === "Florida" && rule.citation?.includes("709")), "Florida rule missing");
assert(rules.some((rule) => rule.institution === "Vanguard"), "Vanguard rubric missing");

const dashboard = buildDashboard(cases, "memory");
assert(dashboard.totals.cases === cases.length, "dashboard count mismatch");
assert(dashboard.priority?.id === "case_vasquez_fidelity" || (dashboard.priority?.score ?? 100) <= 31, "priority case unexpected");
assert(dashboard.byMonth.length >= 4, "monthly chart is empty");

resetRateLimitMemory();
delete process.env.UPSTASH_REDIS_REST_URL;
delete process.env.UPSTASH_REDIS_REST_TOKEN;
for (let i = 0; i < 10; i += 1) {
  const result = await consumeRateLimit("user_verify");
  assert(result.ok, `rate limit rejected call ${i + 1}`);
}
const blocked = await consumeRateLimit("user_verify");
assert(!blocked.ok, "rate limit did not trip");

const pdf = await caseToPdf(cases[0]);
const header = Buffer.from(pdf.slice(0, 5)).toString("utf8");
assert(header === "%PDF-", "pdf export did not start with a PDF header");

const auditFindings = cases.find((item) => item.kind === "audit")?.findings as AuditResult;
const diagnosis = cases.find((item) => item.kind === "diagnosis")?.findings as RejectionDiagnosis;
const jurisdiction = cases.find((item) => item.kind === "jurisdiction")?.findings as JurisdictionResult;
assert(auditFindings.remediationBlueprint.affidavitTemplate.includes("AFFIDAVIT"), "affidavit missing");
assert(diagnosis.actionPlan.step3.length > 10, "diagnosis plan missing");
assert(jurisdiction.statutoryDrift.length > 0, "drift list missing");

console.log(`Verified ${cases.length} demo matters, ${rules.length} library rules, rate limit, and PDF export.`);
