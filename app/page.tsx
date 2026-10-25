import { FileSearch, Landmark, Scale, Mail } from "lucide-react";
import Link from "next/link";
import { LandingMotion } from "@/components/landing-motion";
import { Logo, Wordmark } from "@/components/logo";

const features = [
  {
    icon: Landmark,
    title: "Institutional friction",
    body: "Score a power of attorney against the checklist a specific custodian actually argues about: durability, gifts, indemnification, and how old the ink is.",
  },
  {
    icon: FileSearch,
    title: "Rejection letters, translated",
    body: "Upload the bank's no next to the POA. The report maps the phrase they used to the paragraph that failed, then gives the caregiver three next steps.",
  },
  {
    icon: Scale,
    title: "Jurisdiction rule library",
    body: "Execution checkpoints for the states your matters actually touch, anchored to the public statute chapter and labeled as a review rubric.",
  },
];

export default function HomePage() {
  const contactEmail = process.env.CONTACT_EMAIL || "support@concretepoa.com";

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2">
          <Logo className="text-primary" />
          <Wordmark />
        </Link>
        <nav className="flex items-center gap-3 text-sm font-semibold">
          <a
            href={`mailto:${contactEmail}?subject=ConcretePOA%20Enterprise%20Inquiry`}
            className="hidden sm:inline-block rounded-full px-3 py-2 text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          >
            Contact
          </a>
          <Link href="/sign-in" className="rounded-full px-3 py-2 hover:bg-secondary">
            Sign in
          </Link>
          <Link href="/sign-up" className="rounded-full bg-primary px-4 py-2 text-primary-foreground">
            Open a workspace
          </Link>
        </nav>
      </header>
      <main>
        <section className="mx-auto grid max-w-6xl items-center gap-8 px-6 py-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">For elder-law and fiduciary teams</p>
            <h1 className="mt-3 font-serif text-5xl leading-[1.02]">Catch POA rejections before the bank does.</h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-muted-foreground">
              ConcretePOA reads a power of attorney the way a custody desk will: which powers are actually granted, whether the execution block will survive the state, and what to fix before a caregiver loses a week at the branch.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/sign-up" className="inline-flex h-12 items-center rounded-full bg-accent px-6 font-semibold text-accent-foreground">
                Start a firm workspace
              </Link>
              <a
                href={`mailto:${contactEmail}?subject=ConcretePOA%20Enterprise%20Inquiry`}
                className="inline-flex h-12 items-center gap-2 rounded-full border border-border bg-card px-6 font-semibold hover:bg-secondary transition-colors"
              >
                <Mail className="h-4 w-4 text-muted-foreground" />
                Contact Enterprise
              </a>
            </div>
          </div>
          <LandingMotion className="rounded-[28px] border border-border bg-card p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Product preview · demo workspace</p>
            <div className="mt-4 flex items-start justify-between gap-4">
              <div>
                <h2 className="font-serif text-3xl">Robert Hale · Vanguard</h2>
                <p className="mt-1 text-sm text-muted-foreground">Florida durable POA, executed 2018. Illustrative matter, not a client result.</p>
              </div>
              <div className="rounded-2xl bg-destructive/10 px-3 py-2 text-center">
                <div className="text-[10px] uppercase tracking-wide text-destructive">Score</div>
                <div className="font-serif text-3xl text-destructive">31</div>
              </div>
            </div>
            <ul className="mt-5 space-y-2 text-sm">
              <li className="rounded-2xl bg-secondary px-3 py-2">Proprietary Vanguard form was not used. Expect legal escalation.</li>
              <li className="rounded-2xl bg-secondary px-3 py-2">One witness on a Florida execution block.</li>
              <li className="rounded-2xl bg-secondary px-3 py-2">IRA beneficiary change is not specifically authorized.</li>
            </ul>
          </LandingMotion>
        </section>
        <section className="mx-auto grid max-w-6xl gap-4 px-6 pb-8 md:grid-cols-3">
          {features.map((feature) => (
            <article key={feature.title} className="rounded-3xl border border-border bg-card p-5">
              <feature.icon className="size-5 text-accent" />
              <h2 className="mt-4 font-serif text-2xl">{feature.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{feature.body}</p>
            </article>
          ))}
        </section>
      </main>
      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-6 py-6 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} ConcretePOA. A review aid, not a law firm.</p>
          <nav className="flex gap-4">
            <Link href="/disclaimer" className="hover:text-foreground">
              Disclaimer
            </Link>
            <Link href="/privacy" className="hover:text-foreground">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-foreground">
              Terms
            </Link>
            <a
              href={`mailto:${contactEmail}?subject=ConcretePOA%20Support`}
              className="hover:text-foreground"
            >
              Support
            </a>
          </nav>
        </div>
      </footer>
    </div>
  );
}
