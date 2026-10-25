import "server-only";

export type Role = "individual" | "org:admin" | "org:reviewer" | "org:viewer" | "platform:admin";

export type Permission =
  | "case:create"
  | "case:read"
  | "case:export"
  | "case:delete"
  | "case:share"
  | "rule:write"
  | "org:members"
  | "org:settings"
  | "audit:read"
  | "admin:*"
  | "data:export_self"
  | "account:delete_self";

export type AuthScope =
  | { type: "personal"; ownerId: string }
  | { type: "org"; orgId: string; role: "org:admin" | "org:reviewer" | "org:viewer" }
  | { type: "platform"; role: "admin" };

export interface ResourceOwnership {
  ownerType: "personal" | "org" | "platform";
  ownerId: string;
  createdBy?: string;
}

export type AuthzResult =
  | { ok: true }
  | { ok: false; code: "forbidden" | "not_found"; reason: string };

export function isOrgRole(role: string): role is "org:admin" | "org:reviewer" | "org:viewer" {
  return role === "org:admin" || role === "org:reviewer" || role === "org:viewer";
}

export function normalizeOrgRole(role: string | null | undefined): "org:admin" | "org:reviewer" | "org:viewer" {
  if (role === "org:admin" || role === "admin") return "org:admin";
  if (role === "org:reviewer" || role === "org:member" || role === "member") return "org:reviewer";
  return "org:viewer";
}

/**
 * Evaluates whether a given actor scope and userId has permission to execute an action
 * on an optional target resource.
 *
 * Rules:
 * - Cross-tenant resource checks return code "not_found" to prevent tenant probing.
 * - Same-tenant but insufficient privilege returns code "forbidden".
 */
export function authorize(
  scope: AuthScope,
  permission: Permission,
  resource?: ResourceOwnership,
  userId?: string
): AuthzResult {
  // If target resource is specified, verify tenant boundary first
  if (resource) {
    if (scope.type === "personal") {
      if (resource.ownerType !== "personal" || resource.ownerId !== scope.ownerId) {
        return { ok: false, code: "not_found", reason: "The requested resource was not found." };
      }
    } else if (scope.type === "org") {
      if (resource.ownerType !== "org" || resource.ownerId !== scope.orgId) {
        return { ok: false, code: "not_found", reason: "The requested resource was not found." };
      }
    }
  }

  // Platform admin permissions
  if (scope.type === "platform") {
    if (permission === "admin:*" || permission === "audit:read") {
      return { ok: true };
    }
    return {
      ok: false,
      code: "forbidden",
      reason: "Platform administrators do not have access to client document content.",
    };
  }

  // Personal workspace permissions
  if (scope.type === "personal") {
    switch (permission) {
      case "case:create":
      case "case:read":
      case "case:export":
      case "case:delete":
      case "case:share":
      case "rule:write":
      case "audit:read":
        return { ok: true };
      case "org:members":
      case "org:settings":
        return { ok: false, code: "forbidden", reason: "Action not supported in personal workspaces." };
      case "data:export_self":
      case "account:delete_self":
        return { ok: true };
      case "admin:*":
        return { ok: false, code: "forbidden", reason: "Action not supported in personal workspaces." };
      default:
        return { ok: false, code: "forbidden", reason: "Permission denied." };
    }
  }

  // Organization workspace permissions (RBAC)
  const role = scope.role;

  switch (permission) {
    case "case:create":
      if (role === "org:admin" || role === "org:reviewer") {
        return { ok: true };
      }
      return {
        ok: false,
        code: "forbidden",
        reason: "Your role (Viewer) can inspect matters but cannot run new compliance reviews.",
      };

    case "case:read":
    case "case:export":
      return { ok: true };

    case "case:delete":
      if (role === "org:admin") {
        return { ok: true };
      }
      if (role === "org:reviewer") {
        if (resource?.createdBy && userId && resource.createdBy === userId) {
          return { ok: true };
        }
        return {
          ok: false,
          code: "forbidden",
          reason: "Reviewers can only delete matters they personally initiated. Contact an admin.",
        };
      }
      return {
        ok: false,
        code: "forbidden",
        reason: "Viewers do not have permission to delete matters.",
      };

    case "case:share":
      if (role === "org:admin" || role === "org:reviewer") {
        return { ok: true };
      }
      return {
        ok: false,
        code: "forbidden",
        reason: "Viewers do not have permission to generate external share links.",
      };

    case "rule:write":
      if (role === "org:admin") {
        return { ok: true };
      }
      return {
        ok: false,
        code: "forbidden",
        reason: "Only organization admins can configure workspace rules and custom institutions.",
      };

    case "org:members":
    case "org:settings":
      if (role === "org:admin") {
        return { ok: true };
      }
      return {
        ok: false,
        code: "forbidden",
        reason: "Only organization administrators can manage members and settings.",
      };

    case "audit:read":
      if (role === "org:admin") {
        return { ok: true };
      }
      return {
        ok: false,
        code: "forbidden",
        reason: "Only organization administrators can access the workspace audit log.",
      };

    case "data:export_self":
    case "account:delete_self":
      return { ok: true };

    case "admin:*":
      return { ok: false, code: "forbidden", reason: "Platform administrator access required." };

    default:
      return { ok: false, code: "forbidden", reason: "Permission denied." };
  }
}
