"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function ImportDemo() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  async function load() {
    setPending(true);
    const response = await fetch("/api/cases/import-demo", { method: "POST" });
    const payload = (await response.json()) as { error?: string };
    setPending(false);
    if (!response.ok) {
      toast.error(payload.error || "Demo matters could not be loaded.");
      return;
    }
    toast.success("Demo matters are in this workspace.");
    router.refresh();
  }
  return (
    <div className="rounded-3xl border border-dashed border-border bg-card p-6">
      <h2 className="font-serif text-3xl">This workspace has no matters yet.</h2>
      <p className="mt-2 max-w-xl text-sm text-muted-foreground">
        Load the Harbor Elder Law demo set to see scored audits, two rejection letters, and statutory drift. They are labeled demo and can be deleted.
      </p>
      <Button className="mt-4" type="button" onClick={load} disabled={pending}>
        {pending ? "Loading" : "Load demo matters"}
      </Button>
    </div>
  );
}
