import "server-only";
import { badRequest, requireWorkspace } from "@/lib/api";
import { authorize } from "@/lib/authz";
import { recordAuditEvent } from "@/lib/audit";
import { deleteRule, getRule, updateRule } from "@/lib/store";
import { ruleInputSchema } from "@/lib/ai/schemas";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { session, response } = await requireWorkspace();
  if (!session) return response;

  const authz = authorize(session.scope, "rule:write");
  if (!authz.ok) {
    return NextResponse.json({ error: authz.reason, code: authz.code }, { status: 403 });
  }

  const { id } = await context.params;
  const existing = await getRule(id);
  if (!existing) return badRequest("Rule not found.", 404);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return badRequest("Send JSON with updated rule fields.");
  }

  const parsed = ruleInputSchema.safeParse(body);
  if (!parsed.success) {
    return badRequest(parsed.error.errors[0]?.message ?? "Invalid rule attributes.");
  }

  try {
    const updated = await updateRule(id, {
      ...parsed.data,
      topic: parsed.data.topic,
      requirement: parsed.data.requirement,
      severity: parsed.data.severity,
      citation: parsed.data.citation ?? null,
      notes: parsed.data.notes ?? null,
    });

    await recordAuditEvent({
      actorUserId: session.userId,
      actorType: "user",
      scopeType: session.scope.type,
      scopeId: session.orgId,
      action: "rule.update",
      targetType: "rule",
      targetId: id,
    });

    return NextResponse.json({ record: updated });
  } catch {
    return badRequest("Failed to update rule.", 500);
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { session, response } = await requireWorkspace();
  if (!session) return response;

  const authz = authorize(session.scope, "rule:write");
  if (!authz.ok) {
    return NextResponse.json({ error: authz.reason, code: authz.code }, { status: 403 });
  }

  const { id } = await context.params;
  const existing = await getRule(id);
  if (!existing) return badRequest("Rule not found.", 404);

  try {
    await deleteRule(id);

    await recordAuditEvent({
      actorUserId: session.userId,
      actorType: "user",
      scopeType: session.scope.type,
      scopeId: session.orgId,
      action: "rule.delete",
      targetType: "rule",
      targetId: id,
    });

    return NextResponse.json({ ok: true });
  } catch {
    return badRequest("Failed to delete rule.", 500);
  }
}
