import type { ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import { Logo, Wordmark } from "@/components/logo";
import { readSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await readSession();
  if (!session || session.platformRole !== "admin") {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2">
              <Logo className="text-primary" />
              <Wordmark />
            </Link>
            <span className="rounded-full bg-accent/15 px-3 py-1 text-xs font-semibold text-accent">
              Platform Admin
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-sm font-semibold hover:text-accent">
              Return to Workspace
            </Link>
            <UserButton />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-6 py-8">{children}</main>
    </div>
  );
}
