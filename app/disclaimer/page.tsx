import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Disclaimer" };

export default function DisclaimerPage() {
  return (
    <article className="mx-auto max-w-2xl px-6 py-16">
      <Link href="/" className="text-sm font-semibold text-accent">
        ConcretePOA
      </Link>
      <h1 className="mt-4 font-serif text-4xl">Disclaimer</h1>
      <div className="mt-4 space-y-4 text-sm leading-relaxed text-muted-foreground">
        <p>ConcretePOA is a document-review aid for professional teams. It is not a law firm, and a report is not legal advice, a legal opinion, or a prediction that a bank will accept a document.</p>
        <p>Jurisdiction entries point at public statute chapters as review checkpoints. They are not a quotation of the current statutory form, and they can be wrong or out of date. Institution rows describe a published intake rubric maintained in this product, not a bank&apos;s confidential manual.</p>
        <p>Have counsel review any affidavit or amendment language before it is signed or sent.</p>
      </div>
    </article>
  );
}
