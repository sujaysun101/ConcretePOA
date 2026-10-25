import { describe, expect, it } from "vitest";
import { authorize, isOrgRole, normalizeOrgRole, type AuthScope, type ResourceOwnership } from "@/lib/authz";

describe("lib/authz RBAC & tenant isolation matrix", () => {
  const personalScope: AuthScope = { type: "personal", ownerId: "user_alice" };
  const orgAdminScope: AuthScope = { type: "org", orgId: "org_firm1", role: "org:admin" };
  const orgReviewerScope: AuthScope = { type: "org", orgId: "org_firm1", role: "org:reviewer" };
  const orgViewerScope: AuthScope = { type: "org", orgId: "org_firm1", role: "org:viewer" };
  const platformAdminScope: AuthScope = { type: "platform", role: "admin" };

  const ownPersonalCase: ResourceOwnership = {
    ownerType: "personal",
    ownerId: "user_alice",
    createdBy: "user_alice",
  };

  const otherPersonalCase: ResourceOwnership = {
    ownerType: "personal",
    ownerId: "user_bob",
    createdBy: "user_bob",
  };

  const firm1CaseAlice: ResourceOwnership = {
    ownerType: "org",
    ownerId: "org_firm1",
    createdBy: "user_alice",
  };

  const firm1CaseBob: ResourceOwnership = {
    ownerType: "org",
    ownerId: "org_firm1",
    createdBy: "user_bob",
  };

  const firm2Case: ResourceOwnership = {
    ownerType: "org",
    ownerId: "org_firm2",
    createdBy: "user_charlie",
  };

  describe("Personal Workspace (Individual Caregiver / Principal)", () => {
    it("allows case lifecycle actions within own scope", () => {
      expect(authorize(personalScope, "case:create")).toEqual({ ok: true });
      expect(authorize(personalScope, "case:read", ownPersonalCase)).toEqual({ ok: true });
      expect(authorize(personalScope, "case:export", ownPersonalCase)).toEqual({ ok: true });
      expect(authorize(personalScope, "case:delete", ownPersonalCase)).toEqual({ ok: true });
      expect(authorize(personalScope, "case:share", ownPersonalCase)).toEqual({ ok: true });
      expect(authorize(personalScope, "rule:write")).toEqual({ ok: true });
      expect(authorize(personalScope, "audit:read")).toEqual({ ok: true });
    });

    it("prevents org management or admin actions", () => {
      expect(authorize(personalScope, "org:members").ok).toBe(false);
      expect(authorize(personalScope, "org:settings").ok).toBe(false);
      expect(authorize(personalScope, "admin:*").ok).toBe(false);
      expect(authorize(orgAdminScope, "admin:*").ok).toBe(false);
    });

    it("returns not_found when accessing other personal or firm resources", () => {
      expect(authorize(personalScope, "case:read", otherPersonalCase)).toEqual({
        ok: false,
        code: "not_found",
        reason: "The requested resource was not found.",
      });
      expect(authorize(personalScope, "case:read", firm1CaseAlice)).toEqual({
        ok: false,
        code: "not_found",
        reason: "The requested resource was not found.",
      });
    });
  });

  describe("Organization Admin (org:admin)", () => {
    it("has full authority across all matters and rules in the organization", () => {
      expect(authorize(orgAdminScope, "case:create")).toEqual({ ok: true });
      expect(authorize(orgAdminScope, "case:read", firm1CaseAlice)).toEqual({ ok: true });
      expect(authorize(orgAdminScope, "case:read", firm1CaseBob)).toEqual({ ok: true });
      expect(authorize(orgAdminScope, "case:export", firm1CaseAlice)).toEqual({ ok: true });
      expect(authorize(orgAdminScope, "case:delete", firm1CaseBob, "user_alice")).toEqual({ ok: true });
      expect(authorize(orgAdminScope, "case:share", firm1CaseAlice)).toEqual({ ok: true });
      expect(authorize(orgAdminScope, "rule:write")).toEqual({ ok: true });
      expect(authorize(orgAdminScope, "org:members")).toEqual({ ok: true });
      expect(authorize(orgAdminScope, "org:settings")).toEqual({ ok: true });
      expect(authorize(orgAdminScope, "audit:read")).toEqual({ ok: true });
    });

    it("cannot access other tenants (returns not_found)", () => {
      expect(authorize(orgAdminScope, "case:read", firm2Case)).toEqual({
        ok: false,
        code: "not_found",
        reason: "The requested resource was not found.",
      });
    });
  });

  describe("Organization Reviewer (org:reviewer)", () => {
    it("can create, read, export, and share org matters", () => {
      expect(authorize(orgReviewerScope, "case:create")).toEqual({ ok: true });
      expect(authorize(orgReviewerScope, "case:read", firm1CaseBob)).toEqual({ ok: true });
      expect(authorize(orgReviewerScope, "case:export", firm1CaseBob)).toEqual({ ok: true });
      expect(authorize(orgReviewerScope, "case:share", firm1CaseBob)).toEqual({ ok: true });
    });

    it("can delete only their own initiated matters, not others'", () => {
      // Alice deleting matter created by Alice
      expect(authorize(orgReviewerScope, "case:delete", firm1CaseAlice, "user_alice")).toEqual({
        ok: true,
      });

      // Alice attempting to delete matter created by Bob
      const result = authorize(orgReviewerScope, "case:delete", firm1CaseBob, "user_alice");
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.code).toBe("forbidden");
        expect(result.reason).toContain("Reviewers can only delete matters they personally initiated");
      }
    });

    it("cannot modify org rules, manage members, or inspect full audit logs", () => {
      expect(authorize(orgReviewerScope, "rule:write").ok).toBe(false);
      expect(authorize(orgReviewerScope, "org:members").ok).toBe(false);
      expect(authorize(orgReviewerScope, "org:settings").ok).toBe(false);
      expect(authorize(orgReviewerScope, "audit:read").ok).toBe(false);
    });
  });

  describe("Organization Viewer (org:viewer)", () => {
    it("can read and export matters within the firm", () => {
      expect(authorize(orgViewerScope, "case:read", firm1CaseAlice)).toEqual({ ok: true });
      expect(authorize(orgViewerScope, "case:export", firm1CaseAlice)).toEqual({ ok: true });
    });

    it("is strictly forbidden from creating, deleting, sharing, or editing rules", () => {
      const createRes = authorize(orgViewerScope, "case:create");
      expect(createRes.ok).toBe(false);
      if (!createRes.ok) expect(createRes.code).toBe("forbidden");

      const deleteRes = authorize(orgViewerScope, "case:delete", firm1CaseAlice, "user_alice");
      expect(deleteRes.ok).toBe(false);
      if (!deleteRes.ok) expect(deleteRes.code).toBe("forbidden");

      const shareRes = authorize(orgViewerScope, "case:share", firm1CaseAlice);
      expect(shareRes.ok).toBe(false);
      if (!shareRes.ok) expect(shareRes.code).toBe("forbidden");

      const ruleRes = authorize(orgViewerScope, "rule:write");
      expect(ruleRes.ok).toBe(false);
      if (!ruleRes.ok) expect(ruleRes.code).toBe("forbidden");
    });
  });

  describe("Platform Admin (platform:admin)", () => {
    it("has access to platform administration and global audit metadata", () => {
      expect(authorize(platformAdminScope, "admin:*")).toEqual({ ok: true });
      expect(authorize(platformAdminScope, "audit:read")).toEqual({ ok: true });
    });

    it("has zero access to client document content by default (privacy boundary)", () => {
      expect(authorize(platformAdminScope, "case:create").ok).toBe(false);
      expect(authorize(platformAdminScope, "case:read", firm1CaseAlice).ok).toBe(false);
      expect(authorize(platformAdminScope, "case:export", firm1CaseAlice).ok).toBe(false);
      expect(authorize(platformAdminScope, "case:delete", firm1CaseAlice).ok).toBe(false);
    });
  });

  describe("Role helper utilities", () => {
    it("validates and normalizes organization roles correctly", () => {
      expect(isOrgRole("org:admin")).toBe(true);
      expect(isOrgRole("org:reviewer")).toBe(true);
      expect(isOrgRole("org:viewer")).toBe(true);
      expect(isOrgRole("other")).toBe(false);

      expect(normalizeOrgRole("admin")).toBe("org:admin");
      expect(normalizeOrgRole("org:admin")).toBe("org:admin");
      expect(normalizeOrgRole("member")).toBe("org:reviewer");
      expect(normalizeOrgRole("org:member")).toBe("org:reviewer");
      expect(normalizeOrgRole("org:reviewer")).toBe("org:reviewer");
      expect(normalizeOrgRole("org:viewer")).toBe("org:viewer");
      expect(normalizeOrgRole("unknown")).toBe("org:viewer");
      expect(normalizeOrgRole(null)).toBe("org:viewer");
    });

    it("handles unexpected permission gracefully with forbidden", () => {
      // @ts-expect-error testing invalid permission
      expect(authorize(personalScope, "invalid:perm").ok).toBe(false);
      // @ts-expect-error testing invalid permission
      expect(authorize(personalScope, "unknown:perm" as unknown as Permission).ok).toBe(false);
      // @ts-expect-error testing invalid permission
      expect(authorize(orgAdminScope, "invalid:perm").ok).toBe(false);
    });
  });
});
