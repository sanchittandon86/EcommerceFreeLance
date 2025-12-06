"use client";

import { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";
import type { User } from "@supabase/supabase-js";

interface CartItem {
  id: string;
  name: string;
  price: number;
  image_url: string;
  qty: number;
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (item: CartItem) => Promise<void>;
  removeFromCart: (id: string) => Promise<void>;
  increaseQty: (id: string) => Promise<void>;
  decreaseQty: (id: string) => Promise<void>;
  resetCart: () => Promise<void>;
  isSynced: boolean; // true = Supabase mode, false = localStorage mode
}

const CartContext = createContext<CartContextType | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [isSynced, setIsSynced] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isMerging, setIsMerging] = useState(false);
  const userRef = useRef<User | null>(null);

  // Fetch product details from Supabase
  const fetchProductDetails = useCallback(async (productIds: string[]): Promise<CartItem[]> => {
    if (productIds.length === 0) return [];

    const { data: products, error } = await supabase
      .from("products")
      .select("id, name, price, image_url")
      .in("id", productIds);

    if (error || !products) {
      console.error("Error fetching product details:", error);
      return [];
    }

    return products.map((p) => ({
      id: p.id,
      name: p.name,
      price: p.price,
      image_url: p.image_url,
      qty: 0, // Will be set from cart data
    }));
  }, []);

  // Load cart from Supabase for authenticated users
  const loadSupabaseCart = useCallback(async (userId: string) => {
    try {
      const { data: cartData, error } = await supabase
        .from("cart")
        .select("product_id, quantity")
        .eq("user_id", userId);

      if (error) {
        console.error("Error loading cart from Supabase:", error);
        return [];
      }

      if (!cartData || cartData.length === 0) {
        return [];
      }

      // Get product IDs
      const productIds = cartData.map((item) => item.product_id);

      // Fetch product details
      const products = await fetchProductDetails(productIds);

      // Merge with quantities
      const cartItems: CartItem[] = products
        .map((product) => {
          const cartItem = cartData.find((c) => c.product_id === product.id);
          return cartItem
            ? { ...product, qty: cartItem.quantity }
            : null;
        })
        .filter((item): item is CartItem => item !== null);

      return cartItems;
    } catch (err) {
      console.error("Error in loadSupabaseCart:", err);
      return [];
    }
  }, [fetchProductDetails]);

  // Load cart from localStorage for guests
  const loadLocalCart = useCallback(() => {
    try {
      const stored = localStorage.getItem("cart");
      if (stored) {
        return JSON.parse(stored) as CartItem[];
      }
    } catch (err) {
      console.error("Error loading cart from localStorage:", err);
    }
    return [];
  }, []);

  // Save cart to Supabase
  const saveToSupabase = useCallback(async (items: CartItem[], userId: string) => {
    if (!userId) return;

    try {
      if (items.length === 0) {
        // If cart is empty, just delete all items
        const { error } = await supabase.from("cart").delete().eq("user_id", userId);
        if (error) {
          console.error("Error clearing cart:", error);
        }
        return;
      }

      // Get current cart items from Supabase to find items to delete
      const { data: existingCart } = await supabase
        .from("cart")
        .select("product_id")
        .eq("user_id", userId);

      const existingProductIds = new Set(existingCart?.map((item) => item.product_id) || []);

      // Prepare cart rows for upsert
      const cartRows = items.map((item) => ({
        user_id: userId,
        product_id: item.id,
        quantity: item.qty,
      }));

      // Get product IDs in new cart
      const newProductIds = new Set(items.map((item) => item.id));

      // Delete items that are no longer in cart
      const itemsToDelete = Array.from(existingProductIds).filter(
        (id) => !newProductIds.has(id)
      );

      if (itemsToDelete.length > 0) {
        const { error: deleteError } = await supabase
          .from("cart")
          .delete()
          .eq("user_id", userId)
          .in("product_id", itemsToDelete);
        
        if (deleteError) {
          console.error("Error deleting removed cart items:", deleteError);
        }
      }

      // Upsert all items (insert or update based on user_id + product_id)
      // Note: Requires unique constraint on (user_id, product_id) in database
      const { error: upsertError } = await supabase
        .from("cart")
        .upsert(cartRows, {
          onConflict: "user_id,product_id",
        });

      if (upsertError) {
        console.error("Error upserting cart to Supabase:", upsertError);
        // Fallback to delete + insert if upsert fails (e.g., no unique constraint)
        await supabase.from("cart").delete().eq("user_id", userId);
        const { error: insertError } = await supabase.from("cart").insert(cartRows);
        if (insertError) {
          console.error("Error inserting cart (fallback):", insertError);
        }
      }
    } catch (err) {
      console.error("Error in saveToSupabase:", err);
    }
  }, []);

  // Save cart to localStorage
  const saveToLocal = useCallback((items: CartItem[]) => {
    try {
      localStorage.setItem("cart", JSON.stringify(items));
    } catch (err) {
      console.error("Error saving cart to localStorage:", err);
    }
  }, []);

  // Merge guest cart with user cart
  const mergeGuestCart = useCallback(async (userId: string) => {
    if (isMerging) return; // Prevent multiple merges
    setIsMerging(true);

    try {
      // Load guest cart from localStorage
      const guestCart = loadLocalCart();

      // Load user cart from Supabase
      const userCart = await loadSupabaseCart(userId);

      // Merge: combine quantities for same products
      const mergedCart: CartItem[] = [];
      const productMap = new Map<string, CartItem>();

      // Add user cart items
      userCart.forEach((item) => {
        productMap.set(item.id, { ...item });
      });

      // Merge guest cart items
      guestCart.forEach((item) => {
        const existing = productMap.get(item.id);
        if (existing) {
          existing.qty += item.qty;
        } else {
          productMap.set(item.id, { ...item });
        }
      });

      // Convert map to array
      mergedCart.push(...Array.from(productMap.values()));

      // Save merged cart to Supabase
      await saveToSupabase(mergedCart, userId);

      // Clear localStorage
      localStorage.removeItem("cart");

      // Update state
      setCart(mergedCart);
      setIsSynced(true);
    } catch (err) {
      console.error("Error merging guest cart:", err);
    } finally {
      setIsMerging(false);
    }
  }, [loadLocalCart, loadSupabaseCart, saveToSupabase, isMerging]);

  // Initialize cart based on auth state
  useEffect(() => {
    let mounted = true;

    async function initializeCart() {
      setIsLoading(true);

      // Get initial session
      const { data: { session } } = await supabase.auth.getSession();
      const currentUser = session?.user ?? null;
      
      if (!mounted) return;
      setUser(currentUser);
      userRef.current = currentUser;

      if (currentUser) {
        // Authenticated: load from Supabase
        const supabaseCart = await loadSupabaseCart(currentUser.id);
        if (!mounted) return;
        setCart(supabaseCart);
        setIsSynced(true);

        // Check if there's a guest cart to merge
        const guestCart = loadLocalCart();
        if (guestCart.length > 0) {
          await mergeGuestCart(currentUser.id);
        }
      } else {
        // Guest: load from localStorage
        const localCart = loadLocalCart();
        if (!mounted) return;
        setCart(localCart);
        setIsSynced(false);
      }

      if (mounted) {
        setIsLoading(false);
      }
    }

    initializeCart();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      const newUser = session?.user ?? null;
      const previousUser = userRef.current;

      setUser(newUser);
      userRef.current = newUser;

      if (newUser && !previousUser) {
        // User just logged in: merge guest cart
        const guestCart = loadLocalCart();
        if (guestCart.length > 0) {
          await mergeGuestCart(newUser.id);
        } else {
          // No guest cart, just load user cart
          const supabaseCart = await loadSupabaseCart(newUser.id);
          if (mounted) {
            setCart(supabaseCart);
            setIsSynced(true);
          }
        }
      } else if (!newUser && previousUser) {
        // User just logged out: switch to localStorage
        const localCart = loadLocalCart();
        if (mounted) {
          setCart(localCart);
          setIsSynced(false);
        }
      } else if (newUser && previousUser && newUser.id !== previousUser.id) {
        // User switched accounts: load new user's cart
        const supabaseCart = await loadSupabaseCart(newUser.id);
        if (mounted) {
          setCart(supabaseCart);
          setIsSynced(true);
        }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [loadSupabaseCart, loadLocalCart, mergeGuestCart]); // Include dependencies

  // Sync cart to storage when it changes (but not during initial load or merge)
  useEffect(() => {
    if (isLoading || isMerging) return;

    if (isSynced && user) {
      // Save to Supabase
      saveToSupabase(cart, user.id);
    } else {
      // Save to localStorage
      saveToLocal(cart);
    }
  }, [cart, isSynced, user, isLoading, isMerging, saveToSupabase, saveToLocal]);

  // Add to cart
  const addToCart = useCallback(async (item: CartItem) => {
    setCart((prev) => {
      const existing = prev.find((p) => p.id === item.id);
      if (existing) {
        return prev.map((p) =>
          p.id === item.id ? { ...p, qty: p.qty + (item.qty || 1) } : p
        );
      }
      return [...prev, { ...item, qty: item.qty || 1 }];
    });
  }, []);

  // Remove from cart
  const removeFromCart = useCallback(async (id: string) => {
    if (isSynced && user) {
      // Delete from Supabase
      try {
        await supabase.from("cart").delete().eq("user_id", user.id).eq("product_id", id);
      } catch (err) {
        console.error("Error removing from Supabase cart:", err);
      }
    }

    setCart((prev) => prev.filter((p) => p.id !== id));
  }, [isSynced, user]);

  // Increase quantity
  const increaseQty = useCallback(async (id: string) => {
    setCart((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, qty: item.qty + 1 } : item
      )
    );
  }, []);

  // Decrease quantity
  const decreaseQty = useCallback(async (id: string) => {
    setCart((prev) => {
      const item = prev.find((p) => p.id === id);
      if (item && item.qty > 1) {
        return prev.map((p) => (p.id === id ? { ...p, qty: p.qty - 1 } : p));
      } else if (item && item.qty === 1) {
        // Remove if quantity becomes 0
        if (isSynced && user) {
          supabase
            .from("cart")
            .delete()
            .eq("user_id", user.id)
            .eq("product_id", id)
            .then(({ error }) => {
              if (error) console.error("Error removing from cart:", error);
            });
        }
        return prev.filter((p) => p.id !== id);
      }
      return prev;
    });
  }, [isSynced, user]);

  // Reset cart (clear all items)
  const resetCart = useCallback(async () => {
    if (isSynced && user) {
      // Delete all from Supabase
      try {
        await supabase.from("cart").delete().eq("user_id", user.id);
      } catch (err) {
        console.error("Error clearing Supabase cart:", err);
      }
    } else {
      // Clear localStorage
      localStorage.removeItem("cart");
    }

    setCart([]);
  }, [isSynced, user]);

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        increaseQty,
        decreaseQty,
        resetCart,
        isSynced,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
