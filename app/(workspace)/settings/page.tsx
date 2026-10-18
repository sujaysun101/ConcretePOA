import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { WorkspaceGate } from "@/components/workspace-gate";
import { aiConfigured, aiModelName, clerkPublishableKey, dataMode } from "@/lib/config";
import { readSession } from "@/lib/session";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const session = await readSession();
  if (!session) redirect("/sign-in");
  if (!session.orgId) return <WorkspaceGate />;
  const rows = [
    ["Workspace id", session.orgId],
    ["Storage", dataMode() === "postgres" ? "Postgres" : "In-memory demo"],
    ["Model", aiConfigured() ? aiModelName() : "Sample responses — server key is not set"],
    ["Sign-in", clerkPublishableKey() ? "Clerk keys detected" : "Clerk keyless mode in development"],
    ["Rate limit", "10 reviews per user each minute. Upstash is used when its REST credentials are set."],
  ];
  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">Settings</p>
        <h1 className="font-serif text-4xl">How this workspace is running.</h1>
      </div>
      <dl className="divide-y divide-border rounded-3xl border border-border bg-card">
        {rows.map(([term, detail]) => (
          <div key={term} className="grid gap-1 px-5 py-4 sm:grid-cols-[180px_1fr]">
            <dt className="text-sm font-semibold">{term}</dt>
            <dd className="text-sm text-muted-foreground">{detail}</dd>
          </div>
        ))}
      </dl>
      <p className="text-sm leading-relaxed text-muted-foreground">
        Reports are an intake aid. Confirm the live statute and the institution&apos;s current form before anyone signs an affidavit from this product.
      </p>
    </div>
  );
}
