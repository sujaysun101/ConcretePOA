"use client";

import { useState } from "react";
import { UserProfile, OrganizationProfile } from "@clerk/nextjs";
import { cn } from "@/lib/utils";

interface SettingsViewProps {
  workspaceType: "personal" | "org";
  workspaceId: string;
  role: string;
  storageMode: string;
  modelName: string;
  authMode: string;
  rateLimitInfo: string;
}

export function SettingsView({
  workspaceType,
  workspaceId,
  role,
  storageMode,
  modelName,
  authMode,
  rateLimitInfo,
}: SettingsViewProps) {
  const [tab, setTab] = useState<"workspace" | "security" | "members">("workspace");

  const systemRows = [
    ["Workspace Scope", workspaceType === "personal" ? "Personal (Individual Caregiver)" : "Organization (Firm)"],
    ["Workspace ID", workspaceId],
    ["Your Role", role],
    ["Storage", storageMode],
    ["AI Model", modelName],
    ["Authentication", authMode],
    ["Rate Limiting", rateLimitInfo],
  ];

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">Settings & Security</p>
        <h1 className="font-serif text-4xl">Workspace & Account Preferences</h1>
      </div>

      <div className="flex gap-2 border-b border-border pb-3">
        <button
          type="button"
          onClick={() => setTab("workspace")}
          className={cn(
            "rounded-xl px-4 py-2 text-sm font-semibold transition-colors",
            tab === "workspace" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary"
          )}
        >
          System & Storage
        </button>
        {workspaceType === "org" && (
          <button
            type="button"
            onClick={() => setTab("members")}
            className={cn(
              "rounded-xl px-4 py-2 text-sm font-semibold transition-colors",
              tab === "members" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary"
            )}
          >
            Firm Members & Roles
          </button>
        )}
        <button
          type="button"
          onClick={() => setTab("security")}
          className={cn(
            "rounded-xl px-4 py-2 text-sm font-semibold transition-colors",
            tab === "security" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary"
          )}
        >
          Security & MFA
        </button>
      </div>

      {tab === "workspace" && (
        <div className="max-w-2xl space-y-6">
          <dl className="divide-y divide-border rounded-3xl border border-border bg-card">
            {systemRows.map(([term, detail]) => (
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
      )}

      {tab === "members" && workspaceType === "org" && (
        <div className="py-2">
          <OrganizationProfile />
        </div>
      )}

      {tab === "security" && (
        <div className="py-2">
          <UserProfile />
        </div>
      )}
    </div>
  );
}
