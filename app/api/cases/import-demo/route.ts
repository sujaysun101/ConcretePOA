import { badRequest, requireWorkspace } from "@/lib/api";
import { authorize } from "@/lib/authz";
import { isProduction } from "@/lib/env";
import { importDemoCases } from "@/lib/store";
import { NextResponse } from "next/server";

export async function POST() {
  const { session, response } = await requireWorkspace();
  if (!session) return response;

  if (isProduction()) {
    return badRequest("Demo data import is disabled in production.", 403);
  }

  const authz = authorize(session.scope, "case:create");
  if (!authz.ok) {
    return NextResponse.json({ error: authz.reason, code: authz.code }, { status: 403 });
  }

  try {
    const records = await importDemoCases(session.orgId, session.userId);
    return NextResponse.json({ count: records.length });
  } catch (error) {
    if (error instanceof Error && error.message === "WORKSPACE_NONEMPTY") {
      return badRequest("This workspace already has matters.");
    }
    return badRequest("Demo matters could not be loaded.");
  }
}
