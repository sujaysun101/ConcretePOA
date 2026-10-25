import "server-only";
import { NextResponse } from "next/server";
import { requireWorkspace } from "@/lib/api";
import { authorize } from "@/lib/authz";
import { recordAuditEvent } from "@/lib/audit";
import { getCasesForExport, purgeUserData } from "@/lib/store";
import { logger } from "@/lib/log";

export const runtime = "nodejs";

/**
 * GDPR / CCPA self-serve data portability export.
 */
export async function GET() {
  const { session, response } = await requireWorkspace();
  if (!session) return response;

  const authz = authorize(session.scope, "data:export_self");
  if (!authz.ok) {
    return NextResponse.json({ error: authz.reason, code: authz.code }, { status: 403 });
  }

  try {
    const userCases = await getCasesForExport(session.userId);

    await recordAuditEvent({
      actorUserId: session.userId,
      actorType: "user",
      scopeType: session.scope.type,
      scopeId: session.orgId,
      action: "user.export",
      targetType: "user",
      targetId: session.userId,
      metadata: { recordCount: userCases.length },
    });

    return NextResponse.json({
      exportDate: new Date().toISOString(),
      userId: session.userId,
      workspace: session.scope,
      records: userCases,
    });
  } catch (err) {
    logger.error({
      event: "user_export_failed",
      error: err instanceof Error ? err.message : "Data export failed",
    });
    return NextResponse.json({ error: "Unable to compile data export." }, { status: 500 });
  }
}

/**
 * GDPR / CCPA self-serve right to erasure.
 */
export async function DELETE() {
  const { session, response } = await requireWorkspace();
  if (!session) return response;

  const authz = authorize(session.scope, "account:delete_self");
  if (!authz.ok) {
    return NextResponse.json({ error: authz.reason, code: authz.code }, { status: 403 });
  }

  try {
    await purgeUserData(session.userId);

    await recordAuditEvent({
      actorUserId: session.userId,
      actorType: "user",
      scopeType: session.scope.type,
      scopeId: session.orgId,
      action: "user.delete",
      targetType: "user",
      targetId: session.userId,
    });

    return NextResponse.json({ ok: true, message: "Account data purged." });
  } catch (err) {
    logger.error({
      event: "user_delete_failed",
      error: err instanceof Error ? err.message : "Data deletion failed",
    });
    return NextResponse.json({ error: "Unable to process account deletion." }, { status: 500 });
  }
}
