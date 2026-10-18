import { z } from "zod";
import { badRequest, requireWorkspace } from "@/lib/api";
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
    await deleteCase(session.orgId, parsed.data);
    return NextResponse.json({ ok: true });
  } catch {
    return badRequest("That matter could not be removed.");
  }
}
