"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CreateOrganization } from "@clerk/nextjs";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function OnboardingView({ userId: _userId }: { userId: string }) {
  const router = useRouter();
  const [accepted, setAccepted] = useState(false);
  const [step, setStep] = useState<"disclaimer" | "workspace">("disclaimer");

  function onProceed() {
    if (!accepted) {
      toast.error("Please review and accept the legal disclaimer and terms to continue.");
      return;
    }
    setStep("workspace");
  }

  function choosePersonal() {
    toast.success("Welcome to your personal workspace.");
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6 py-12">
      <div className="w-full max-w-2xl rounded-3xl border border-border bg-card p-8 shadow-sm">
        {step === "disclaimer" ? (
          <div className="space-y-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">Step 1 of 2</p>
              <h1 className="mt-2 font-serif text-3xl">Review & Accept Legal Disclaimer</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Before using ConcretePOA to evaluate Power of Attorney documents, please confirm your understanding of our service boundaries.
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-secondary/50 p-5 text-sm leading-relaxed text-muted-foreground">
              <p className="font-semibold text-foreground">Informational Review Aid Only</p>
              <p className="mt-2">
                ConcretePOA is an automated pre-flight review tool designed to identify common institutional friction points and statutory execution discrepancies.
              </p>
              <p className="mt-2">
                <strong>ConcretePOA is NOT a law firm and does NOT provide legal advice.</strong> Analysis reports, acceptance probability estimates, and remediation templates are provided as informational drafts for review with qualified legal counsel.
              </p>
            </div>

            <label className="flex items-start gap-3 text-sm">
              <input
                type="checkbox"
                checked={accepted}
                onChange={(e) => setAccepted(e.target.checked)}
                className="mt-1 size-4 rounded border-border"
              />
              <span>
                I have read and agree to the{" "}
                <Link href="/disclaimer" target="_blank" className="font-semibold text-accent underline">
                  Legal Disclaimer
                </Link>
                ,{" "}
                <Link href="/terms" target="_blank" className="font-semibold text-accent underline">
                  Terms of Service
                </Link>
                , and{" "}
                <Link href="/privacy" target="_blank" className="font-semibold text-accent underline">
                  Privacy Policy
                </Link>
                .
              </span>
            </label>

            <Button onClick={onProceed} className="w-full" disabled={!accepted}>
              Continue to Workspace Selection
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">Step 2 of 2</p>
              <h1 className="mt-2 font-serif text-3xl">Select Your Workspace</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Choose the workspace type that fits your needs:
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col justify-between rounded-2xl border border-border p-5">
                <div>
                  <h3 className="font-serif text-xl">Personal Workspace</h3>
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                    For individual caregivers, agents, and principals managing a personal or family member&apos;s POA.
                  </p>
                </div>
                <Button onClick={choosePersonal} variant="outline" className="mt-4 w-full">
                  Use Personal Workspace
                </Button>
              </div>

              <div className="flex flex-col justify-between rounded-2xl border border-border p-5">
                <div>
                  <h3 className="font-serif text-xl">Firm Organization</h3>
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                    For elder law practices, fiduciary teams, and wealth managers sharing case records with colleagues.
                  </p>
                </div>
                <div className="mt-4">
                  <CreateOrganization afterCreateOrganizationUrl="/dashboard" />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
