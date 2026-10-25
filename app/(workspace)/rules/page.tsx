import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { RuleLibrary } from "@/components/rule-library";
import { authorize, normalizeOrgRole, type AuthScope } from "@/lib/authz";
import { readSession } from "@/lib/session";
import { listRules } from "@/lib/store";

export const metadata: Metadata = { title: "Rule library" };

export default async function RulesPage() {
  const session = await readSession();
  if (!session) redirect("/sign-in");

  const workspaceId = session.orgId ?? session.userId;
  const scope: AuthScope = session.orgId
    ? { type: "org", orgId: session.orgId, role: normalizeOrgRole(session.orgRole) }
    : { type: "personal", ownerId: session.userId };

  const canAdd = authorize(scope, "rule:write").ok;

  let rules;
  let failed = false;
  try {
    rules = await listRules(workspaceId);
  } catch {
    failed = true;
  }
  if (failed || !rules) return <p className="text-sm text-muted-foreground">The rule library could not be loaded.</p>;
  return <RuleLibrary rules={rules} canAdd={canAdd} />;
}
