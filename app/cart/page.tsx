"use client";

import Image from "next/image";
import { useCart } from "@/components/CartContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import RazorpayButton from "@/components/payment/RazorpayButton";

export default function CartPage() {
  const { cart, removeFromCart, addToCart } = useCart();

  if (cart.length === 0) {
    return (
      <div className="max-w-4xl mx-auto p-6 text-center text-xl">
        Your cart is empty 🛒
      </div>
    );
  }

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-4xl font-bold mb-8">Your Cart</h1>

      <div className="space-y-6">
        {cart.map((item) => (
          <Card key={item.id} className="p-4">
            <CardContent className="flex gap-6 p-0 items-center">
              <Image
                src={item.image_url}
                alt={item.name}
                width={120}
                height={120}
                className="rounded-lg object-cover border"
              />

              <div className="flex-1">
                <h2 className="text-xl font-semibold">{item.name}</h2>
                <p className="text-gray-600 mt-1">₹{item.price}</p>

                <div className="flex items-center gap-3 mt-3">
                  <Button
                    variant="outline"
                    onClick={() =>
                      removeFromCart(item.id)
                    }
                  >
                    Remove
                  </Button>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      onClick={() =>
                        addToCart({
                          ...item,
                          qty: 1,
                        })
                      }
                    >
                      +
                    </Button>

                    <span className="text-lg font-medium">{item.qty}</span>

                    <Button
                      variant="outline"
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
                  </div>
                </div>
              </div>

              <p className="text-lg font-semibold">
                ₹{item.price * item.qty}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Separator className="my-8" />

      {/* Total Section */}
      <div className="flex justify-between items-center text-xl font-bold">
        <span>Subtotal</span>
        <span>₹{subtotal}</span>
      </div>
      <RazorpayButton subtotal={subtotal} userId='1'></RazorpayButton>
    </div>
  );
}
