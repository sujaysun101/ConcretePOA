import type { Metadata } from "next";

export const metadata: Metadata = { title: "Settings" };

export default function DemoSettingsPage() {
  const rows = [
    ["Workspace", "Harbor Elder Law"],
    ["Storage", "Demo data"],
    ["Model", "Screenshot workspace — live reviews require a signed-in organization"],
    ["Sign-in", "Demo shell for portfolio capture"],
  ];
  return (
    <div className="max-w-2xl">
      <h1 className="font-serif text-4xl">How this workspace is running.</h1>
      <dl className="mt-6 divide-y divide-border rounded-3xl border border-border bg-card">
        {rows.map(([term, detail]) => (
          <div key={term} className="grid gap-1 px-5 py-4 sm:grid-cols-[180px_1fr]">
            <dt className="text-sm font-semibold">{term}</dt>
            <dd className="text-sm text-muted-foreground">{detail}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
