import "server-only";
import { NextResponse } from "next/server";
import { requireWorkspace, forbidden } from "@/lib/api";
import { authorize } from "@/lib/authz";
import { revokeShareLink } from "@/lib/share";

export const runtime = "nodejs";

export async function DELETE(
  _request: Request,
  props: { params: Promise<{ id: string }> }
) {
  const { session, response } = await requireWorkspace();
  if (!session) return response;

  const authz = authorize(session.scope, "case:share");
  if (!authz.ok) return forbidden(authz.reason);

  const { id } = await props.params;
  await revokeShareLink(id, session.userId);

  return NextResponse.json({ ok: true });
}
