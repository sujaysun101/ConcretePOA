import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { RuleLibrary } from "@/components/rule-library";
import { WorkspaceGate } from "@/components/workspace-gate";
import { readSession } from "@/lib/session";
import { listRules } from "@/lib/store";

export const metadata: Metadata = { title: "Rule library" };

export default async function RulesPage() {
  const session = await readSession();
  if (!session) redirect("/sign-in");
  if (!session.orgId) return <WorkspaceGate />;
  try {
    const rules = await listRules(session.orgId);
    return <RuleLibrary rules={rules} canAdd />;
  } catch {
    return <p className="text-sm text-muted-foreground">The rule library could not be loaded.</p>;
  }
}
