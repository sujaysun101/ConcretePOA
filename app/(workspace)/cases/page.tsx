import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CaseList } from "@/components/case-list";
import { ImportDemo } from "@/components/import-demo";
import { WorkspaceGate } from "@/components/workspace-gate";
import { dataMode } from "@/lib/config";
import { readSession } from "@/lib/session";
import { listCases } from "@/lib/store";

export const metadata: Metadata = { title: "Matters" };

export default async function CasesPage() {
  const session = await readSession();
  if (!session) redirect("/sign-in");
  if (!session.orgId) return <WorkspaceGate />;
  try {
    const cases = await listCases(session.orgId);
    return (
      <div className="space-y-6">
        {cases.length === 0 && dataMode() === "postgres" ? <ImportDemo /> : null}
        <CaseList cases={cases} canMutate />
      </div>
    );
  } catch {
    return <p className="text-sm text-muted-foreground">Case history is unavailable. Check the database connection and migration.</p>;
  }
}
