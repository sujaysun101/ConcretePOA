import { describe, expect, it } from "vitest";
import { createShareLink, resolveShareToken, revokeShareLink } from "@/lib/share";
import { saveCase } from "@/lib/store";
import type { CaseRecord } from "@/lib/types";

describe("Share Links (lib/share.ts)", () => {
  const dummyCase: CaseRecord = {
    id: "case-share-test",
    orgId: "org-share-test",
    userId: "user-share-test",
    title: "Test Share Case",
    kind: "audit",
    status: "ready",
    bankTarget: "Chase",
    state: "NY",
    principal: "Alice",
    agent: "Bob",
    executionDate: "2026-01-01",
    fileName: "alice-poa.pdf",
    score: 85,
    summary: "Audit completed successfully.",
    findings: {
      id: "case-share-test",
      timestamp: Date.now(),
      bankTarget: "Chase",
      acceptanceProbability: 85,
      primaryRedFlags: [],
      clauseAudit: [],
      executionAudit: [],
      remediationBlueprint: {
        action1: "Review",
        action2: "Sign",
        concreteFix: "None",
        affidavitTemplate: "Template text",
      },
      extractedData: {
        principal: "Alice",
        agent: "Bob",
        state: "NY",
        date: "2026-01-01",
      },
    },
    isDemo: false,
    isSample: false,
    createdAt: new Date().toISOString(),
  };

  it("creates a share link without passcode and resolves it", async () => {
    await saveCase(dummyCase);

    const share = await createShareLink({
      caseId: dummyCase.id,
      createdBy: "user-share-test",
      expiresInDays: 7,
    });

    expect(share.id).toBeDefined();
    expect(share.token).toBeDefined();
    expect(share.url).toContain(`/r/${share.token}`);
    expect(share.requiresPasscode).toBe(false);

    const resolved = await resolveShareToken(share.token);
    expect(resolved).not.toBeNull();
    expect(resolved?.caseRecord.id).toBe(dummyCase.id);
    expect(resolved?.isUnlocked).toBe(true);
  });

  it("protects share link with passcode and enforces unlock", async () => {
    const share = await createShareLink({
      caseId: dummyCase.id,
      createdBy: "user-share-test",
      expiresInDays: 3,
      passcode: "SecretPass123",
    });

    expect(share.requiresPasscode).toBe(true);

    // Resolving without passcode -> locked
    const locked = await resolveShareToken(share.token);
    expect(locked).not.toBeNull();
    expect(locked?.requiresPasscode).toBe(true);
    expect(locked?.isUnlocked).toBe(false);

    // Resolving with wrong passcode -> locked
    const wrong = await resolveShareToken(share.token, "WrongPassword");
    expect(wrong?.isUnlocked).toBe(false);

    // Resolving with correct passcode -> unlocked
    const unlocked = await resolveShareToken(share.token, "SecretPass123");
    expect(unlocked?.isUnlocked).toBe(true);
  });

  it("revokes a share link immediately", async () => {
    const share = await createShareLink({
      caseId: dummyCase.id,
      createdBy: "user-share-test",
    });

    const beforeRevoke = await resolveShareToken(share.token);
    expect(beforeRevoke).not.toBeNull();

    await revokeShareLink(share.id, "user-share-test");

    const afterRevoke = await resolveShareToken(share.token);
    expect(afterRevoke).toBeNull();
  });
});
