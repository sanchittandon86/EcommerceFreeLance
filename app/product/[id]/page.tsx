import Image from "next/image";
import { supabase } from "@/lib/supabaseClient";
import ProductClientSection from "@/components/ProductClientSection";
import ProductGallery from "@/components/ProductGallery";
import ProductCard from "@/components/ProductCard";

export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }> | { id: string };
}) {
  const resolved = (await params) as { id: string };
  const id = resolved?.id;

  if (!id) {
    return <div className="p-6 text-red-600">Invalid product ID.</div>;
  }

  // Fetch product - only active products are accessible to users
  const { data: product, error } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .eq("is_active", true)
    .single();

  if (error || !product) {
    return <div className="p-6 text-red-600">Product not found.</div>;
  }

  // Parse images - handle array, JSON string, and Python-style list string
  let imagesArray: string[] = [];
  if (product.images) {
    if (typeof product.images === "string") {
      try {
        // Try JSON.parse first
        const parsed = JSON.parse(product.images);
        imagesArray = Array.isArray(parsed) ? parsed : [parsed];
      } catch {
        // If JSON parsing fails, try parsing Python-style list string
        // Format: "['url1', 'url2', 'url3']"
        const pythonListMatch = product.images.match(/\[([\s\S]*?)\]/);
        if (pythonListMatch) {
          // Extract URLs from the list string
          const urlMatches = pythonListMatch[1].match(/'([^']+)'/g);
          if (urlMatches) {
            imagesArray = urlMatches.map((match: string) => match.slice(1, -1)); // Remove quotes
          }
        } else {
          // If it doesn't look like a list, treat as single image string
          // Only if it's a valid URL
          if (product.images.startsWith("http://") || product.images.startsWith("https://") || product.images.startsWith("/")) {
            imagesArray = [product.images];
          }
        }
      }
    } else if (Array.isArray(product.images)) {
      imagesArray = product.images;
    }
  }

  // Combine with image_url if it exists and isn't already in the array
  if (product.image_url && !imagesArray.includes(product.image_url)) {
    imagesArray = [product.image_url, ...imagesArray];
  }

  // Fallback to image_url if no images array
  if (imagesArray.length === 0 && product.image_url) {
    imagesArray = [product.image_url];
  }

  // Fetch related products - only active products
  const { data: related } = await supabase
    .from("products")
    .select("*")
    .eq("category", product.category)
    .eq("is_active", true)
    .neq("id", product.id)
    .limit(3);

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Product Layout */}
      <div className="grid md:grid-cols-2 gap-10">
        {/* LEFT: Gallery */}
        <div>
          <ProductGallery images={imagesArray} />
        </div>

        {/* RIGHT: Product details */}
        <div>
          <h1 className="text-4xl font-bold">{product.name}</h1>

          <p className="text-gray-600 mt-2 text-lg">
            {product.description}
          </p>

          <p className="text-3xl font-semibold mt-6">₹{product.price}</p>

          <div className="mt-6">
            <ProductClientSection product={product} />
          </div>

          {/* NGO Impact Message */}
          <div className="mt-10 p-4 bg-orange-50 border rounded-lg">
            <p className="text-sm text-gray-700">
              ❤️ Every purchase supports our NGO initiatives and empowers
              local artisans.
            </p>
          </div>
        </div>
      </div>

      {/* Related Products */}
      {related && related.length > 0 && (
        <div className="mt-20">
          <h2 className="text-3xl font-bold mb-6">Related Products</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {related.map((p) => (
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
      )}
    </div>
  );
}
