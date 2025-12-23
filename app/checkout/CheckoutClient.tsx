"use client";

import { useCart } from "@/components/CartContext";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import RazorpayButton from "@/components/payment/RazorpayButton";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function CheckoutClient() {
  const { cart } = useCart();
  const [userId, setUserId] = useState<string>("");
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const tax = subtotal * 0.1; // 10% tax
  const total = subtotal + tax;

  useEffect(() => {
    async function getUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
      }
    }
    getUser();
  }, []);

  return (
    <main className="max-w-4xl mx-auto px-6 py-16">
      <h1 className="text-4xl font-bold text-slate-900 mb-8">Checkout</h1>

      {cart.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-600 mb-4">Your cart is empty</p>
            <Button asChild>
              <Link href="/">Continue Shopping</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {cart.map((item) => (
                  <div key={item.id} className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-gray-600">
                        Qty: {item.qty} × ₹{item.price.toFixed(2)}
                      </p>
                    </div>
                    <p className="font-medium">
                      ₹{(item.price * item.qty).toFixed(2)}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <div>
            <Card>
              <CardHeader>
                <CardTitle>Payment Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span>₹{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Tax</span>
                  <span>₹{tax.toFixed(2)}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span>₹{total.toFixed(2)}</span>
                </div>
                {userId && (
                  <RazorpayButton
                    cart={cart}
                    subtotal={subtotal}
                    userId={userId}
                  />
                )}
                {!userId && (
                  <Button className="w-full mt-4" size="lg" disabled>
                    Loading...
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </main>
  );
}

