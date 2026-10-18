import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-lg px-6 py-24 text-center">
      <h1 className="font-serif text-4xl">That page is not in this workspace.</h1>
      <Link href="/" className="mt-6 inline-flex rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
        Back to ConcretePOA
      </Link>
    </div>
  );
}
