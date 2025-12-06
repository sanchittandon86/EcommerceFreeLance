"use client";

import { createContext, useContext, useEffect, useState } from "react";

interface CartItem {
  id: string;
  name: string;
  price: number;
  image_url: string;
  qty: number;
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (id: string) => void;
  updateQty: (id: string, newQty: number) => void;
}

const CartContext = createContext<CartContextType | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);

  // Load cart once on first render
  useEffect(() => {
    const stored = localStorage.getItem("cart");
    if (stored) setCart(JSON.parse(stored));
  }, []);

  // Save to localStorage when cart changes
  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(cart));
  }, [cart]);

  function addToCart(item: CartItem) {
    setCart((prev) => {
      const existing = prev.find((p) => p.id === item.id);
      if (existing) {
        return prev.map((p) =>
          p.id === item.id ? { ...p, qty: p.qty + 1 } : p
        );
      }
      return [...prev, item];
    });
  }

  function removeFromCart(id: string) {
    setCart((prev) => prev.filter((p) => p.id !== id));
  }

  function updateQty(id: string, newQty: number) {
    setCart((prev) =>
      prev
        .map((item) =>
          item.id === id ? { ...item, qty: newQty } : item
        )
        .filter((item) => item.qty > 0)
    );
  }
  

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, updateQty }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
