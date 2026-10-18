export default function Loading() {
  return (
    <div className="space-y-4" aria-busy="true" aria-live="polite">
      <div className="h-10 w-72 animate-pulse rounded-2xl bg-secondary" />
      <div className="grid gap-3 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-24 animate-pulse rounded-2xl bg-secondary" />
        ))}
      </div>
      <div className="h-64 animate-pulse rounded-3xl bg-secondary" />
    </div>
  );
}
