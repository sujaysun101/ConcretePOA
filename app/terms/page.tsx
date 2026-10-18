import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Terms" };

export default function TermsPage() {
  return (
    <article className="mx-auto max-w-2xl px-6 py-16">
      <Link href="/" className="text-sm font-semibold text-accent">
        ConcretePOA
      </Link>
      <h1 className="mt-4 font-serif text-4xl">Terms</h1>
      <div className="mt-4 space-y-4 text-sm leading-relaxed text-muted-foreground">
        <p>Use the workspace for your own matters or for clients who have authorized the review. You are responsible for what you upload and for checking a report before anyone relies on it.</p>
        <p>Do not submit documents you are not allowed to share with a hosted model provider. If no model key is configured, the product returns a labeled sample instead of a document review.</p>
        <p>The service may rate-limit reviews per signed-in user. Demo matters shipped with the product are synthetic.</p>
      </div>
    </article>
  );
}
