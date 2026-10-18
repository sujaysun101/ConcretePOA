import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Privacy" };

export default function PrivacyPage() {
  return (
    <article className="mx-auto max-w-2xl px-6 py-16">
      <Link href="/" className="text-sm font-semibold text-accent">
        ConcretePOA
      </Link>
      <h1 className="mt-4 font-serif text-4xl">Privacy</h1>
      <div className="mt-4 space-y-4 text-sm leading-relaxed text-muted-foreground">
        <p>Sign-in is handled by Clerk. Case history is stored for the active organization when DATABASE_URL is configured. Without that database, matters stay in the server process memory and disappear when the process does.</p>
        <p>Uploaded PDFs are read on the server for the review and are not written to the case record. The saved record keeps the findings, the file name, and the parties the review extracted.</p>
        <p>Model requests go to Anthropic only when ANTHROPIC_API_KEY is set on the server. The key is never sent to the browser.</p>
      </div>
    </article>
  );
}
