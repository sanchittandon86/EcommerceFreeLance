"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import type { User } from "@supabase/supabase-js";

interface WishlistItem {
  id: string;
  name: string;
  price: number;
  image_url: string;
}

interface WishlistContextType {
  wishlist: WishlistItem[];
  isLoading: boolean;
  addToWishlist: (item: WishlistItem) => Promise<void>;
  removeFromWishlist: (productId: string) => Promise<void>;
  toggleWishlist: (item: WishlistItem) => Promise<void>;
  isWishlisted: (productId: string) => boolean;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  // Get user on mount and listen for auth changes
  useEffect(() => {
    let mounted = true;

    // Get initial user - use getUser() for more reliable validation
    async function loadUser() {
      try {
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        if (mounted) {
          setUser(currentUser ?? null);
        }
      } catch (error) {
        console.error("Error loading user:", error);
        if (mounted) {
          setUser(null);
        }
      }
    }

    loadUser();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) {
        setUser(session?.user ?? null);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Load wishlist from Supabase when user changes
  useEffect(() => {
    let mounted = true;
    let timeoutId: NodeJS.Timeout | null = null;

    async function loadWishlist() {
      try {
        setIsLoading(true);
        
        // If no user, clear wishlist (or keep guest wishlist in localStorage)
        if (!user) {
          const stored = localStorage.getItem("wishlist");
          if (mounted) {
            if (stored) {
              setWishlist(JSON.parse(stored));
            } else {
              setWishlist([]);
            }
            setIsLoading(false);
          }
          return;
        }

        const userId = user.id;
        
        // Load from Supabase
        const { data: wishlistData, error } = await supabase
          .from("wishlist")
          .select("product_id")
          .eq("user_id", userId);

        if (!mounted) return;

        if (error) {
          console.error("Error loading wishlist from Supabase:", error);
          setIsLoading(false);
          return;
        }

        if (wishlistData && wishlistData.length > 0) {
          // Fetch product details for wishlist items - only active products
          const productIds = wishlistData.map((item) => item.product_id);
          const { data: products, error: productsError } = await supabase
            .from("products")
            .select("id, name, price, image_url")
            .eq("is_active", true)
            .in("id", productIds);

          if (!mounted) return;

          if (productsError) {
            console.error("Error fetching wishlist products:", productsError);
            setWishlist([]);
          } else if (products) {
            const wishlistItems: WishlistItem[] = products.map((p) => ({
              id: p.id,
              name: p.name,
              price: p.price,
              image_url: p.image_url,
            }));
            setWishlist(wishlistItems);
            // Sync to localStorage for offline support
            localStorage.setItem("wishlist", JSON.stringify(wishlistItems));
          } else {
            setWishlist([]);
          }
        } else {
          setWishlist([]);
        }
      } catch (err) {
        console.error("Error loading wishlist:", err);
        if (mounted) {
          setWishlist([]);
        }
      } finally {
        // CRITICAL: Always clear loading state
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    loadWishlist();

    // Hard fallback timeout - ensures loading is ALWAYS cleared
    timeoutId = setTimeout(() => {
      if (mounted) {
        setIsLoading(false);
      }
    }, 3000); // Max 3 seconds loading

    return () => {
      mounted = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [user]);

  // Save to localStorage whenever wishlist changes
  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem("wishlist", JSON.stringify(wishlist));
    }
  }, [wishlist, isLoading]);

  async function addToWishlist(item: WishlistItem) {
    if (!user) {
      // If not logged in, just add to localStorage
      setWishlist((prev) => {
        if (prev.some((i) => i.id === item.id)) {
          return prev;
        }
        const updated = [...prev, item];
        localStorage.setItem("wishlist", JSON.stringify(updated));
        return updated;
      });
      return;
    }

    try {
      // Add to Supabase
      const { error } = await supabase.from("wishlist").upsert({
        user_id: user.id,
        product_id: item.id,
      });

      if (error) {
        console.error("Error adding to wishlist:", error);
        // Still add to local state for offline support
      }

      // Update local state
      setWishlist((prev) => {
        if (prev.some((i) => i.id === item.id)) {
          return prev;
        }
        const updated = [...prev, item];
        localStorage.setItem("wishlist", JSON.stringify(updated));
        return updated;
      });
    } catch (err) {
      console.error("Error adding to wishlist:", err);
      // Still add to local state
      setWishlist((prev) => {
        if (prev.some((i) => i.id === item.id)) {
          return prev;
        }
        const updated = [...prev, item];
        localStorage.setItem("wishlist", JSON.stringify(updated));
        return updated;
      });
    }
  }

  async function removeFromWishlist(productId: string) {
    if (!user) {
      // If not logged in, just remove from localStorage
      setWishlist((prev) => {
        const updated = prev.filter((i) => i.id !== productId);
        localStorage.setItem("wishlist", JSON.stringify(updated));
        return updated;
      });
      return;
    }

    try {
      // Remove from Supabase
      const { error } = await supabase
        .from("wishlist")
        .delete()
        .eq("user_id", user.id)
        .eq("product_id", productId);

      if (error) {
        console.error("Error removing from wishlist:", error);
        // Still remove from local state
      }

      // Update local state
      setWishlist((prev) => {
        const updated = prev.filter((i) => i.id !== productId);
        localStorage.setItem("wishlist", JSON.stringify(updated));
        return updated;
      });
    } catch (err) {
      console.error("Error removing from wishlist:", err);
      // Still remove from local state
      setWishlist((prev) => {
        const updated = prev.filter((i) => i.id !== productId);
        localStorage.setItem("wishlist", JSON.stringify(updated));
        return updated;
      });
    }
  }

  async function toggleWishlist(item: WishlistItem) {
    const isWishlisted = wishlist.some((i) => i.id === item.id);
    if (isWishlisted) {
      await removeFromWishlist(item.id);
    } else {
      await addToWishlist(item);
    }
  }

  function isWishlisted(productId: string) {
    return wishlist.some((i) => i.id === productId);
  }

  return (
    <WishlistContext.Provider
      value={{
        wishlist,
        isLoading,
        addToWishlist,
        removeFromWishlist,
        toggleWishlist,
        isWishlisted,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error("useWishlist must be used inside WishlistProvider");
  return ctx;
}
