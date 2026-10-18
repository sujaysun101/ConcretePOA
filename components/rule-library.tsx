"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { RuleRecord } from "@/lib/types";

export function RuleLibrary({ rules, canAdd }: { rules: RuleRecord[]; canAdd: boolean }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [scope, setScope] = useState<"all" | "jurisdiction" | "institution">("all");
  const [pending, setPending] = useState(false);
  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return rules.filter((rule) => {
      if (scope !== "all" && rule.scope !== scope) return false;
      if (!needle) return true;
      return `${rule.topic} ${rule.requirement} ${rule.jurisdiction ?? ""} ${rule.institution ?? ""} ${rule.citation ?? ""}`
        .toLowerCase()
        .includes(needle);
    });
  }, [rules, query, scope]);

  const groups = new Map<string, RuleRecord[]>();
  for (const rule of visible) {
    const key = rule.scope === "jurisdiction" ? rule.jurisdiction || "Unstated" : rule.institution || "Institution";
    groups.set(key, [...(groups.get(key) ?? []), rule]);
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setPending(true);
    const response = await fetch("/api/rules", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        scope: form.get("scope"),
        jurisdiction: form.get("jurisdiction") || undefined,
        institution: form.get("institution") || undefined,
        topic: form.get("topic"),
        requirement: form.get("requirement"),
        severity: form.get("severity"),
        citation: form.get("citation") || undefined,
        notes: form.get("notes") || undefined,
      }),
    });
    setPending(false);
    const payload = (await response.json()) as { error?: string };
    if (!response.ok) {
      toast.error(payload.error || "The rule could not be saved.");
      return;
    }
    toast.success("Rule added to this workspace.");
    event.currentTarget.reset();
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">Rule library</p>
        <h1 className="font-serif text-4xl">What the review is allowed to rely on.</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Jurisdiction checkpoints cite the public statute chapter. Institution rows are ConcretePOA&apos;s intake rubric, not a bank&apos;s private manual. Confirm the current text before you rely on either.
        </p>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <label className="flex-1">
          <span className="sr-only">Search rules</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search state, institution, or topic"
            className="h-11 w-full rounded-full border border-border bg-card px-4 text-sm outline-none"
          />
        </label>
        <div className="flex gap-2">
          {(["all", "jurisdiction", "institution"] as const).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setScope(item)}
              className={`rounded-full px-3 py-2 text-xs font-semibold ${scope === item ? "bg-primary text-primary-foreground" : "bg-secondary"}`}
            >
              {item === "all" ? "All" : item === "jurisdiction" ? "States" : "Institutions"}
            </button>
          ))}
        </div>
      </div>
      <div className="space-y-8">
        {[...groups.entries()].map(([name, items]) => (
          <section key={name}>
            <h2 className="font-serif text-2xl">{name}</h2>
            <ul className="mt-3 grid gap-3 lg:grid-cols-2">
              {items.map((rule) => (
                <li key={rule.id} className="rounded-2xl border border-border bg-card p-4">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-semibold">{rule.topic}</h3>
                    <Badge tone={rule.severity === "high" ? "bad" : rule.severity === "medium" ? "warn" : "good"}>{rule.severity}</Badge>
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{rule.requirement}</p>
                  <p className="mt-3 text-xs text-muted-foreground">
                    {rule.citation || "Internal rubric"}
                    {rule.custom ? " · Workspace rule" : ""}
                    {rule.notes ? ` · ${rule.notes}` : ""}
                  </p>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
      {canAdd ? (
        <form onSubmit={onSubmit} className="grid gap-3 rounded-3xl border border-border bg-card p-5 md:grid-cols-2">
          <div className="md:col-span-2">
            <h2 className="font-serif text-2xl">Add a workspace rule</h2>
            <p className="text-sm text-muted-foreground">Visible to everyone in this organization. It does not change the shared library.</p>
          </div>
          <label className="text-sm font-semibold">
            Scope
            <select name="scope" className="mt-1 h-11 w-full rounded-xl border border-border bg-background px-3 text-sm font-normal">
              <option value="jurisdiction">Jurisdiction</option>
              <option value="institution">Institution</option>
            </select>
          </label>
          <label className="text-sm font-semibold">
            Severity
            <select name="severity" className="mt-1 h-11 w-full rounded-xl border border-border bg-background px-3 text-sm font-normal">
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </label>
          <label className="text-sm font-semibold">
            State or topic area
            <input name="jurisdiction" className="mt-1 h-11 w-full rounded-xl border border-border bg-background px-3 text-sm font-normal" placeholder="California" />
          </label>
          <label className="text-sm font-semibold">
            Institution
            <input name="institution" className="mt-1 h-11 w-full rounded-xl border border-border bg-background px-3 text-sm font-normal" placeholder="First County Credit Union" />
          </label>
          <label className="text-sm font-semibold md:col-span-2">
            Topic
            <input name="topic" required minLength={3} className="mt-1 h-11 w-full rounded-xl border border-border bg-background px-3 text-sm font-normal" />
          </label>
          <label className="text-sm font-semibold md:col-span-2">
            Requirement
            <textarea name="requirement" required minLength={10} className="mt-1 min-h-24 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm font-normal" />
          </label>
          <label className="text-sm font-semibold">
            Citation
            <input name="citation" className="mt-1 h-11 w-full rounded-xl border border-border bg-background px-3 text-sm font-normal" />
          </label>
          <label className="text-sm font-semibold">
            Notes
            <input name="notes" className="mt-1 h-11 w-full rounded-xl border border-border bg-background px-3 text-sm font-normal" />
          </label>
          <div className="md:col-span-2">
            <Button type="submit" disabled={pending}>
              {pending ? "Saving" : "Save rule"}
            </Button>
          </div>
        </form>
      ) : null}
    </div>
  );
}
