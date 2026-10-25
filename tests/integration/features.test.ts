import { describe, expect, it, vi } from "vitest";
import { saveCase } from "@/lib/store";
import type { CaseRecord } from "@/lib/types";

// Mock requireWorkspace in lib/api
vi.mock("@/lib/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api")>();
  return {
    ...actual,
    requireWorkspace: vi.fn().mockResolvedValue({
      session: {
        userId: "user_test_admin",
        orgId: "org_test_firm",
        orgRole: "org:admin",
        scope: { type: "org", orgId: "org_test_firm", role: "org:admin" },
      },
    }),
  };
});

describe("Phase 5 Features Integration Tests", () => {
  const caseAudit: CaseRecord = {
    id: "case-int-audit",
    orgId: "org_test_firm",
    userId: "user_test_admin",
    title: "John Smith · Chase Audit",
    kind: "audit",
    status: "ready",
    bankTarget: "Chase",
    state: "NY",
    principal: "John Smith",
    agent: "Jane Smith",
    executionDate: "2026-01-01",
    fileName: "john-poa.pdf",
    score: 82,
    summary: "Audit completed with minor friction.",
    findings: {
      id: "case-int-audit",
      timestamp: Date.now(),
      bankTarget: "Chase",
      acceptanceProbability: 82,
      primaryRedFlags: ["Durability clause present"],
      clauseAudit: [],
      executionAudit: [],
      remediationBlueprint: {
        action1: "Present ID",
        action2: "Affidavit",
        concreteFix: "None",
        affidavitTemplate: "Template",
      },
      extractedData: {
        principal: "John Smith",
        agent: "Jane Smith",
        state: "NY",
        date: "2026-01-01",
      },
    },
    isDemo: false,
    isSample: false,
    createdAt: new Date().toISOString(),
  };

  const caseRejection: CaseRecord = {
    id: "case-int-rejection",
    orgId: "org_test_firm",
    userId: "user_test_admin",
    title: "Mary Miller · Wells Fargo Rejection",
    kind: "diagnosis",
    status: "ready",
    bankTarget: "Wells Fargo",
    state: "FL",
    principal: "Mary Miller",
    agent: "David Miller",
    executionDate: "2025-05-01",
    fileName: "mary-poa.pdf",
    score: 40,
    summary: "Rejection diagnosis: missing gifts rider.",
    findings: {
      id: "case-int-rejection",
      timestamp: Date.now(),
      bankName: "Wells Fargo",
      rejectionReason: "Missing gift rider",
      legaleseTranslation: "Bank requires express gift rider",
      poaConflictSection: "Section 3",
      actionPlan: { step1: "Draft", step2: "Sign", step3: "Submit" },
      remediationText: "Language for counsel",
    },
    isDemo: false,
    isSample: false,
    createdAt: new Date().toISOString(),
  };

  it("lists matters and filters by mode and keyword", async () => {
    await saveCase(caseAudit);
    await saveCase(caseRejection);

    const { GET } = await import("@/app/api/cases/route");

    // 1. Filter by kind=diagnosis
    const reqDiag = new Request("http://localhost:3000/api/cases?kind=diagnosis");
    const resDiag = await GET(reqDiag);
    const dataDiag = await resDiag.json();

    expect(resDiag.status).toBe(200);
    expect(dataDiag.cases.some((c: CaseRecord) => c.id === caseRejection.id)).toBe(true);
    expect(dataDiag.cases.every((c: CaseRecord) => c.kind === "diagnosis")).toBe(true);

    // 2. Filter by search query "Smith"
    const reqSearch = new Request("http://localhost:3000/api/cases?q=Smith");
    const resSearch = await GET(reqSearch);
    const dataSearch = await resSearch.json();

    expect(resSearch.status).toBe(200);
    expect(dataSearch.cases.some((c: CaseRecord) => c.id === caseAudit.id)).toBe(true);
    expect(dataSearch.cases.some((c: CaseRecord) => c.id === caseRejection.id)).toBe(false);
  }, 15000);

  it("generates and revokes share links via API", async () => {
    const { POST } = await import("@/app/api/cases/[id]/share/route");
    const { DELETE } = await import("@/app/api/shares/[id]/route");

    // 1. Create share link
    const shareReq = new Request(`http://localhost:3000/api/cases/${caseAudit.id}/share`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ expiresInDays: 14, passcode: "SafePass" }),
    });

    const shareRes = await POST(shareReq, { params: Promise.resolve({ id: caseAudit.id }) });
    expect(shareRes.status).toBe(200);

    const shareData = await shareRes.json();
    expect(shareData.share).toBeDefined();
    expect(shareData.share.token).toBeDefined();
    expect(shareData.share.requiresPasscode).toBe(true);

    // 2. Revoke share link
    const revokeRes = await DELETE(new Request("http://localhost:3000/api/shares/" + shareData.share.id), {
      params: Promise.resolve({ id: shareData.share.id }),
    });
    expect(revokeRes.status).toBe(200);
    const revokeData = await revokeRes.json();
    expect(revokeData.ok).toBe(true);
  });
});
