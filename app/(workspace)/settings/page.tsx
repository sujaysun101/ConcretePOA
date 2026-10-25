import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SettingsView } from "./settings-view";
import { aiConfigured, aiModelName, clerkPublishableKey, dataMode } from "@/lib/config";
import { normalizeOrgRole } from "@/lib/authz";
import { readSession } from "@/lib/session";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const session = await readSession();
  if (!session) redirect("/sign-in");

  const workspaceType = session.orgId ? "org" : "personal";
  const workspaceId = session.orgId ?? session.userId;
  const role = session.orgId ? normalizeOrgRole(session.orgRole) : "Individual Owner";

  return (
    <SettingsView
      workspaceType={workspaceType}
      workspaceId={workspaceId}
      role={role}
      storageMode={dataMode() === "postgres" ? "PostgreSQL (Encrypted at rest)" : "In-memory demo storage"}
      modelName={aiConfigured() ? aiModelName() : "Sample responses (Server API key not configured)"}
      authMode={clerkPublishableKey() ? "Clerk Authentication (Active)" : "Clerk keyless mode in development"}
      rateLimitInfo="10 reviews per minute per user (Upstash Redis in production)"
    />
  );
}
