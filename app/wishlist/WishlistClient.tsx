"use client";

import ProductCard from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { useWishlist } from "@/components/WishlistContext";
import { useCart } from "@/components/CartContext";
import Link from "next/link";
import { Heart, ShoppingCart } from "lucide-react";

export default function WishlistClient() {
  const { wishlist, isLoading } = useWishlist();
  const { addToCart } = useCart();

  const handleAddAllToCart = () => {
    wishlist.forEach((item) => {
      addToCart({
        id: item.id,
        name: item.name,
        price: item.price,
        image_url: item.image_url,
        qty: 1,
      });
    });
  };

  return (
    <main className="max-w-7xl mx-auto px-6 py-16">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-4xl font-bold text-slate-900">My Wishlist</h1>
          {!isLoading && wishlist.length > 0 && (
            <Button
              onClick={handleAddAllToCart}
              size="lg"
              className="bg-amber-700 hover:bg-amber-800 text-white flex items-center gap-2"
            >
              <ShoppingCart className="w-5 h-5" />
              Add All to Cart
            </Button>
          )}
        </div>
        <p className="text-slate-600">
          {isLoading ? "Loading..." : `${wishlist.length} ${wishlist.length === 1 ? "item" : "items"} saved`}
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-slate-600">Loading your wishlist...</div>
        </div>
      ) : wishlist.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-24 h-24 rounded-full bg-slate-100 flex items-center justify-center mb-6">
            <Heart className="w-12 h-12 text-slate-400" />
          </div>
          <h2 className="text-2xl font-semibold text-slate-900 mb-2">
            Your wishlist is empty
          </h2>
          <p className="text-slate-600 mb-6 max-w-md">
            Start adding products you love to your wishlist. They'll appear here
            for easy access later.
          </p>
          <Button asChild size="lg" className="bg-amber-700 hover:bg-amber-800 text-white">
            <Link href="/">Continue Shopping</Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {wishlist.map((product) => (
            <ProductCard
              key={product.id}
              id={product.id}
              name={product.name}
              price={product.price}
              image_url={product.image_url}
            />
          ))}
        </div>
      )}
    </main>
  );
}

