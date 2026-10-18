import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { UploadPanel } from "@/components/upload-panel";
import { WorkspaceGate } from "@/components/workspace-gate";
import { readSession } from "@/lib/session";

export const metadata: Metadata = { title: "New review" };

export default async function NewReviewPage() {
  const session = await readSession();
  if (!session) redirect("/sign-in");
  if (!session.orgId) return <WorkspaceGate />;
  return <UploadPanel />;
}
