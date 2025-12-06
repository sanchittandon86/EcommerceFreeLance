export default function ProductDetailSkeleton() {
  return (
    <div className="max-w-5xl mx-auto p-6 grid md:grid-cols-2 gap-10">
      {/* Image skeleton */}
      <div>
        <div className="w-full h-[500px] bg-slate-200 animate-pulse rounded-lg shadow" />
      </div>

      {/* Content skeleton */}
      <div className="space-y-6">
        <div className="h-10 bg-slate-200 animate-pulse rounded w-3/4" />
        <div className="space-y-2">
          <div className="h-4 bg-slate-200 animate-pulse rounded" />
          <div className="h-4 bg-slate-200 animate-pulse rounded" />
          <div className="h-4 bg-slate-200 animate-pulse rounded w-5/6" />
        </div>
        <div className="h-8 bg-slate-200 animate-pulse rounded w-32" />
        <div className="h-12 bg-slate-200 animate-pulse rounded w-40" />
      </div>
    </div>
  );
}

