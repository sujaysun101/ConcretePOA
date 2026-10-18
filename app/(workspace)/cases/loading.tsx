export default function Loading() {
  return (
    <div className="space-y-3" aria-busy="true">
      <div className="h-10 w-48 animate-pulse rounded-2xl bg-secondary" />
      {Array.from({ length: 5 }).map((_, index) => (
        <div key={index} className="h-20 animate-pulse rounded-2xl bg-secondary" />
      ))}
    </div>
  );
}
