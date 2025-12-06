import Image from "next/image";
import { supabase } from "@/lib/supabaseClient";
import ProductClientSection from "@/components/ProductClientSection";

export default async function ProductPage({ params }: { params: Promise<{ id: string }> | { id: string } }) {
  // Unwrap params (handles both Promise and plain object)
  const resolvedParams = (await params) as { id: string };
  const id = resolvedParams?.id;

  // If id is missing, show friendly message
  if (!id) {
    return <div className="p-6 text-red-600">Invalid product ID.</div>;
  }

  // Fetch product
  const { data: product, error } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .single();

  // Log for debugging (remove in production)
  console.log("PARAM ID:", id);
  console.log("PRODUCT RESULT:", product);
  console.log("SUPABASE ERROR:", error);

  if (error || !product) {
    return <div className="p-6 text-red-600">Product not found.</div>;
  }

  return (
<div className="max-w-5xl mx-auto p-6 grid md:grid-cols-2 gap-10">
  <div>
    <img
      src={product.image_url}
      alt={product.name}
      className="w-full h-auto rounded-lg shadow"
    />
  </div>

  <div>
    <h1 className="text-4xl font-bold">{product.name}</h1>
    <p className="text-gray-600 mt-2 text-lg">{product.description}</p>

    <p className="text-3xl font-semibold mt-6">₹{product.price}</p>

    <ProductClientSection product={product} />
  </div>
</div>

  );
}
