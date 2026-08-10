/** Blocs gris animes affiches pendant le chargement d'une page. */
export function SkeletonCard() {
  return (
    <div className="card animate-pulse">
      <div className="h-4 w-1/3 rounded bg-white/10" />
      <div className="mt-4 h-24 rounded-xl bg-white/5" />
    </div>
  );
}

export default function PageSkeleton({ cards = 6 }: { cards?: number }) {
  return (
    <div className="wrap py-12">
      <div className="h-3 w-24 animate-pulse rounded bg-white/10" />
      <div className="mt-4 h-9 w-64 animate-pulse rounded bg-white/10" />
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: cards }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    </div>
  );
}
