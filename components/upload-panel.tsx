"use client";

import { FileText, Loader2, Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { BANKS } from "@/lib/banks";
import type { CaseKind } from "@/lib/types";
import { MAX_UPLOAD_BYTES } from "@/lib/uploads";
import { cn } from "@/lib/utils";

const modes: { id: CaseKind; label: string; detail: string }[] = [
  { id: "audit", label: "Institution audit", detail: "Score a POA against one custodian's checklist." },
  { id: "diagnosis", label: "Rejection letter", detail: "Translate the bank's no into a three-step plan." },
  { id: "jurisdiction", label: "Statutory drift", detail: "Compare execution formalities with the state rubric." },
];

export function UploadPanel() {
  const router = useRouter();
  const [mode, setMode] = useState<CaseKind>("audit");
  const [bank, setBank] = useState("Chase");
  const [customRules, setCustomRules] = useState("");
  const [poa, setPoa] = useState<File | null>(null);
  const [rejection, setRejection] = useState<File | null>(null);
  const [pending, setPending] = useState(false);
  const [note, setNote] = useState("Ready when the file is.");

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!poa) {
      toast.error("Upload the power of attorney first.");
      return;
    }
    if (poa.size > MAX_UPLOAD_BYTES) {
      toast.error("The POA must be 4 MB or smaller.");
      return;
    }
    if (mode === "diagnosis" && !rejection) {
      toast.error("Upload the rejection letter too.");
      return;
    }
    const body = new FormData();
    body.set("mode", mode);
    body.set("poa", poa);
    if (mode === "audit") {
      body.set("bank", bank);
      if (customRules.trim()) body.set("customRules", customRules.trim());
    }
    if (rejection && mode === "diagnosis") body.set("rejection", rejection);
    setPending(true);
    setNote(mode === "diagnosis" ? "Reading the letter against the POA…" : "Reading the document…");
    try {
      const response = await fetch("/api/analyze", { method: "POST", body });
      const payload = (await response.json()) as { error?: string; record?: { id: string; isSample: boolean } };
      if (!response.ok || !payload.record) {
        toast.error(payload.error || "The review could not be completed.");
        setNote("Nothing was saved.");
        return;
      }
      toast.success(payload.record.isSample ? "Sample report saved. Add an API key for a live review." : "Report saved to this workspace.");
      router.push(`/cases/${payload.record.id}`);
      router.refresh();
    } catch {
      toast.error("The review could not be completed.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto max-w-3xl space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">New review</p>
        <h1 className="font-serif text-4xl">Upload the POA before the bank does.</h1>
        <p className="mt-2 text-sm text-muted-foreground">PDF or image, up to 4 MB. The file is sent to the server for this review and is not stored.</p>
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        {modes.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setMode(item.id)}
            aria-pressed={mode === item.id}
            className={cn("rounded-2xl border px-4 py-3 text-left", mode === item.id ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card")}
          >
            <span className="block text-sm font-semibold">{item.label}</span>
            <span className={cn("mt-1 block text-xs", mode === item.id ? "text-primary-foreground/75" : "text-muted-foreground")}>{item.detail}</span>
          </button>
        ))}
      </div>
      <Dropzone label="Power of attorney" file={poa} onFile={setPoa} />
      {mode === "diagnosis" ? <Dropzone label="Rejection letter" file={rejection} onFile={setRejection} /> : null}
      {mode === "audit" ? (
        <fieldset className="space-y-3">
          <legend className="text-sm font-semibold">Target institution</legend>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {BANKS.map((name) => (
              <button
                key={name}
                type="button"
                onClick={() => setBank(name)}
                aria-pressed={bank === name}
                className={cn("rounded-xl border px-3 py-2 text-left text-sm", bank === name ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card")}
              >
                {name}
              </button>
            ))}
          </div>
          <label className="block text-sm font-semibold" htmlFor="custom-rules">
            Firm notes for this review
          </label>
          <textarea
            id="custom-rules"
            value={customRules}
            onChange={(event) => setCustomRules(event.target.value)}
            maxLength={4000}
            placeholder="Example: this credit union also requires a two-witness affidavit for any document older than five years."
            className="min-h-28 w-full rounded-2xl border border-border bg-card px-4 py-3 text-sm outline-none"
          />
        </fieldset>
      ) : null}
      <div className="flex flex-wrap items-center gap-4">
        <Button type="submit" size="lg" disabled={pending}>
          {pending ? <Loader2 className="size-4 animate-spin" /> : null}
          {pending ? "Reviewing" : "Run review"}
        </Button>
        <p className="text-sm text-muted-foreground" aria-live="polite">
          {note}
        </p>
      </div>
    </form>
  );
}

function Dropzone({ label, file, onFile }: { label: string; file: File | null; onFile: (file: File | null) => void }) {
  return (
    <label
      className={cn(
        "flex cursor-pointer flex-col items-center justify-center rounded-3xl border border-dashed px-6 py-10 text-center",
        file ? "border-success/50 bg-success/5" : "border-border bg-card",
      )}
    >
      <span className="sr-only">{label}</span>
      {file ? <FileText className="size-8 text-success" /> : <Upload className="size-8 text-muted-foreground" />}
      <span className="mt-3 text-sm font-semibold">{file ? file.name : label}</span>
      <span className="text-xs text-muted-foreground">{file ? "Replace file" : "PDF, PNG, JPEG, or WebP"}</span>
      <input
        type="file"
        accept="application/pdf,image/png,image/jpeg,image/webp"
        className="sr-only"
        onChange={(event) => onFile(event.target.files?.[0] ?? null)}
      />
    </label>
  );
}
