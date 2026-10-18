import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { CaseReport } from "@/components/case-report";
import { WorkspaceGate } from "@/components/workspace-gate";
import { readSession } from "@/lib/session";
import { getCase } from "@/lib/store";

export const metadata: Metadata = { title: "Findings" };

export default async function CasePage({ params }: { params: Promise<{ id: string }> }) {
  const session = await readSession();
  if (!session) redirect("/sign-in");
  if (!session.orgId) return <WorkspaceGate />;
  const { id } = await params;
  try {
    const record = await getCase(session.orgId, id);
    if (!record) notFound();
    return <CaseReport record={record} />;
  } catch {
    return <p className="text-sm text-muted-foreground">That report could not be loaded.</p>;
  }
}
