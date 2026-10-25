"use client";

import { CreateOrganization, OrganizationList } from "@clerk/nextjs";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function WorkspaceGate() {
  return (
    <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-2">
      <section className="rounded-3xl border border-border bg-card p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">Personal or Firm workspace</p>
        <h1 className="mt-2 font-serif text-4xl">Choose your workspace.</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          You can use ConcretePOA as an individual family caregiver in your personal workspace, or join a firm organization to share matters with your legal team.
        </p>
        <div className="mt-6 flex flex-col gap-4">
          <Link href="/dashboard">
            <Button variant="outline" className="w-full">
              Continue in Personal Workspace
            </Button>
          </Link>
          <div className="border-t border-border pt-4">
            <p className="mb-2 text-xs font-semibold text-muted-foreground">Or switch to an organization:</p>
            <OrganizationList
              afterSelectPersonalUrl="/dashboard"
              afterSelectOrganizationUrl="/dashboard"
            />
          </div>
        </div>
      </section>
      <section className="rounded-3xl border border-border bg-card p-6">
        <h2 className="font-serif text-2xl">Create a firm workspace</h2>
        <p className="mt-2 mb-4 text-sm text-muted-foreground">Name it after the firm. You can invite colleagues after the first review.</p>
        <CreateOrganization afterCreateOrganizationUrl="/dashboard" />
      </section>
    </div>
  );
}
