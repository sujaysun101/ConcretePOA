import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { CaseReport } from "@/components/case-report";
import { authorize, normalizeOrgRole, type AuthScope } from "@/lib/authz";
import { readSession } from "@/lib/session";
import { getCase } from "@/lib/store";

export const metadata: Metadata = { title: "Findings" };

export default async function CasePage({ params }: { params: Promise<{ id: string }> }) {
  const session = await readSession();
  if (!session) redirect("/sign-in");

  const workspaceId = session.orgId ?? session.userId;
  const scope: AuthScope = session.orgId
    ? { type: "org", orgId: session.orgId, role: normalizeOrgRole(session.orgRole) }
    : { type: "personal", ownerId: session.userId };

  const { id } = await params;
  let record;
  let failed = false;
  try {
    record = await getCase(workspaceId, id);
  } catch {
    failed = true;
  }
  if (failed) return <p className="text-sm text-muted-foreground">That report could not be loaded.</p>;
  if (!record) notFound();

  const authz = authorize(
    scope,
    "case:read",
    {
      ownerType: scope.type,
      ownerId: workspaceId,
      createdBy: record.userId,
    },
    session.userId
  );
  if (!authz.ok) notFound();

  return <CaseReport record={record} />;
}
