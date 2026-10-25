import { analyzeUpload } from "@/lib/ai/analyze";
import { analyzeInputSchema } from "@/lib/ai/schemas";
import { badRequest, requireWorkspace } from "@/lib/api";
import { authorize } from "@/lib/authz";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  const { session, response } = await requireWorkspace();
  if (!session) return response;

  const authz = authorize(session.scope, "case:create");
  if (!authz.ok) {
    return NextResponse.json({ error: authz.reason, code: authz.code }, { status: 403 });
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return badRequest("Upload the document as form data.");
  }
  const parsed = analyzeInputSchema.safeParse({
    mode: form.get("mode"),
    bank: typeof form.get("bank") === "string" && form.get("bank") ? form.get("bank") : undefined,
    customRules: typeof form.get("customRules") === "string" && form.get("customRules") ? form.get("customRules") : undefined,
  });
  if (!parsed.success) return badRequest("Check the review type, institution, and notes.");
  const poa = form.get("poa");
  const rejection = form.get("rejection");
  if (!(poa instanceof File)) return badRequest("Upload the power of attorney.");
  const result = await analyzeUpload({
    userId: session.userId,
    orgId: session.orgId,
    mode: parsed.data.mode,
    bank: parsed.data.bank,
    customRules: parsed.data.customRules,
    poa,
    rejection: rejection instanceof File ? rejection : null,
  });
  if (!result.ok) {
    return NextResponse.json(
      { error: result.error, code: result.code },
      { status: result.status, headers: result.retryAfter ? { "Retry-After": String(result.retryAfter) } : undefined },
    );
  }
  return NextResponse.json(
    { record: result.record },
    { headers: { "X-RateLimit-Remaining": String(result.remaining) } },
  );
}
