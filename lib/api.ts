import "server-only";
import { NextResponse } from "next/server";
import { readSession } from "@/lib/session";
import { normalizeOrgRole, type AuthScope } from "@/lib/authz";

export interface WorkspaceSession {
  userId: string;
  orgId: string;
  scope: AuthScope;
}

export async function requireWorkspace(): Promise<
  | { session: WorkspaceSession; response: null }
  | { session: null; response: NextResponse }
> {
  const session = await readSession();
  if (!session) {
    return {
      session: null,
      response: NextResponse.json(
        { error: "Sign in required.", code: "unauthenticated" },
        { status: 401 }
      ),
    };
  }

  const scope: AuthScope = session.orgId
    ? {
        type: "org",
        orgId: session.orgId,
        role: normalizeOrgRole(session.orgRole),
      }
    : {
        type: "personal",
        ownerId: session.userId,
      };

  const activeWorkspaceId = scope.type === "org" ? scope.orgId : scope.ownerId;

  return {
    session: {
      userId: session.userId,
      orgId: activeWorkspaceId,
      scope,
    },
    response: null,
  };
}

export function badRequest(error: string, status = 400, extra?: Record<string, unknown>) {
  return NextResponse.json({ error, ...extra }, { status });
}

export function forbidden(error = "You do not have permission to perform this action.") {
  return NextResponse.json({ error, code: "forbidden" }, { status: 403 });
}

export function notFound(error = "The requested resource could not be found.") {
  return NextResponse.json({ error, code: "not_found" }, { status: 404 });
}
