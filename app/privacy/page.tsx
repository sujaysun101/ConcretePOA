import type { Metadata } from "next";
import Link from "next/link";
import { ShieldCheck, Lock, Server, Trash2 } from "lucide-react";

export const metadata: Metadata = { title: "Privacy Policy | ConcretePOA" };

export default function PrivacyPage() {
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
      <h1 className="mt-3 font-serif text-4xl font-bold">Privacy Policy</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        ConcretePOA is built from the ground up for strict data minimization and confidentiality of sensitive legal documents.
      </p>

      <div className="mt-8 space-y-8 text-sm leading-relaxed text-foreground">
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <Trash2 className="h-5 w-5 text-primary" />
            <h2 className="font-serif text-xl font-semibold">1. Zero Document Retention Policy</h2>
          </div>
          <p className="text-muted-foreground">
            Uploaded Power of Attorney documents and rejection letters exist solely in volatile request memory during the analysis process.
            <strong> ConcretePOA never saves uploaded PDF or image files to persistent disk, object storage, or databases.</strong> Once
            the compliance report is generated, the file buffer is freed from memory.
          </p>
        </section>

        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-primary" />
            <h2 className="font-serif text-xl font-semibold">2. Field-Level Envelope Encryption (AES-256-GCM)</h2>
          </div>
          <p className="text-muted-foreground">
            Extracted compliance findings and personally identifiable information (such as principal name, agent name, case title, and
            user email addresses) are encrypted at the application layer using AES-256-GCM envelope encryption before being stored.
            Each ciphertext envelope includes an authenticated key identifier and initialization vector, ensuring that even if raw database
            snapshots are accessed, sensitive data cannot be read without the runtime encryption key.
          </p>
        </section>

        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <Server className="h-5 w-5 text-primary" />
            <h2 className="font-serif text-xl font-semibold">3. Third-Party Subprocessors & AI Data Governance</h2>
          </div>
          <p className="text-muted-foreground">
            We partner exclusively with enterprise infrastructure providers that commit to strict security controls:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-muted-foreground">
            <li>
              <strong>Clerk:</strong> User authentication, session management, and organization multi-tenancy.
            </li>
            <li>
              <strong>Neon:</strong> Managed PostgreSQL storage with TLS-in-transit and AES-256 at-rest encryption.
            </li>
            <li>
              <strong>Upstash:</strong> Managed Redis for rate limiting and daily spend ceilings.
            </li>
            <li>
              <strong>Google Cloud Run:</strong> Private container execution for the deterministic Python statutory rules engine.
            </li>
            <li>
              <strong>Anthropic / Google Cloud AI:</strong> Stateless AI inference. Customer document data is never used to train foundation models.
            </li>
            <li>
              <strong>Vercel:</strong> Edge hosting, serverless compute, and Content Delivery Network.
            </li>
          </ul>
        </section>

        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            <h2 className="font-serif text-xl font-semibold">4. Data Retention & Automatic Purging</h2>
          </div>
          <p className="text-muted-foreground">
            Firms and individual users can configure automated data retention policies (30, 90, 365 days, or indefinite). An automated
            daily retention cron evaluates expired records and permanently purges findings and metadata.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-serif text-xl font-semibold">5. GDPR & CCPA Self-Serve Rights</h2>
          <p className="text-muted-foreground">
            Every user has complete sovereignty over their data:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
            <li>
              <strong>Portability:</strong> You can download a complete machine-readable JSON export of all your reviews at any time via Account Settings.
            </li>
            <li>
              <strong>Erasure (Right to be Forgotten):</strong> You can permanently delete your entire case history or delete your account with one click.
            </li>
          </ul>
        </section>
      </div>
    </article>
  );
}
