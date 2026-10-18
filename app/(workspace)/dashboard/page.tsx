import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { DashboardView } from "@/components/dashboard-view";
import { WorkspaceGate } from "@/components/workspace-gate";
import { readSession } from "@/lib/session";
import { dashboard } from "@/lib/store";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const session = await readSession();
  if (!session) redirect("/sign-in");
  if (!session.orgId) return <WorkspaceGate />;
  let data;
  let failed = false;
  try {
    data = await dashboard(session.orgId);
  } catch {
    failed = true;
  }
  if (failed || !data) return <StoreError />;
  return <DashboardView data={data} />;
}

function StoreError() {
  return (
    <div className="rounded-3xl border border-border bg-card p-8">
      <h1 className="font-serif text-3xl">Case history is unavailable.</h1>
      <p className="mt-2 text-sm text-muted-foreground">The database did not answer. Check DATABASE_URL and run the migration. Nothing on this page includes connection details.</p>
    </div>
  );
}
