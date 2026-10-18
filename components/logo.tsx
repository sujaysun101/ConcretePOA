import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={cn("size-8", className)} aria-hidden="true">
      <path d="M16 2.2 27.5 7.2v8.6c0 7.3-4.8 12.1-11.5 14-6.7-1.9-11.5-6.7-11.5-14V7.2L16 2.2Z" fill="currentColor" />
      <path d="M11 16.2 14.2 19.4 21.4 12.2" fill="none" stroke="#f6e7da" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cn("font-serif text-lg tracking-tight", className)}>
      Concrete<span className="text-accent">POA</span>
    </span>
  );
}
