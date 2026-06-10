export default function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-md border border-neutral-200 bg-white">
      <div className="aspect-square rounded-t-md bg-neutral-200" />
      <div className="space-y-2 p-3">
        <div className="h-4 w-3/4 rounded bg-neutral-200" />
        <div className="h-4 w-1/3 rounded bg-neutral-200" />
      </div>
    </div>
  );
}

export function SkeletonGrid({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}