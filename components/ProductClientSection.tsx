"use client";

import { useCart } from "@/components/CartContext";
import { Button } from "@/components/ui/button";

export default function ProductClientSection({ product }: { product: any }) {
  const { addToCart } = useCart();

  return (
    <Button
      size="lg"
      className="mt-6"
      onClick={() =>
        addToCart({
          id: product.id,
          name: product.name,
          price: product.price,
          image_url: product.image_url,
          qty: 1,
        })
      }
    >
      Add to Cart
    </Button>
  );
}
