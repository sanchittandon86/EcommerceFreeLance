"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useCart } from "@/components/CartContext";

export default function Navbar() {
  const { cart } = useCart();
  const count = cart.reduce((sum, item) => sum + item.qty, 0);

  return (
    <nav className="border-b bg-white">
      <div className="max-w-6xl mx-auto flex justify-between items-center p-4">
        <Link href="/" className="text-2xl font-bold">
          MyStore
        </Link>

        <div className="flex gap-6 items-center">
          <Link href="/" className="text-gray-700 hover:text-black">
            Home
          </Link>

          <Link href="/cart" className="relative text-gray-700 hover:text-black">
            Cart
            {count > 0 && (
              <span className="absolute -right-4 -top-2 bg-red-600 text-white text-xs rounded-full px-2 py-0.5">
                {count}
              </span>
            )}
          </Link>

          <Button asChild>
            <Link href="/login">Login</Link>
          </Button>
        </div>
      </div>
    </nav>
  );
}
