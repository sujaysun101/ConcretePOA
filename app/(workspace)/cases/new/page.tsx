import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { UploadPanel } from "@/components/upload-panel";
import { authorize, normalizeOrgRole, type AuthScope } from "@/lib/authz";
import { readSession } from "@/lib/session";

export const metadata: Metadata = { title: "New review" };

export default async function NewReviewPage() {
  const session = await readSession();
  if (!session) redirect("/sign-in");

  const scope: AuthScope = session.orgId
    ? { type: "org", orgId: session.orgId, role: normalizeOrgRole(session.orgRole) }
    : { type: "personal", ownerId: session.userId };

  const authz = authorize(scope, "case:create");
  if (!authz.ok) {
    return (
      <div className="mx-auto max-w-2xl rounded-3xl border border-border bg-card p-8 text-center">
        <h1 className="font-serif text-3xl">Permission Required</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          {authz.reason}
        </p>
      </div>
    );
  }

  return <UploadPanel />;
}
