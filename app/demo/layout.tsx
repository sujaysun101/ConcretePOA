import type { ReactNode } from "react";
import { AppShell } from "@/components/shell";

export const dynamic = "force-dynamic";

export default function DemoLayout({ children }: { children: ReactNode }) {
  return (
    <AppShell
      basePath="/demo"
      dataMode="memory"
      orgSlot={<span className="rounded-full border border-border bg-card px-3 py-1.5 text-sm font-semibold">Harbor Elder Law</span>}
      userSlot={
        <span className="grid size-10 place-items-center rounded-full bg-primary text-xs font-semibold text-primary-foreground" aria-label="Signed in as Amira Shah">
          AS
        </span>
      }
    >
      {children}
    </AppShell>
  );
}
