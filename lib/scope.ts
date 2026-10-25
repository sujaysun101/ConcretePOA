import "server-only";
import { NextResponse } from "next/server";
import { readSession } from "@/lib/session";
import { normalizeOrgRole, type AuthScope } from "@/lib/authz";

export interface WorkspaceContext {
  userId: string;
  scope: AuthScope;
}

export async function requireWorkspace(): Promise<
  | { context: WorkspaceContext; response: null }
  | { context: null; response: NextResponse }
> {
  const session = await readSession();
  if (!session) {
    return {
      context: null,
      response: NextResponse.json(
        { error: "Sign in required.", code: "unauthenticated" },
        { status: 401 }
      ),
    };
  }

  // If org is active, scope is org; otherwise personal workspace
  if (session.orgId) {
    return {
      context: {
        userId: session.userId,
        scope: {
          type: "org",
          orgId: session.orgId,
          role: normalizeOrgRole(session.orgRole),
        },
      },
      response: null,
    };
  }

  // Personal individual workspace
  return {
    context: {
      userId: session.userId,
      scope: {
        type: "personal",
        ownerId: session.userId,
      },
    },
    response: null,
  };
}

export function badRequest(error: string, status = 400, extra?: Record<string, unknown>) {
  return NextResponse.json({ error, ...extra }, { status });
}
