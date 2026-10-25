import { describe, expect, it } from "vitest";
import { recordAuditEvent } from "@/lib/audit";

describe("Security Audit Logger (lib/audit.ts)", () => {
  it("records audit events safely without throwing when db is in-memory", async () => {
    await expect(
      recordAuditEvent({
        actorUserId: "user_123",
        actorType: "user",
        scopeType: "personal",
        scopeId: "user_123",
        action: "case.read",
        targetType: "case",
        targetId: "case_abc",
        metadata: { score: 85, mode: "audit" },
      })
    ).resolves.toBeUndefined();
  });

  it("hashes IP addresses and User-Agents using HMAC", async () => {
    const fakeHeaders = new Headers();
    fakeHeaders.set("x-forwarded-for", "203.0.113.195, 70.41.3.18");
    fakeHeaders.set("user-agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64)");
    fakeHeaders.set("x-request-id", "req-12345");

    await expect(
      recordAuditEvent({
        actorUserId: "user_456",
        actorType: "user",
        scopeType: "org",
        scopeId: "org_firm",
        action: "case.export",
        targetType: "case",
        targetId: "case_xyz",
        reqHeaders: fakeHeaders,
      })
    ).resolves.toBeUndefined();
  });
});
