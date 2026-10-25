import type { Metadata } from "next";
import { builtinRules } from "@/lib/library";

export const metadata: Metadata = { title: "Platform Administration" };

export default async function AdminDashboardPage() {
  const rules = builtinRules();

  const metrics = [
    { title: "System Rule Library", value: `${rules.length} rules`, detail: "15 institutions + 12 jurisdictions" },
    { title: "Active AI Provider", value: process.env.AI_PROVIDER || "Anthropic", detail: "Claude 3.5 Sonnet / 4.5 default" },
    { title: "Daily Spend Cap", value: `$${process.env.AI_DAILY_SPEND_CAP_USD || "25"}`, detail: "Auto-throttles when reached" },
    { title: "Platform Security", value: "Strict MFA Enforced", detail: "Zero client content access" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">Internal Controls</p>
        <h1 className="font-serif text-4xl">Platform Operations & Usage</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Platform administrators manage system capacity, library versions, and account status without access to client documents or PII.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map((item) => (
          <div key={item.title} className="rounded-3xl border border-border bg-card p-5">
            <p className="text-xs font-semibold text-muted-foreground">{item.title}</p>
            <p className="mt-2 font-serif text-3xl">{item.value}</p>
            <p className="mt-1 text-xs text-muted-foreground">{item.detail}</p>
          </div>
        ))}
      </div>

      <section className="rounded-3xl border border-border bg-card p-6">
        <h2 className="font-serif text-2xl">Built-in Rule Library Versions</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Canonical statutory execution checklists and institutional intake rubrics.
        </p>
        <div className="mt-4 divide-y divide-border">
          <div className="flex items-center justify-between py-3 text-sm">
            <div>
              <p className="font-semibold">Version 1.0 (2026 Baseline)</p>
              <p className="text-xs text-muted-foreground">
                99 institutional & jurisdictional compliance checkpoints
              </p>
            </div>
            <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-600">
              Active in Production
            </span>
          </div>
        </div>
      </section>
    </div>
  );
}
