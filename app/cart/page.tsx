"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useCart } from "@/components/CartContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import EmptyCart from "@/components/EmptyCart";
import RazorpayButton from "@/components/payment/RazorpayButton";
import { supabase } from "@/lib/supabaseClient";
import type { User } from "@supabase/supabase-js";

export default function CartPage() {
  const { cart, removeFromCart, addToCart } = useCart();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (cart.length === 0) {
    return <EmptyCart />;
  }

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-4xl md:text-5xl font-light text-slate-900 mb-2">Your Cart</h1>
        <p className="text-slate-600">{cart.length} {cart.length === 1 ? 'item' : 'items'}</p>
      </div>

      {/* Cart Items */}
      <div className="space-y-4 mb-8">
        {cart.map((item) => (
          <Card 
            key={item.id} 
            className="border-2 border-slate-200/50 hover:border-amber-300/60 transition-all duration-300 bg-gradient-to-br from-white to-slate-50/30 overflow-hidden"
          >
            <CardContent className="p-6">
              <div className="flex gap-6 items-start md:items-center">
                {/* Product Image */}
                <div className="relative flex-shrink-0">
                  <div className="w-24 h-24 md:w-32 md:h-32 rounded-lg overflow-hidden border-2 border-slate-200/60">
                    <Image
                      src={item.image_url}
                      alt={item.name}
                      width={128}
                      height={128}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>

                {/* Product Info */}
                <div className="flex-1 min-w-0">
                  <h2 className="text-xl md:text-2xl font-semibold text-slate-900 mb-1">
                    {item.name}
                  </h2>
                  <p className="text-amber-700 font-medium mb-4">
                    ₹{item.price} <span className="text-slate-500 text-sm font-normal">per item</span>
                  </p>

                  {/* Quantity Controls */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center border-2 border-slate-200 rounded-lg overflow-hidden">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-9 w-9 rounded-none hover:bg-amber-50 hover:text-amber-700"
                          onClick={() => {
                            if (item.qty === 1) {
                              removeFromCart(item.id);
                            } else {
                              removeFromCart(item.id);
                              addToCart({ ...item, qty: item.qty - 1 });
                            }
                          }}
                        >
                          –
                        </Button>
                        <span className="px-4 py-1 text-lg font-semibold min-w-[3rem] text-center border-x border-slate-200">
                          {item.qty}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-9 w-9 rounded-none hover:bg-amber-50 hover:text-amber-700"
                          onClick={() =>
                            addToCart({
                              ...item,
                              qty: 1,
                            })
                          }
                        >
                          +
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Price */}
                <div className="flex-shrink-0 text-right ml-auto">
                  <p className="text-2xl md:text-3xl font-bold text-amber-700 bg-gradient-to-r from-amber-600 to-amber-700 bg-clip-text text-transparent">
                    ₹{item.price * item.qty}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Separator className="my-8" />

      {/* Summary Section */}
      <Card className="border-2 border-slate-200/50 bg-gradient-to-br from-amber-50/30 to-white">
        <CardContent className="p-6 md:p-8">
          <div className="space-y-6">
            <Separator className="bg-slate-200" />
            
            {/* Subtotal */}
            <div className="flex justify-between items-center">
              <span className="text-xl font-semibold text-slate-700">Subtotal</span>
              <span className="text-3xl font-bold text-amber-700 bg-gradient-to-r from-amber-600 to-amber-700 bg-clip-text text-transparent">
                ₹{subtotal}
              </span>
            </div>

            <Separator className="bg-slate-200" />
            {/* Checkout Button */}
            {user ? (
              <RazorpayButton subtotal={subtotal} userId={user.id} />
            ) : (
              <Button 
                className="w-full text-lg py-6 bg-amber-700 hover:bg-amber-800 text-white transition-all duration-300"
                size="lg"
                disabled
              >
                Please login to checkout
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
