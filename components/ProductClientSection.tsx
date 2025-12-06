"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/components/CartContext";
import { useWishlist } from "@/components/WishlistContext";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Heart } from "lucide-react";

export default function ProductClientSection({ product }: { product: any }) {
  const router = useRouter();
  const { addToCart } = useCart();
  const { isWishlisted, toggleWishlist } = useWishlist();
  const [user, setUser] = useState<any>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const isInWishlist = isWishlisted(product.id);

  useEffect(() => {
    // Check if user is authenticated
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setCheckingAuth(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleAddToCart = async () => {
    // Add to cart - works for both guest and authenticated users
    // CartContext handles the storage (localStorage for guests, Supabase for authenticated)
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      image_url: product.image_url,
      qty: 1,
    });
  };

  const handleWishlistToggle = async () => {
    // Check authentication before adding to wishlist
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user) {
      // Redirect to login page if not authenticated
      router.push("/login?redirect=" + encodeURIComponent(window.location.pathname));
      return;
    }

    await toggleWishlist({
      id: product.id,
      name: product.name,
      price: product.price,
      image_url: product.image_url,
    });
  };

  return (
    <div className="flex gap-4 mt-6">
      <Button
        size="lg"
        className="flex-1 bg-amber-700 hover:bg-amber-800 text-white"
        onClick={handleAddToCart}
        disabled={checkingAuth}
      >
        Add to Cart
      </Button>
      <Button
        size="lg"
        variant="outline"
        className="border-2 border-slate-300 hover:border-red-400 hover:bg-red-50"
        onClick={handleWishlistToggle}
        disabled={checkingAuth}
        aria-label={isInWishlist ? "Remove from wishlist" : "Add to wishlist"}
      >
        {isInWishlist ? (
          <Heart className="w-5 h-5 fill-red-500 text-red-500" />
        ) : (
          <Heart className="w-5 h-5 text-slate-400" />
        )}
      </Button>
    </div>
  );
}
