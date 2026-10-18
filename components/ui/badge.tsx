import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export function Badge({ className, tone = "neutral", ...props }: ComponentProps<"span"> & { tone?: "neutral" | "good" | "warn" | "bad" | "accent" }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold tracking-wide",
        tone === "neutral" && "border-border bg-secondary text-secondary-foreground",
        tone === "good" && "border-success/30 bg-success/10 text-success",
        tone === "warn" && "border-warning/30 bg-warning/10 text-warning",
        tone === "bad" && "border-destructive/30 bg-destructive/10 text-destructive",
        tone === "accent" && "border-accent/30 bg-accent/10 text-accent",
        className,
      )}
      {...props}
    />
  );
}
