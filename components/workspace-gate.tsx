"use client";

import { CreateOrganization, OrganizationList } from "@clerk/nextjs";

export function WorkspaceGate() {
  return (
    <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-2">
      <section className="rounded-3xl border border-border bg-card p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">Firm workspace</p>
        <h1 className="mt-2 font-serif text-4xl">Open the workspace these matters belong to.</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          ConcretePOA keeps reviews inside a Clerk organization so a firm can share case history without mixing client files across teams.
        </p>
        <div className="mt-6">
          <OrganizationList hidePersonal afterSelectOrganizationUrl="/dashboard" />
        </div>
      </section>
      <section className="rounded-3xl border border-border bg-card p-6">
        <h2 className="font-serif text-2xl">Create a workspace</h2>
        <p className="mt-2 mb-4 text-sm text-muted-foreground">Name it after the firm. You can invite colleagues after the first review.</p>
        <CreateOrganization afterCreateOrganizationUrl="/dashboard" />
      </section>
    </div>
  );
}
