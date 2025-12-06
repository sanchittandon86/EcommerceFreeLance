import ProductCard from "./ProductCard";
import ProductCardSkeleton from "./ProductCardSkeleton";

export default function CategorySection({
  title,
  products,
  isLoading = false,
}: {
  title: string;
  products: any[];
  isLoading?: boolean;
}) {
  return (
    <div className="mb-12">
      <h2 className="text-3xl font-bold mb-6">{title}</h2>

      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 auto-rows-fr">
        {isLoading ? (
          // Show 4 skeleton cards while loading
          Array.from({ length: 4 }).map((_, index) => (
            <ProductCardSkeleton key={`skeleton-${index}`} />
          ))
        ) : products.length > 0 ? (
          products.map((p) => (
            <ProductCard
              key={p.id}
              id={p.id}
              name={p.name}
              price={p.price}
              image_url={p.image_url}
            />
          ))
        ) : (
          <p className="text-slate-500 col-span-full text-center py-8">
            No products found in this category.
          </p>
        )}
      </div>
    </div>
  );
}
