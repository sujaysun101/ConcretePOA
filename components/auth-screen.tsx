import type { ReactNode } from "react";
import Link from "next/link";
import { Logo, Wordmark } from "@/components/logo";

export function AuthScreen({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <aside className="hidden flex-col justify-between bg-primary px-10 py-10 text-primary-foreground lg:flex">
        <Link href="/" className="flex items-center gap-2 text-primary-foreground">
          <Logo />
          <Wordmark className="text-primary-foreground" />
        </Link>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">ConcretePOA</p>
          <h1 className="mt-3 max-w-md font-serif text-5xl leading-tight">{title}</h1>
          <ul className="mt-8 space-y-3 text-sm text-primary-foreground/80">
            <li>Firm workspaces, so a matter stays with the organization.</li>
            <li>PDF in, findings report out, with an export your colleague can read.</li>
            <li>Model calls stay on the server. The browser never receives a key.</li>
          </ul>
        </div>
        <p className="text-xs text-primary-foreground/60">Not legal advice. A checklist before the branch appointment.</p>
      </aside>
      <div className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}
