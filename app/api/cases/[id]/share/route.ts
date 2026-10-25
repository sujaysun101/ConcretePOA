import "server-only";
import { NextResponse } from "next/server";
import { requireWorkspace, notFound, forbidden, badRequest } from "@/lib/api";
import { authorize } from "@/lib/authz";
import { getCase } from "@/lib/store";
import { createShareLink } from "@/lib/share";
import { z } from "zod";

export const runtime = "nodejs";

const createShareSchema = z.object({
  expiresInDays: z.number().int().min(1).max(30).optional().default(7),
  passcode: z.string().trim().min(4).max(64).optional(),
});

export async function POST(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  const { session, response } = await requireWorkspace();
  if (!session) return response;

  const authz = authorize(session.scope, "case:share");
  if (!authz.ok) return forbidden(authz.reason);

  const { id } = await props.params;
  const item = await getCase(session.orgId, id);
  if (!item) return notFound();

  let body: unknown = {};
  try {
    body = await request.json();
  } catch {
    // Body is optional, defaults to 7 days
  }

  const parsed = createShareSchema.safeParse(body);
  if (!parsed.success) {
    return badRequest("Invalid share settings.");
  }

  const result = await createShareLink({
    caseId: id,
    createdBy: session.userId,
    expiresInDays: parsed.data.expiresInDays,
    passcode: parsed.data.passcode,
    reqHeaders: request.headers,
  });

  return NextResponse.json({ share: result });
}
