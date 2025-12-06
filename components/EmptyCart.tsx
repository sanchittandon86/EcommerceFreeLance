"use client";

import Link from "next/link";
import { ShoppingBag, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function EmptyCart() {
  return (
    <div className="min-h-[calc(100vh-200px)] flex items-center justify-center px-6">
      <div className="max-w-md w-full text-center space-y-8">
        {/* Icon */}
        <div className="flex justify-center">
          <div className="relative">
            <div className="w-32 h-32 rounded-full bg-gradient-to-br from-amber-100 to-rose-100 flex items-center justify-center">
              <ShoppingBag className="w-16 h-16 text-amber-600" />
            </div>
            <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center">
              <div className="w-4 h-4 rounded-full bg-amber-500" />
            </div>
          </div>
        </div>

        {/* Message */}
        <div className="space-y-3">
          <h2 className="text-3xl md:text-4xl font-light text-slate-900">
            No items added yet
          </h2>
          <p className="text-lg text-slate-600 max-w-sm mx-auto">
            Your cart is empty. Start shopping to add products and support our mission.
          </p>
        </div>

        {/* Button */}
        <div className="pt-4">
          <Link href="/#products-section">
            <Button
              size="lg"
              className="bg-amber-700 hover:bg-amber-800 text-white px-8 py-6 text-lg group"
            >
              <span className="flex items-center gap-2">
                Add Items
                <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
              </span>
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

