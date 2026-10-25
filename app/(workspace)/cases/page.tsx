import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CaseList } from "@/components/case-list";
import { ImportDemo } from "@/components/import-demo";
import { authorize, normalizeOrgRole, type AuthScope } from "@/lib/authz";
import { dataMode } from "@/lib/config";
import { isProduction } from "@/lib/env";
import { readSession } from "@/lib/session";
import { listCases } from "@/lib/store";

export const metadata: Metadata = { title: "Matters" };

export default async function CasesPage() {
  const session = await readSession();
  if (!session) redirect("/sign-in");

  const workspaceId = session.orgId ?? session.userId;
  const scope: AuthScope = session.orgId
    ? { type: "org", orgId: session.orgId, role: normalizeOrgRole(session.orgRole) }
    : { type: "personal", ownerId: session.userId };

  const canDeleteAny = authorize(scope, "case:delete").ok;

  let cases;
  let failed = false;
  try {
    cases = await listCases(workspaceId);
  } catch {
    failed = true;
  }
  if (failed || !cases) {
    return <p className="text-sm text-muted-foreground">Case history is unavailable. Check the database connection and migration.</p>;
  }

  return (
    <div className="space-y-6">
      {cases.length === 0 && dataMode() === "postgres" && !isProduction() ? <ImportDemo /> : null}
      <CaseList cases={cases} canMutate={canDeleteAny} />
    </div>
  );
}
