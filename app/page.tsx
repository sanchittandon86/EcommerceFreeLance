import { supabase } from "@/lib/supabaseClient";
import CategorySection from "@/components/CategorySection";

export default async function Home() {
  const { data: products } = await supabase
    .from("products")
    .select("*");

  const categories = ["Bags", "BedSheet", "PillowCover", "Blankets"];

  return (
    <main className="max-w-6xl mx-auto p-6">
      <h1 className="text-4xl font-bold mb-10">Featured Products</h1>

      {categories.map((cat) => (
        <CategorySection
          key={cat}
          title={cat}
          products={products?.filter((p) => p.category === cat) || []}
        />
      ))}
    </main>
  );
}
