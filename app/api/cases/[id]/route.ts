import { z } from "zod";
import { badRequest, requireWorkspace } from "@/lib/api";
import { authorize } from "@/lib/authz";
import { deleteCase, getCase } from "@/lib/store";
import { NextResponse } from "next/server";

const idSchema = z.string().trim().min(1).max(80);

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { session, response } = await requireWorkspace();
  if (!session) return response;
  const { id } = await context.params;
  const parsed = idSchema.safeParse(id);
  if (!parsed.success) return badRequest("That matter id is not valid.");
  try {
    const record = await getCase(session.orgId, parsed.data);
    if (!record) return badRequest("That matter is not in this workspace.", 404);

    const authz = authorize(
      session.scope,
      "case:read",
      {
        ownerType: session.scope.type,
        ownerId: session.orgId,
        createdBy: record.userId,
      },
      session.userId
    );
    if (!authz.ok) {
      const status = authz.code === "not_found" ? 404 : 403;
      return NextResponse.json({ error: authz.reason, code: authz.code }, { status });
    }

    return NextResponse.json({ record });
  } catch {
    return badRequest("That matter could not be loaded.");
  }
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { session, response } = await requireWorkspace();
  if (!session) return response;
  const { id } = await context.params;
  const parsed = idSchema.safeParse(id);
  if (!parsed.success) return badRequest("That matter id is not valid.");
  try {
    const record = await getCase(session.orgId, parsed.data);
    if (!record) return badRequest("That matter is not in this workspace.", 404);

    const authz = authorize(
      session.scope,
      "case:delete",
      {
        ownerType: session.scope.type,
        ownerId: session.orgId,
        createdBy: record.userId,
      },
      session.userId
    );
    if (!authz.ok) {
      return NextResponse.json({ error: authz.reason, code: authz.code }, { status: 403 });
    }

    await deleteCase(session.orgId, parsed.data);
    return NextResponse.json({ ok: true });
  } catch {
    return badRequest("That matter could not be removed.");
  }
}
