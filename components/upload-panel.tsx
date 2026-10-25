"use client";

import { FileText, Loader2, Upload, Eye, X, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useEffect, useMemo, type FormEvent } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { BANKS } from "@/lib/banks";
import type { CaseKind } from "@/lib/types";
import { cn } from "@/lib/utils";

const MAX_UPLOAD_BYTES = 4 * 1024 * 1024; // 4 MB

const modes: { id: CaseKind; label: string; detail: string }[] = [
  { id: "audit", label: "Institution audit", detail: "Score a POA against one custodian's checklist." },
  { id: "diagnosis", label: "Rejection letter", detail: "Translate the bank's no into a three-step plan." },
  { id: "jurisdiction", label: "Statutory drift", detail: "Compare execution formalities with the state rubric." },
];

type ProgressPhase = "idle" | "uploading" | "validating" | "analyzing" | "saving" | "complete" | "error";

export function UploadPanel() {
  const router = useRouter();
  const [mode, setMode] = useState<CaseKind>("audit");
  const [bank, setBank] = useState("Chase");
  const [customRules, setCustomRules] = useState("");
  const [poa, setPoa] = useState<File | null>(null);
  const [rejection, setRejection] = useState<File | null>(null);
  const [phase, setPhase] = useState<ProgressPhase>("idle");
  const [uploadPercent, setUploadPercent] = useState<number | null>(null);
  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const [statusMessage, setStatusMessage] = useState("Ready when the file is.");

  // Cleanup object URLs on change or unmount (F4)
  const previewUrl = useMemo(() => {
    if (!previewFile) return null;
    return URL.createObjectURL(previewFile);
  }, [previewFile]);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!poa) {
      toast.error("Upload the power of attorney first.");
      return;
    }
    if (poa.size > MAX_UPLOAD_BYTES) {
      toast.error(`The POA is ${(poa.size / (1024 * 1024)).toFixed(1)} MB. The limit is 4 MB.`);
      return;
    }
    if (mode === "diagnosis" && !rejection) {
      toast.error("Upload the rejection letter too.");
      return;
    }

    const formData = new FormData();
    formData.set("mode", mode);
    formData.set("poa", poa);
    if (mode === "audit") {
      formData.set("bank", bank);
      if (customRules.trim()) formData.set("customRules", customRules.trim());
    }
    if (rejection && mode === "diagnosis") {
      formData.set("rejection", rejection);
    }

    setPhase("uploading");
    setStatusMessage("Uploading document...");

    // Upload using XMLHttpRequest to get real upload progress (F1)
    const xhr = new XMLHttpRequest();

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        const percent = Math.round((e.loaded / e.total) * 100);
        setUploadPercent(percent);
        const mbLoaded = (e.loaded / (1024 * 1024)).toFixed(1);
        const mbTotal = (e.total / (1024 * 1024)).toFixed(1);
        setStatusMessage(`Uploading document (${mbLoaded} MB / ${mbTotal} MB)...`);
      }
    };

    xhr.upload.onload = () => {
      setPhase("analyzing");
      setUploadPercent(null);
      setStatusMessage(
        mode === "diagnosis"
          ? "Reading and diagnosing the rejection against the POA..."
          : "Analyzing document against statutory and institutional rules..."
      );
    };

    xhr.onreadystatechange = () => {
      if (xhr.readyState === XMLHttpRequest.DONE) {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const data = JSON.parse(xhr.responseText);
            if (data.record?.id) {
              setPhase("complete");
              setStatusMessage("Review completed.");
              toast.success(
                data.record.isSample
                  ? "Sample report saved. Add an AI API key for production reviews."
                  : "Compliance audit saved."
              );
              router.push(`/cases/${data.record.id}`);
              router.refresh();
              return;
            }
          } catch {
            // Handled below
          }
        }

        setPhase("error");
        let errorMsg = "The review could not be completed.";
        try {
          const errData = JSON.parse(xhr.responseText);
          if (errData.error) errorMsg = errData.error;
        } catch {
          // ignore
        }
        toast.error(errorMsg);
        setStatusMessage(errorMsg);
      }
    };

    xhr.onerror = () => {
      setPhase("error");
      setStatusMessage("Network error during document upload.");
      toast.error("Network error during document upload.");
    };

    xhr.open("POST", "/api/analyze");
    xhr.send(formData);
  }

  const isPending = phase === "uploading" || phase === "validating" || phase === "analyzing" || phase === "saving";

  return (
    <>
      <form onSubmit={onSubmit} className="mx-auto max-w-3xl space-y-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">New review</p>
          <h1 className="font-serif text-4xl">Upload the POA before the bank does.</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            PDF, PNG, JPEG, or WebP up to 4 MB (max 40 pages). Original documents live only in request memory and are never retained on disk.
          </p>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          {modes.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setMode(item.id)}
              aria-pressed={mode === item.id}
              className={cn(
                "rounded-2xl border px-4 py-3 text-left transition-colors",
                mode === item.id ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card hover:border-primary/50"
              )}
            >
              <span className="block text-sm font-semibold">{item.label}</span>
              <span
                className={cn(
                  "mt-1 block text-xs leading-relaxed",
                  mode === item.id ? "text-primary-foreground/75" : "text-muted-foreground"
                )}
              >
                {item.detail}
              </span>
            </button>
          ))}
        </div>

        <Dropzone
          label="Power of attorney"
          file={poa}
          onFile={setPoa}
          onPreview={(f) => setPreviewFile(f)}
        />

        {mode === "diagnosis" ? (
          <Dropzone
            label="Rejection letter"
            file={rejection}
            onFile={setRejection}
            onPreview={(f) => setPreviewFile(f)}
          />
        ) : null}

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
                  className={cn(
                    "rounded-xl border px-3 py-2 text-left text-sm transition-colors",
                    bank === name ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card hover:border-primary/40"
                  )}
                >
                  {name}
                </button>
              ))}
            </div>

            <label className="block text-sm font-semibold" htmlFor="custom-rules">
              Workspace notes for this review
            </label>
            <textarea
              id="custom-rules"
              value={customRules}
              onChange={(event) => setCustomRules(event.target.value)}
              maxLength={2000}
              placeholder="e.g. Credit union requires two disinterested witnesses for all durable powers."
              className="min-h-24 w-full rounded-2xl border border-border bg-card px-4 py-3 text-sm outline-none focus:border-primary"
            />
          </fieldset>
        ) : null}

        <div className="flex flex-wrap items-center gap-4">
          <Button type="submit" size="lg" disabled={isPending}>
            {isPending ? <Loader2 className="size-4 animate-spin mr-2" /> : null}
            {phase === "uploading"
              ? uploadPercent !== null
                ? `Uploading (${uploadPercent}%)`
                : "Uploading..."
              : phase === "analyzing"
                ? "Analyzing Document..."
                : phase === "saving"
                  ? "Saving Findings..."
                  : "Run review"}
          </Button>

          <p className="text-sm text-muted-foreground flex items-center gap-2" aria-live="polite">
            {phase === "error" ? <AlertCircle className="h-4 w-4 text-destructive shrink-0" /> : null}
            <span>{statusMessage}</span>
          </p>
        </div>
      </form>

      {/* Accessible Document Preview Modal (F4) */}
      {previewFile && previewUrl ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="relative flex h-[85vh] w-full max-w-4xl flex-col rounded-3xl border border-border bg-card shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                <h3 className="font-semibold text-sm truncate max-w-md">{previewFile.name}</h3>
                <span className="text-xs text-muted-foreground">({(previewFile.size / 1024).toFixed(0)} KB)</span>
              </div>
              <button
                type="button"
                onClick={() => setPreviewFile(null)}
                className="rounded-full p-1.5 hover:bg-secondary transition-colors"
                aria-label="Close preview"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 bg-muted/20 p-2 overflow-auto flex items-center justify-center">
              {previewFile.type === "application/pdf" ? (
                <iframe src={previewUrl} className="h-full w-full rounded-2xl border border-border" title="Document Preview" />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={previewUrl} alt="Document Preview" className="max-h-full max-w-full object-contain rounded-xl" />
              )}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

function Dropzone({
  label,
  file,
  onFile,
  onPreview,
}: {
  label: string;
  file: File | null;
  onFile: (file: File | null) => void;
  onPreview: (file: File) => void;
}) {
  return (
    <div
      className={cn(
        "relative flex flex-col items-center justify-center rounded-3xl border border-dashed px-6 py-10 text-center transition-colors",
        file ? "border-success/50 bg-success/5" : "border-border bg-card"
      )}
    >
      <label className="cursor-pointer flex flex-col items-center">
        <span className="sr-only">{label}</span>
        {file ? <FileText className="size-8 text-success" /> : <Upload className="size-8 text-muted-foreground" />}
        <span className="mt-3 text-sm font-semibold">{file ? file.name : label}</span>
        <span className="text-xs text-muted-foreground">{file ? "Click to replace file" : "PDF, PNG, JPEG, or WebP"}</span>
        <input
          type="file"
          accept="application/pdf,image/png,image/jpeg,image/webp"
          className="sr-only"
          onChange={(event) => onFile(event.target.files?.[0] ?? null)}
        />
      </label>

      {file ? (
        <div className="mt-3 flex items-center gap-2">
          <button
            type="button"
            onClick={() => onPreview(file)}
            className="flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1 text-xs font-medium text-foreground hover:bg-secondary transition-colors"
          >
            <Eye className="h-3.5 w-3.5" />
            Preview
          </button>
        </div>
      ) : null}
    </div>
  );
}
