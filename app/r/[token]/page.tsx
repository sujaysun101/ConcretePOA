import { resolveShareToken } from "@/lib/share";
import { CaseReport } from "@/components/case-report";
import { Logo } from "@/components/logo";
import { headers } from "next/headers";
import { AlertCircle, Lock, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

export const runtime = "nodejs";

export default async function SharedReportPage(props: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ passcode?: string }>;
}) {
  const { token } = await props.params;
  const { passcode } = await props.searchParams;
  const reqHeaders = await headers();

  const shareData = await resolveShareToken(token, passcode, reqHeaders);

  if (!shareData) {
    notFound();
  }

  // If passcode required but not yet provided or incorrect
  if (shareData.requiresPasscode && !shareData.isUnlocked) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
        <div className="w-full max-w-md rounded-3xl border border-border bg-card p-8 shadow-sm text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Lock className="h-6 w-6" />
          </div>
          <h1 className="mt-4 font-serif text-2xl font-bold">Passcode Protected</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            This review report was shared with a security passcode. Enter the passcode to view the compliance findings.
          </p>

          {passcode ? (
            <div className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-destructive/10 p-3 text-xs text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>Incorrect passcode. Please try again.</span>
            </div>
          ) : null}

          <form method="GET" className="mt-6 space-y-4">
            <div>
              <input
                type="password"
                name="passcode"
                required
                placeholder="Enter passcode"
                className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <button
              type="submit"
              className="w-full rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Unlock Report
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Top Header */}
      <header className="border-b border-border bg-card/60 backdrop-blur-md px-6 py-4">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Logo />
          </Link>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <ShieldCheck className="h-4 w-4 text-primary" />
            <span>Shared Read-Only Report</span>
          </div>
        </div>
      </header>

      {/* Main Report View */}
      <main className="mx-auto max-w-5xl px-6 py-10">
        {/* Prominent Legal Disclaimer Banner */}
        <div className="mb-8 rounded-2xl border border-warning/40 bg-warning/10 p-4 text-xs leading-relaxed text-foreground">
          <strong className="font-semibold text-foreground">NOT LEGAL ADVICE:</strong> ConcretePOA is an informational
          pre-flight compliance checker. This document and its generated findings do not constitute legal advice, do
          not establish an attorney-client relationship, and cannot guarantee institutional acceptance. Consult a licensed
          elder law or estate planning attorney in your jurisdiction for legal counsel.
        </div>

        <CaseReport record={shareData.caseRecord} />
      </main>
    </div>
  );
}
