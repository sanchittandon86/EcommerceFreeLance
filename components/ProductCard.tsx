"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Heart } from "lucide-react";
import { useWishlist } from "@/components/WishlistContext";
import { supabase } from "@/lib/supabaseClient";

interface ProductCardProps {
  id: string;
  name: string;
  price: number;
  image_url: string;
}

export default function ProductCard({ id, name, price, image_url }: ProductCardProps) {
  const router = useRouter();
  const { isWishlisted, toggleWishlist } = useWishlist();
  const isInWishlist = isWishlisted(id);

  const handleWishlistToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Check authentication before adding to wishlist
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user) {
      // Redirect to login page if not authenticated
      router.push("/login?redirect=" + encodeURIComponent(window.location.pathname));
      return;
    }

    await toggleWishlist({ id, name, price, image_url });
  };

  return (
    <Link href={`/product/${id}`} className="block h-full">
      <Card className="group h-full flex flex-col overflow-hidden border-2 border-slate-200/50 hover:border-amber-300/60 transition-all duration-300 hover:shadow-xl hover:shadow-amber-100/50 bg-gradient-to-br from-white to-slate-50/30">
        <CardHeader className="p-0 relative overflow-hidden">
          <div className="relative w-full h-48 overflow-hidden">
            <img
              src={image_url}
              alt={name}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
            {/* Color grading overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 via-transparent to-rose-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            
            {/* Wishlist Heart Button - Top Right */}
            <button
              onClick={handleWishlistToggle}
              className="absolute top-2 right-2 z-10 p-2 rounded-full bg-white/90 backdrop-blur-sm hover:bg-white transition-all duration-200 shadow-sm hover:shadow-md"
              aria-label={isInWishlist ? "Remove from wishlist" : "Add to wishlist"}
            >
              {isInWishlist ? (
                <Heart className="w-5 h-5 fill-red-500 text-red-500" />
              ) : (
                <Heart className="w-5 h-5 text-slate-400 group-hover:text-red-500 transition-colors duration-300" />
              )}
            </button>
          </div>
        </CardHeader>

        <CardContent className="p-4 flex flex-col flex-1 space-y-2">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-slate-900 group-hover:text-amber-700 transition-colors duration-300 line-clamp-2">
              {name}
            </h3>
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-slate-200/60">
            <p className="text-xl font-bold text-amber-700 bg-gradient-to-r from-amber-600 to-amber-700 bg-clip-text text-transparent">
              ₹{price}
            </p>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
