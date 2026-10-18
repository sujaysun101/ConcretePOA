"use client";

import { Check, Copy, Download } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { AuditResult, CaseRecord, JurisdictionResult, RejectionDiagnosis } from "@/lib/types";
import { caseToMarkdown, caseToPdf } from "@/lib/report";
import { formatWhen, scoreTone } from "@/lib/utils";

export function CaseReport({ record, basePath = "" }: { record: CaseRecord; basePath?: string }) {
  const tone = scoreTone(record.score);
  return (
    <article className="space-y-6">
      <Link href={`${basePath}/cases`} className="text-sm font-semibold text-muted-foreground hover:text-foreground">
        Back to matters
      </Link>
      <header className="flex flex-wrap items-start justify-between gap-4 rounded-3xl border border-border bg-card p-6">
        <div>
          <div className="flex flex-wrap gap-2">
            <Badge>{record.kind === "audit" ? "Institution audit" : record.kind === "diagnosis" ? "Rejection diagnosis" : "Statutory drift"}</Badge>
            {record.isDemo ? <Badge tone="accent">Demo</Badge> : null}
            {record.isSample ? <Badge tone="warn">Sample response</Badge> : null}
          </div>
          <h1 className="mt-3 font-serif text-4xl">{record.title}</h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">{record.summary}</p>
          <p className="mt-3 text-xs text-muted-foreground">
            {formatWhen(record.createdAt)}
            {record.fileName ? ` · ${record.fileName}` : ""}
            {record.principal ? ` · ${record.principal}` : ""}
            {record.agent ? ` · Agent ${record.agent}` : ""}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">{record.kind === "jurisdiction" ? "Match" : "Score"}</p>
          <p className={`font-serif text-5xl ${tone === "good" ? "text-success" : tone === "warn" ? "text-warning" : tone === "bad" ? "text-destructive" : ""}`}>
            {record.score ?? "—"}
          </p>
        </div>
      </header>
      {record.isSample ? (
        <p className="rounded-2xl border border-warning/40 bg-warning/10 px-4 py-3 text-sm">
          Sample response. The model key is not configured, so these sentences are synthetic and were not read from an upload.
        </p>
      ) : null}
      <ExportBar record={record} />
      {record.kind === "audit" ? <AuditBody findings={record.findings as AuditResult} /> : null}
      {record.kind === "diagnosis" ? <DiagnosisBody findings={record.findings as RejectionDiagnosis} /> : null}
      {record.kind === "jurisdiction" ? <JurisdictionBody findings={record.findings as JurisdictionResult} /> : null}
      <p className="text-center text-xs text-muted-foreground">
        ConcretePOA is a review aid for the firm. It is not a lawyer, and the report is not a filing-ready instrument.
      </p>
    </article>
  );
}

function ExportBar({ record }: { record: CaseRecord }) {
  async function pdf() {
    const bytes = await caseToPdf(record);
    const blob = new Blob([Uint8Array.from(bytes)], { type: "application/pdf" });
    downloadBlob(blob, `${slug(record.title)}.pdf`);
  }
  function markdown() {
    const blob = new Blob([caseToMarkdown(record)], { type: "text/markdown" });
    downloadBlob(blob, `${slug(record.title)}.md`);
  }
  return (
    <div className="flex flex-wrap gap-2">
      <Button type="button" onClick={pdf}>
        <Download className="size-4" /> Export PDF
      </Button>
      <Button type="button" variant="outline" onClick={markdown}>
        <Download className="size-4" /> Export Markdown
      </Button>
    </div>
  );
}

function AuditBody({ findings }: { findings: AuditResult }) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-3xl border border-border bg-card p-5">
          <h2 className="font-serif text-2xl">Red flags</h2>
          <ul className="mt-3 space-y-3">
            {findings.primaryRedFlags.map((flag) => (
              <li key={flag} className="rounded-2xl bg-destructive/5 px-3 py-2 text-sm leading-relaxed">
                {flag}
              </li>
            ))}
          </ul>
        </section>
        <section className="rounded-3xl border border-border bg-card p-5">
          <h2 className="font-serif text-2xl">Extracted parties</h2>
          <dl className="mt-3 grid grid-cols-2 gap-4 text-sm">
            <Fact term="Principal" value={findings.extractedData.principal} />
            <Fact term="Agent" value={findings.extractedData.agent} />
            <Fact term="State" value={findings.extractedData.state} />
            <Fact term="Executed" value={findings.extractedData.date} />
          </dl>
        </section>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <BulletCard title="Clause audit" items={findings.clauseAudit} />
        <BulletCard title="Execution audit" items={findings.executionAudit} />
      </div>
      <section className="rounded-3xl bg-primary p-6 text-primary-foreground">
        <h2 className="font-serif text-3xl">Remediation</h2>
        <div className="mt-4 grid gap-6 md:grid-cols-2">
          <div>
            <h3 className="text-xs uppercase tracking-[0.14em] text-primary-foreground/60">First move</h3>
            <p className="mt-2 text-sm leading-relaxed">{findings.remediationBlueprint.action1}</p>
            <h3 className="mt-4 text-xs uppercase tracking-[0.14em] text-primary-foreground/60">What to bring</h3>
            <p className="mt-2 text-sm leading-relaxed">{findings.remediationBlueprint.action2}</p>
          </div>
          <div className="rounded-2xl bg-white/5 p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs uppercase tracking-[0.14em] text-primary-foreground/60">Concrete fix</h3>
              <CopyButton text={findings.remediationBlueprint.concreteFix} />
            </div>
            <p className="mt-3 font-mono text-sm leading-relaxed text-accent">{findings.remediationBlueprint.concreteFix}</p>
          </div>
        </div>
        <div className="mt-6 rounded-2xl bg-black/20 p-4">
          <div className="flex items-center justify-between">
            <h3 className="font-serif text-xl">Affidavit draft</h3>
            <CopyButton text={findings.remediationBlueprint.affidavitTemplate} />
          </div>
          <pre className="mt-3 whitespace-pre-wrap font-mono text-xs leading-relaxed text-primary-foreground/80">{findings.remediationBlueprint.affidavitTemplate}</pre>
        </div>
      </section>
    </div>
  );
}

function DiagnosisBody({ findings }: { findings: RejectionDiagnosis }) {
  return (
    <div className="space-y-4">
      <section className="rounded-3xl border border-border bg-card p-5">
        <h2 className="font-serif text-2xl">{findings.bankName} said</h2>
        <p className="mt-3 text-sm leading-relaxed">{findings.rejectionReason}</p>
      </section>
      <section className="rounded-3xl border border-border bg-card p-5">
        <h2 className="font-serif text-2xl">In plain language</h2>
        <p className="mt-3 text-sm leading-relaxed">{findings.legaleseTranslation}</p>
        <h3 className="mt-5 text-sm font-semibold">Where it conflicts with the POA</h3>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{findings.poaConflictSection}</p>
      </section>
      <ol className="grid gap-3 md:grid-cols-3">
        {[findings.actionPlan.step1, findings.actionPlan.step2, findings.actionPlan.step3].map((step, index) => (
          <li key={step} className="rounded-3xl border border-border bg-card p-4">
            <span className="font-serif text-3xl text-accent">{index + 1}</span>
            <p className="mt-2 text-sm leading-relaxed">{step}</p>
          </li>
        ))}
      </ol>
      <section className="rounded-3xl bg-primary p-6 text-primary-foreground">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-2xl">Language for counsel</h2>
          <CopyButton text={findings.remediationText} />
        </div>
        <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed">{findings.remediationText}</p>
      </section>
    </div>
  );
}

function JurisdictionBody({ findings }: { findings: JurisdictionResult }) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <StatusCard title="Caution to the principal" status={findings.cautionSectionVerbatim.status} body={findings.cautionSectionVerbatim.driftDetails} extra={findings.cautionSectionVerbatim.requiredText} />
        <StatusCard title="Agent signature page" status={findings.agentSignaturePage.status} body={findings.agentSignaturePage.driftDetails} extra={findings.agentSignaturePage.requirements} />
      </div>
      <section className="space-y-3">
        {findings.statutoryDrift.map((item) => (
          <article key={item.title} className="rounded-3xl border border-border bg-card p-5">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-serif text-2xl">{item.title}</h2>
              <Badge tone={item.severity === "high" ? "bad" : item.severity === "medium" ? "warn" : "good"}>{item.severity}</Badge>
            </div>
            <p className="mt-2 text-sm leading-relaxed">{item.description}</p>
            <p className="mt-2 text-sm text-muted-foreground">{item.remediation}</p>
          </article>
        ))}
      </section>
    </div>
  );
}

function StatusCard({ title, status, body, extra }: { title: string; status: string; body: string; extra: string }) {
  const tone = status === "compliant" ? "good" : status === "non-compliant" ? "bad" : "warn";
  return (
    <section className="rounded-3xl border border-border bg-card p-5">
      <div className="flex items-center justify-between">
        <h2 className="font-serif text-2xl">{title}</h2>
        <Badge tone={tone}>{status}</Badge>
      </div>
      <p className="mt-3 text-sm leading-relaxed">{body}</p>
      <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{extra}</p>
    </section>
  );
}

function BulletCard({ title, items }: { title: string; items: string[] }) {
  return (
    <section className="rounded-3xl border border-border bg-card p-5">
      <h2 className="font-serif text-2xl">{title}</h2>
      <ul className="mt-3 space-y-2 text-sm leading-relaxed">
        {items.map((item) => (
          <li key={item} className="border-t border-border pt-2 first:border-0 first:pt-0">
            {item}
          </li>
        ))}
      </ul>
    </section>
  );
}

function Fact({ term, value }: { term: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-[0.14em] text-muted-foreground">{term}</dt>
      <dd className="mt-1 font-medium">{value || "—"}</dd>
    </div>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      className="inline-flex items-center gap-1 text-xs font-semibold text-accent"
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
    >
      {copied ? <Check className="size-3" /> : <Copy className="size-3" />}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

function slug(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function downloadBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = name;
  anchor.click();
  URL.revokeObjectURL(url);
}
