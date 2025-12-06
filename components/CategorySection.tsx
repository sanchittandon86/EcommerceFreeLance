import ProductCard from "./ProductCard";

export default function CategorySection({
  title,
  products,
}: {
  title: string;
  products: any[];
}) {
  return (
    <div className="mb-12">
      <h2 className="text-3xl font-bold mb-6">{title}</h2>

      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {products.map((p) => (
          <ProductCard
            key={p.id}
            id={p.id}
            name={p.name}
            price={p.price}
            image_url={p.image_url}
          />
        ))}
      </div>
    </div>
  );
}
