export default function Loading() {
  return (
    <div className="space-y-4" aria-busy="true">
      <div className="h-40 animate-pulse rounded-3xl bg-secondary" />
      <div className="h-56 animate-pulse rounded-3xl bg-secondary" />
    </div>
  );
}
