export default function ProductDetailSkeleton() {
  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Product Layout */}
      <div className="grid md:grid-cols-2 gap-10">
        {/* LEFT: Gallery skeleton */}
        <div>
          {/* Main Image skeleton */}
          <div className="w-full h-[600px] bg-slate-200 animate-pulse rounded-xl border shadow mb-4" />
          
          {/* Thumbnails skeleton */}
          <div className="grid grid-cols-4 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="w-full h-[120px] bg-slate-200 animate-pulse rounded-lg border"
              />
            ))}
          </div>
        </div>

        {/* RIGHT: Product details skeleton */}
        <div className="space-y-6">
          {/* Title skeleton */}
          <div className="h-10 bg-slate-200 animate-pulse rounded w-3/4" />
          
          {/* Description skeleton */}
          <div className="space-y-2">
            <div className="h-4 bg-slate-200 animate-pulse rounded" />
            <div className="h-4 bg-slate-200 animate-pulse rounded" />
            <div className="h-4 bg-slate-200 animate-pulse rounded w-5/6" />
          </div>
          
          {/* Price skeleton */}
          <div className="h-9 bg-slate-200 animate-pulse rounded w-32" />
          
          {/* Add to cart button skeleton */}
          <div className="h-12 bg-slate-200 animate-pulse rounded w-40" />
          
          {/* NGO Impact Message skeleton */}
          <div className="mt-10 p-4 bg-slate-100 border rounded-lg">
            <div className="h-4 bg-slate-200 animate-pulse rounded w-full" />
          </div>
        </div>
      </div>

      {/* Related Products skeleton */}
      <div className="mt-20">
        <div className="h-9 bg-slate-200 animate-pulse rounded w-48 mb-6" />
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="border rounded-lg overflow-hidden">
              <div className="w-full h-48 bg-slate-200 animate-pulse" />
              <div className="p-4 space-y-2">
                <div className="h-5 bg-slate-200 animate-pulse rounded w-3/4" />
                <div className="h-6 bg-slate-200 animate-pulse rounded w-20" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

