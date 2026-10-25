import { describe, expect, it } from "vitest";
import { authorize, type AuthScope, type ResourceOwnership } from "@/lib/authz";

describe("API route authorization and cross-tenant isolation", () => {
  const alicePersonal: AuthScope = { type: "personal", ownerId: "user_alice" };
  const bobPersonal: AuthScope = { type: "personal", ownerId: "user_bob" };

  const firmAdmin: AuthScope = { type: "org", orgId: "org_alpha", role: "org:admin" };
  const firmReviewer: AuthScope = { type: "org", orgId: "org_alpha", role: "org:reviewer" };
  const firmViewer: AuthScope = { type: "org", orgId: "org_alpha", role: "org:viewer" };

  const betaFirmAdmin: AuthScope = { type: "org", orgId: "org_beta", role: "org:admin" };

  const aliceMatter: ResourceOwnership = {
    ownerType: "personal",
    ownerId: "user_alice",
    createdBy: "user_alice",
  };

  const alphaMatterStaff1: ResourceOwnership = {
    ownerType: "org",
    ownerId: "org_alpha",
    createdBy: "staff_1",
  };

  const alphaMatterStaff2: ResourceOwnership = {
    ownerType: "org",
    ownerId: "org_alpha",
    createdBy: "staff_2",
  };

  const betaMatter: ResourceOwnership = {
    ownerType: "org",
    ownerId: "org_beta",
    createdBy: "staff_beta",
  };

  describe("Cross-tenant isolation (Anti-probing security)", () => {
    it("returns not_found when Bob tries to read Alice's personal matter", () => {
      const res = authorize(bobPersonal, "case:read", aliceMatter);
      expect(res.ok).toBe(false);
      if (!res.ok) {
        expect(res.code).toBe("not_found");
      }
    });

    it("returns not_found when Firm Alpha tries to read Firm Beta's matter", () => {
      const res = authorize(firmAdmin, "case:read", betaMatter);
      expect(res.ok).toBe(false);
      if (!res.ok) {
        expect(res.code).toBe("not_found");
      }
    });

    it("returns not_found when Firm Beta tries to delete Firm Alpha's matter", () => {
      const res = authorize(betaFirmAdmin, "case:delete", alphaMatterStaff1, "staff_beta");
      expect(res.ok).toBe(false);
      if (!res.ok) {
        expect(res.code).toBe("not_found");
      }
    });
  });

  describe("Same-tenant role restrictions (403 Forbidden)", () => {
    it("rejects Viewer attempting to run compliance audit (case:create)", () => {
      const res = authorize(firmViewer, "case:create");
      expect(res.ok).toBe(false);
      if (!res.ok) {
        expect(res.code).toBe("forbidden");
        expect(res.reason).toContain("Viewer");
      }
    });

    it("rejects Viewer attempting to create custom rules (rule:write)", () => {
      const res = authorize(firmViewer, "rule:write");
      expect(res.ok).toBe(false);
      if (!res.ok) {
        expect(res.code).toBe("forbidden");
      }
    });

    it("rejects Reviewer attempting to delete another member's case", () => {
      const res = authorize(firmReviewer, "case:delete", alphaMatterStaff2, "staff_1");
      expect(res.ok).toBe(false);
      if (!res.ok) {
        expect(res.code).toBe("forbidden");
        expect(res.reason).toContain("Reviewers can only delete matters they personally initiated");
      }
    });

    it("allows Reviewer to delete their own created case", () => {
      const res = authorize(firmReviewer, "case:delete", alphaMatterStaff1, "staff_1");
      expect(res.ok).toBe(true);
    });

    it("allows Admin to delete any case within the firm", () => {
      const res = authorize(firmAdmin, "case:delete", alphaMatterStaff1, "admin_user");
      expect(res.ok).toBe(true);
    });
  });
});
