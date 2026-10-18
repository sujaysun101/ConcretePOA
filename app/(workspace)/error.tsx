"use client";

export default function WorkspaceError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="rounded-3xl border border-border bg-card p-8">
      <h1 className="font-serif text-3xl">This page did not finish loading.</h1>
      <p className="mt-2 text-sm text-muted-foreground">Try it again. If it keeps failing, the workspace data source is the first place to check.</p>
      <button type="button" onClick={reset} className="mt-4 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
        Try again
      </button>
    </div>
  );
}
