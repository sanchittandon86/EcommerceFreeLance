"use client";

import { Button } from "../ui/button";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/components/CartContext";
import { razorpayConfig } from "@/config/config.razorpay"
import { sendEmail } from "@/utils/sendMail"
import { sendEmail } from "@/utils/sendMail"

declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function RazorpayButton({ subtotal, userId }: { subtotal: number, userId: string }) {
  const router = useRouter();
  const { resetCart } = useCart();
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);

  useEffect(() => {
    if (window.Razorpay) {
      setRazorpayLoaded(true);
      return;
    }

    const checkRazorpay = setInterval(() => {
      if (window.Razorpay) {
        setRazorpayLoaded(true);
        clearInterval(checkRazorpay);
      }
    }, 100);

    const timeout = setTimeout(() => {
      clearInterval(checkRazorpay);
    }, 10000);

    return () => {
      clearInterval(checkRazorpay);
      clearTimeout(timeout);
    };
  }, []);

  async function handlePayment() {
    if (!window.Razorpay) {
      alert("Payment gateway is loading. Please try again in a moment.");
      return;
    }

    const res = await fetch("/api/razorpay/order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, subtotal })
    });

    const orderData = await res.json();

    const options = {
      key: orderData.key,
      amount: orderData.amount,
      currency: razorpayConfig.currency,
      name: razorpayConfig.name,
      order_id: orderData.razorayOrderId,
      handler: async function (response: {
        razorpay_order_id: string;
        razorpay_payment_id: string;
        razorpay_signature: string;
      }) {
        const verifyRes = await fetch("/api/razorpay/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
          }),
        });

        const verifyData = await verifyRes.json();

        // If payment is successful, clear the cart
        if (verifyData.success) {
          // Clear cart (CartContext handles both Supabase and localStorage)
          await resetCart();
          
          // Redirect to success page or home
          router.push("/?payment=success");
          router.refresh();
        }
        const verifyData = await verifyRes.json(); 
        const result = verifyData.success ? 'Successful' : 'Failed'
        const data = {
          to : 'anmolpatel562@gmail.com',
          message: `Your payment has ${result} for the order ${orderData.orderRowId} with amount ${subtotal}`,
          subject: `Payment ${result}`
        }
        
        if (verifyData.success) {
           sendEmail(data);
           return;
        } 
        sendEmail(data);
        
        const result = verifyData.success ? 'Successful' : 'Failed'
        const data = {
          to : 'anmolpatel562@gmail.com',
          message: `Your payment has ${result} for the order ${orderData.orderRowId} with amount ${subtotal}`,
          subject: `Payment ${result}`
        }
        
        sendEmail(data);
      }
    };

    const paymentPopup = new window.Razorpay(options);
    paymentPopup.open();
  }

  return (
    <Button
      className="w-full mt-6 text-lg py-6"
      onClick={handlePayment}
      disabled={!razorpayLoaded}
    >
      {razorpayLoaded ? "Proceed to Checkout" : "Loading Payment Gateway..."}
    </Button>
  );
}
