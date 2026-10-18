"use client";

import { Search, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { CaseRecord } from "@/lib/types";
import { formatWhen, scoreTone } from "@/lib/utils";

const filters = ["all", "audit", "diagnosis", "jurisdiction"] as const;

export function CaseList({ cases, basePath = "", canMutate = false }: { cases: CaseRecord[]; basePath?: string; canMutate?: boolean }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState<(typeof filters)[number]>("all");
  const visible = useMemo(() => {
    return cases.filter((item) => {
      const haystack = `${item.title} ${item.summary} ${item.state ?? ""} ${item.bankTarget ?? ""}`.toLowerCase();
      const matchesQuery = haystack.includes(query.toLowerCase().trim());
      const matchesKind = kind === "all" || item.kind === kind;
      return matchesQuery && matchesKind;
    });
  }, [cases, query, kind]);

  async function remove(id: string) {
    if (!canMutate) return;
    const response = await fetch(`/api/cases/${id}`, { method: "DELETE" });
    if (!response.ok) {
      toast.error("That matter could not be removed.");
      return;
    }
    toast.success("Matter removed.");
    router.refresh();
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">Case history</p>
          <h1 className="font-serif text-4xl">Matters</h1>
        </div>
        {canMutate ? (
          <Link href="/cases/new" className="inline-flex h-10 items-center rounded-full bg-primary px-4 text-sm font-semibold text-primary-foreground">
            New review
          </Link>
        ) : null}
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <label className="relative flex-1">
          <span className="sr-only">Search matters</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search principal, institution, or state"
            className="h-11 w-full rounded-full border border-border bg-card pl-10 pr-4 text-sm outline-none"
          />
        </label>
        <div className="flex gap-2" role="tablist" aria-label="Filter by review type">
          {filters.map((item) => (
            <button
              key={item}
              type="button"
              role="tab"
              aria-selected={kind === item}
              onClick={() => setKind(item)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold ${kind === item ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"}`}
            >
              {item === "all" ? "All" : item === "audit" ? "Audits" : item === "diagnosis" ? "Rejections" : "Statutes"}
            </button>
          ))}
        </div>
      </div>
      {visible.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border bg-card px-6 py-16 text-center">
          <h2 className="font-serif text-3xl">No matters in this view.</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">Upload a POA when you are ready. Empty workspaces can also load the Harbor Elder Law demo matters.</p>
        </div>
      ) : (
        <ul className="divide-y divide-border overflow-hidden rounded-3xl border border-border bg-card">
          {visible.map((item) => (
            <li key={item.id} className="flex items-start gap-4 px-4 py-4">
              <div className={`grid size-12 shrink-0 place-items-center rounded-2xl text-sm font-semibold ${pill(scoreTone(item.score))}`}>{item.score ?? "—"}</div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Link href={`${basePath}/cases/${item.id}`} className="font-semibold hover:underline">
                    {item.title}
                  </Link>
                  {item.isDemo ? <Badge tone="accent">Demo</Badge> : null}
                  {item.isSample ? <Badge tone="warn">Sample</Badge> : null}
                  <Badge>{label(item.kind)}</Badge>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{item.summary}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {formatWhen(item.createdAt)}
                  {item.state ? ` · ${item.state}` : ""}
                  {item.fileName ? ` · ${item.fileName}` : ""}
                </p>
              </div>
              {canMutate ? (
                <Button type="button" variant="ghost" size="icon" aria-label={`Remove ${item.title}`} onClick={() => remove(item.id)}>
                  <Trash2 className="size-4" />
                </Button>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function label(kind: CaseRecord["kind"]) {
  if (kind === "audit") return "Audit";
  if (kind === "diagnosis") return "Rejection";
  return "Statute";
}

function pill(tone: ReturnType<typeof scoreTone>) {
  if (tone === "good") return "bg-success/15 text-success";
  if (tone === "warn") return "bg-warning/15 text-warning";
  if (tone === "bad") return "bg-destructive/15 text-destructive";
  return "bg-secondary text-muted-foreground";
}
