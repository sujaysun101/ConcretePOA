import { badRequest, requireWorkspace } from "@/lib/api";
import { importDemoCases } from "@/lib/store";
import { NextResponse } from "next/server";

export async function POST() {
  const { session, response } = await requireWorkspace();
  if (!session) return response;
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
