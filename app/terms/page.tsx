import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, ShieldAlert, Award } from "lucide-react";

export const metadata: Metadata = { title: "Terms of Service | ConcretePOA" };

export default function TermsPage() {
  return (
    <article className="mx-auto max-w-3xl px-6 py-16">
      <Link href="/" className="text-sm font-semibold text-accent hover:underline">
        ← Back to ConcretePOA
      </Link>
      <div className="mt-4 flex items-center gap-2">
        <span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Draft for Attorney Review
        </span>
        <span className="text-xs text-muted-foreground">Effective Date: March 2026</span>
      </div>
      <h1 className="mt-3 font-serif text-4xl font-bold">Terms of Service</h1>

      <div className="mt-8 space-y-8 text-sm leading-relaxed text-foreground">
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <Award className="h-5 w-5 text-primary" />
            <h2 className="font-serif text-xl font-semibold">1. Permitted Use</h2>
          </div>
          <p className="text-muted-foreground">
            ConcretePOA grants you a non-exclusive license to use the service for personal document pre-flighting or professional client
            representation (for elder law attorneys, wealth advisors, and family fiduciaries). You represent that you possess the lawful
            right and necessary authority to upload any legal instruments submitted for analysis.
          </p>
        </section>

        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-primary" />
            <h2 className="font-serif text-xl font-semibold">2. User Responsibilities & Data Rights</h2>
          </div>
          <p className="text-muted-foreground">
            You are solely responsible for verifying the accuracy and completeness of all generated findings against original physical instruments
            and current statutory codes. You agree not to upload fraudulent, unlawfully acquired, or malicious files.
          </p>
        </section>

        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-primary" />
            <h2 className="font-serif text-xl font-semibold">3. Disclaimer of Warranties & Limitation of Liability</h2>
          </div>
          <p className="text-muted-foreground">
            The service is provided &quot;AS IS&quot; and &quot;AS AVAILABLE&quot; without warranty of any kind, express or implied.
            To the maximum extent permitted by law, ConcretePOA and its affiliates disclaim all liability for any indirect, incidental,
            punitive, or consequential damages resulting from institutional rejection, delayed access to funds, or reliance on automated reports.
          </p>
        </section>
      </div>
    </article>
  );
}
