"use client";

import { FileUp, FolderOpen, LayoutDashboard, Menu, Scale, Settings, X } from "lucide-react";
import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Logo, Wordmark } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";

const links = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/cases", label: "Matters", icon: FolderOpen },
  { href: "/cases/new", label: "New review", icon: FileUp },
  { href: "/rules", label: "Rule library", icon: Scale },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function AppShell({
  basePath = "",
  dataMode,
  orgSlot,
  userSlot,
  children,
}: {
  basePath?: string;
  dataMode: "postgres" | "memory";
  orgSlot: ReactNode;
  userSlot: ReactNode;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const hrefFor = (path: string) => `${basePath}${path}`;

  const active = (path: string) => {
    const href = hrefFor(path);
    if (path === "/cases/new") return pathname === href;
    if (path === "/cases") return pathname === href || (pathname.startsWith(`${href}/`) && !pathname.startsWith(hrefFor("/cases/new")));
    if (path === "/dashboard") return pathname === href;
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const nav = (
    <nav className="flex flex-col gap-1" aria-label="Workspace">
      {links.map((link) => {
        const Icon = link.icon;
        const on = active(link.href);
        return (
          <Link
            key={link.href}
            href={hrefFor(link.href)}
            onClick={() => setOpen(false)}
            aria-current={on ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium",
              on ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary hover:text-foreground",
            )}
          >
            <Icon className="size-4" />
            {link.label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground">
        Skip to content
      </a>
      <div className="flex min-h-screen">
        <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-border bg-card px-4 py-5 md:flex">
          <Link href={hrefFor("/dashboard")} className="mb-8 flex items-center gap-2 px-2">
            <Logo className="size-8 text-primary" />
            <Wordmark />
          </Link>
          {nav}
          <p className="mt-auto px-2 text-xs leading-relaxed text-muted-foreground">Review aid for firm workspaces. Not a law firm.</p>
        </aside>
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-background/90 px-4 backdrop-blur md:px-6">
            <button
              type="button"
              className="inline-flex size-10 items-center justify-center rounded-full border border-border md:hidden"
              aria-label={open ? "Close menu" : "Open menu"}
              onClick={() => setOpen((value) => !value)}
            >
              {open ? <X className="size-4" /> : <Menu className="size-4" />}
            </button>
            <Link href={hrefFor("/dashboard")} className="flex items-center gap-2 md:hidden">
              <Logo className="size-7 text-primary" />
              <Wordmark />
            </Link>
            <div className="ml-auto flex items-center gap-2">
              {orgSlot}
              <ThemeToggle />
              {userSlot}
            </div>
          </header>
          {open ? <div className="border-b border-border bg-card px-4 py-4 md:hidden">{nav}</div> : null}
          {dataMode === "memory" ? (
            <div className="border-b border-warning/30 bg-warning/10 px-4 py-2 text-sm text-foreground md:px-6">
              Demo data. Matters live in memory for this server process until you set DATABASE_URL.
            </div>
          ) : null}
          <main id="main" className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 md:px-6">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
