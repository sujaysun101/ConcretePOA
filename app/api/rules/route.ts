import { ruleInputSchema } from "@/lib/ai/schemas";
import { badRequest, requireWorkspace } from "@/lib/api";
import { authorize } from "@/lib/authz";
import { addRule, listRules } from "@/lib/store";
import { NextResponse } from "next/server";

export async function GET() {
  const { session, response } = await requireWorkspace();
  if (!session) return response;
  try {
    const rules = await listRules(session.orgId);
    return NextResponse.json({ rules });
  } catch {
    return badRequest("The rule library could not be loaded.");
  }
}

export async function POST(request: Request) {
  const { session, response } = await requireWorkspace();
  if (!session) return response;

  const authz = authorize(session.scope, "rule:write");
  if (!authz.ok) {
    return NextResponse.json({ error: authz.reason, code: authz.code }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return badRequest("Send the rule as JSON.");
  }
  const parsed = ruleInputSchema.safeParse(body);
  if (!parsed.success) return badRequest("Check the rule fields and try again.");
  try {
    const currentYear = new Date().getFullYear();
    const rule = await addRule({
      id: crypto.randomUUID(),
      orgId: session.orgId,
      scope: parsed.data.scope,
      jurisdiction: parsed.data.jurisdiction || null,
      institution: parsed.data.institution || null,
      topic: parsed.data.topic,
      requirement: parsed.data.requirement,
      severity: parsed.data.severity,
      citation: parsed.data.citation || null,
      notes: parsed.data.notes || null,
      year: currentYear,
      custom: true,
    });
    return NextResponse.json({ rule });
  } catch {
    return badRequest("The rule could not be saved.");
  }
}
