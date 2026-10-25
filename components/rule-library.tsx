"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trash2, Building2, AlertCircle } from "lucide-react";
import type { RuleRecord } from "@/lib/types";

export function RuleLibrary({ rules, canAdd }: { rules: RuleRecord[]; canAdd: boolean }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [scope, setScope] = useState<"all" | "jurisdiction" | "institution">("all");
  const [activeTab, setActiveTab] = useState<"standard" | "custom-bank">("standard");
  const [pending, setPending] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Custom bank form state & inline errors
  const [bankName, setBankName] = useState("");
  const [ageValue, setAgeValue] = useState("5");
  const [ageUnit, setAgeUnit] = useState<"years" | "months" | "days">("years");
  const [clauses, setClauses] = useState("");
  const [formatting, setFormatting] = useState("");
  const [frictionRules, setFrictionRules] = useState("");
  const [inlineErrors, setInlineErrors] = useState<Record<string, string>>({});

  const existingBankNames = useMemo(() => {
    return new Set(
      rules
        .filter((r) => r.scope === "institution" && r.institution)
        .map((r) => r.institution!.toLowerCase().trim())
    );
  }, [rules]);

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

  async function onDeleteRule(id: string) {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/rules/${id}`, { method: "DELETE" });
      if (!res.ok) {
        toast.error("Failed to delete workspace rule.");
        return;
      }
      toast.success("Workspace rule deleted.");
      router.refresh();
    } catch {
      toast.error("Network error while deleting rule.");
    } finally {
      setDeletingId(null);
    }
  }

  async function onAddStandardRule(event: FormEvent<HTMLFormElement>) {
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

  async function onAddCustomBank(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const errors: Record<string, string> = {};

    const cleanBank = bankName.trim();
    if (!cleanBank) {
      errors.bankName = "Institution name is required.";
    } else if (existingBankNames.has(cleanBank.toLowerCase())) {
      errors.bankName = `An institution rubric for "${cleanBank}" already exists.`;
    }

    const ageNum = Number(ageValue);
    if (!Number.isFinite(ageNum) || ageNum <= 0) {
      errors.age = "Age limitation must be a positive number.";
    }

    if (Object.keys(errors).length > 0) {
      setInlineErrors(errors);
      return;
    }

    setInlineErrors({});
    setPending(true);

    const requirementText = [
      `Max document age: ${ageNum} ${ageUnit}.`,
      clauses.trim() ? `Required Clauses: ${clauses.trim()}` : "",
      formatting.trim() ? `Formatting Rules: ${formatting.trim()}` : "",
      frictionRules.trim() ? `High Friction Rules: ${frictionRules.trim()}` : "",
    ]
      .filter(Boolean)
      .join(" ");

    try {
      const response = await fetch("/api/rules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scope: "institution",
          institution: cleanBank,
          topic: `${cleanBank} Intake Profile`,
          requirement: requirementText,
          severity: "high",
          notes: `Custom institutional rubric. Maximum stale age: ${ageNum} ${ageUnit}.`,
        }),
      });

      setPending(false);
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        toast.error(payload.error || "Failed to save custom institution.");
        return;
      }

      toast.success(`Custom bank "${cleanBank}" added to workspace.`);
      setBankName("");
      setClauses("");
      setFormatting("");
      setFrictionRules("");
      router.refresh();
    } catch {
      setPending(false);
      toast.error("Network error while creating bank rubric.");
    }
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
                <li key={rule.id} className="relative rounded-2xl border border-border bg-card p-4">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-semibold">{rule.topic}</h3>
                    <div className="flex items-center gap-2">
                      <Badge tone={rule.severity === "high" ? "bad" : rule.severity === "medium" ? "warn" : "good"}>
                        {rule.severity}
                      </Badge>
                      {rule.custom && canAdd ? (
                        <button
                          type="button"
                          onClick={() => onDeleteRule(rule.id)}
                          disabled={deletingId === rule.id}
                          className="rounded-lg p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                          title="Delete custom rule"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      ) : null}
                    </div>
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
        <div className="rounded-3xl border border-border bg-card p-6 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
            <div>
              <h2 className="font-serif text-2xl">Add Workspace Policy</h2>
              <p className="text-sm text-muted-foreground">Configure custom rules or define intake rules for regional banks and credit unions.</p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setActiveTab("standard")}
                className={`rounded-full px-4 py-2 text-xs font-semibold ${activeTab === "standard" ? "bg-primary text-primary-foreground" : "bg-secondary"}`}
              >
                Custom Rule
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("custom-bank")}
                className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold ${activeTab === "custom-bank" ? "bg-primary text-primary-foreground" : "bg-secondary"}`}
              >
                <Building2 className="h-3.5 w-3.5" />
                Custom Institution
              </button>
            </div>
          </div>

          {activeTab === "standard" ? (
            <form onSubmit={onAddStandardRule} className="grid gap-4 md:grid-cols-2">
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
                  {pending ? "Saving..." : "Save rule"}
                </Button>
              </div>
            </form>
          ) : (
            <form onSubmit={onAddCustomBank} className="grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="text-sm font-semibold">
                  Institution Name <span className="text-destructive">*</span>
                  <input
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    required
                    placeholder="e.g. Apex Community Bank"
                    className="mt-1 h-11 w-full rounded-xl border border-border bg-background px-3 text-sm font-normal"
                  />
                </label>
                {inlineErrors.bankName ? (
                  <p className="mt-1 flex items-center gap-1 text-xs text-destructive">
                    <AlertCircle className="h-3 w-3" />
                    {inlineErrors.bankName}
                  </p>
                ) : null}
              </div>

              <div>
                <label className="text-sm font-semibold">Max Document Age (Staleness)</label>
                <div className="mt-1 flex gap-2">
                  <input
                    type="number"
                    min="1"
                    value={ageValue}
                    onChange={(e) => setAgeValue(e.target.value)}
                    className="h-11 w-24 rounded-xl border border-border bg-background px-3 text-sm font-normal"
                  />
                  <select
                    value={ageUnit}
                    onChange={(e) => setAgeUnit(e.target.value as "years" | "months" | "days")}
                    className="h-11 flex-1 rounded-xl border border-border bg-background px-3 text-sm font-normal"
                  >
                    <option value="years">Years</option>
                    <option value="months">Months</option>
                    <option value="days">Days</option>
                  </select>
                </div>
                {inlineErrors.age ? (
                  <p className="mt-1 flex items-center gap-1 text-xs text-destructive">
                    <AlertCircle className="h-3 w-3" />
                    {inlineErrors.age}
                  </p>
                ) : null}
              </div>

              <div>
                <label className="text-sm font-semibold">
                  Required Clauses (comma-separated)
                  <input
                    value={clauses}
                    onChange={(e) => setClauses(e.target.value)}
                    placeholder="Explicit banking powers, Durability, Indemnification"
                    className="mt-1 h-11 w-full rounded-xl border border-border bg-background px-3 text-sm font-normal"
                  />
                </label>
              </div>

              <label className="text-sm font-semibold md:col-span-2">
                Formatting & Execution Rules
                <textarea
                  value={formatting}
                  onChange={(e) => setFormatting(e.target.value)}
                  placeholder="Notarized within 30 days, medallion signature guarantee on accounts over $100k..."
                  className="mt-1 min-h-20 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm font-normal"
                />
              </label>

              <label className="text-sm font-semibold md:col-span-2">
                High Friction & Refusal Triggers
                <textarea
                  value={frictionRules}
                  onChange={(e) => setFrictionRules(e.target.value)}
                  placeholder="Rejects non-statutory forms without affidavit of full force and effect..."
                  className="mt-1 min-h-20 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm font-normal"
                />
              </label>

              <div className="md:col-span-2">
                <Button type="submit" disabled={pending}>
                  {pending ? "Adding Institution..." : "Save Custom Institution"}
                </Button>
              </div>
            </form>
          )}
        </div>
      ) : null}
    </div>
  );
}
