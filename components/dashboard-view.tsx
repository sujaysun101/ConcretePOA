"use client";

import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Badge } from "@/components/ui/badge";
import type { DashboardData } from "@/lib/types";
import { cn, formatWhen, scoreTone } from "@/lib/utils";

export function DashboardView({ data, basePath = "" }: { data: DashboardData; basePath?: string }) {
  const tone = scoreTone(data.totals.avgScore);
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">Workspace</p>
          <h1 className="font-serif text-4xl">Catch the rejection before the appointment.</h1>
        </div>
        <Link href={`${basePath}/cases/new`} className="inline-flex h-10 items-center rounded-full bg-primary px-4 text-sm font-semibold text-primary-foreground">
          Review a POA
        </Link>
      </div>
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Matters" value={String(data.totals.cases)} detail={`${data.totals.audits} audits · ${data.totals.diagnoses} rejections`} />
        <Stat label="Average score" value={data.totals.avgScore === null ? "—" : `${data.totals.avgScore}`} detail="Acceptance or statutory match" tone={tone} />
        <Stat label="Statutory checks" value={String(data.totals.jurisdiction)} detail="Drift against the rule library" />
        <Stat label="Below 50" value={String(data.totals.atRisk)} detail={data.hotspots[0]?.label ?? "No repeated friction yet"} />
      </section>
      <section className="grid gap-4 xl:grid-cols-[1.1fr_1fr_0.9fr]">
        <ChartCard title="Matters by month" subtitle="Volume in this workspace">
          <ResponsiveContainer width="100%" height={210}>
            <BarChart data={data.byMonth}>
              <CartesianGrid vertical={false} stroke="var(--border)" />
              <XAxis dataKey="month" tickLine={false} axisLine={false} fontSize={12} />
              <YAxis allowDecimals={false} tickLine={false} axisLine={false} fontSize={12} width={24} />
              <Tooltip cursor={{ fill: "var(--secondary)" }} />
              <Bar dataKey="cases" fill="var(--chart)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Score by institution" subtitle="Higher means more likely to clear intake">
          <ResponsiveContainer width="100%" height={210}>
            <BarChart data={chartBanks(data)} layout="vertical" margin={{ left: 8, right: 8 }}>
              <CartesianGrid horizontal={false} stroke="var(--border)" />
              <XAxis type="number" domain={[0, 100]} hide />
              <YAxis type="category" dataKey="bank" width={96} tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="avgScore" fill="var(--chart-2)" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
        <PriorityCard data={data} basePath={basePath} />
      </section>
      <section className="rounded-3xl border border-border bg-card">
        <div className="flex items-center justify-between px-5 py-4">
          <h2 className="font-serif text-2xl">Recent matters</h2>
          <Link href={`${basePath}/cases`} className="text-sm font-semibold text-accent">
            All matters
          </Link>
        </div>
        <ul className="divide-y divide-border">
          {data.recent.map((item) => (
            <li key={item.id}>
              <Link href={`${basePath}/cases/${item.id}`} className="flex items-center gap-4 px-5 py-3 hover:bg-secondary/60">
                <ScorePill score={item.score} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{item.title}</p>
                  <p className="truncate text-sm text-muted-foreground">{item.summary}</p>
                </div>
                <span className="hidden text-xs text-muted-foreground sm:inline">{formatWhen(item.createdAt)}</span>
                <ArrowUpRight className="size-4 text-muted-foreground" />
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function chartBanks(data: DashboardData) {
  return [...data.byBank]
    .map((item) => ({ ...item, bank: item.bank === "Bank of America" ? "BofA" : item.bank }))
    .sort((a, b) => (a.avgScore ?? 0) - (b.avgScore ?? 0));
}

function Stat({ label, value, detail, tone }: { label: string; value: string; detail: string; tone?: "good" | "warn" | "bad" | "muted" }) {
  return (
    <article className="rounded-2xl border border-border bg-card px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
      <p className={cn("mt-1 font-serif text-3xl", tone === "good" && "text-success", tone === "warn" && "text-warning", tone === "bad" && "text-destructive")}>{value}</p>
      <p className="text-xs text-muted-foreground">{detail}</p>
    </article>
  );
}

function ChartCard({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <article className="rounded-3xl border border-border bg-card p-4">
      <h2 className="font-serif text-xl">{title}</h2>
      <p className="mb-2 text-xs text-muted-foreground">{subtitle}</p>
      {children}
    </article>
  );
}

function PriorityCard({ data, basePath }: { data: DashboardData; basePath: string }) {
  const item = data.priority;
  if (!item) return null;
  return (
    <article className="flex flex-col rounded-3xl border border-accent/30 bg-primary p-4 text-primary-foreground">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">Priority matter</p>
      <h2 className="mt-2 font-serif text-2xl">{item.title}</h2>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-primary-foreground/80">{item.summary}</p>
      <div className="mt-4 flex items-center justify-between">
        <Badge tone="warn">{item.score ?? "—"} score</Badge>
        <Link href={`${basePath}/cases/${item.id}`} className="text-sm font-semibold text-accent">
          Open report
        </Link>
      </div>
    </article>
  );
}

function ScorePill({ score }: { score: number | null }) {
  const tone = scoreTone(score);
  return (
    <span
      className={cn(
        "grid size-11 shrink-0 place-items-center rounded-2xl text-sm font-semibold",
        tone === "good" && "bg-success/15 text-success",
        tone === "warn" && "bg-warning/15 text-warning",
        tone === "bad" && "bg-destructive/15 text-destructive",
        tone === "muted" && "bg-secondary text-muted-foreground",
      )}
    >
      {score ?? "—"}
    </span>
  );
}
