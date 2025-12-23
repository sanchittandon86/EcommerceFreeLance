"use client";

import { Button } from "../ui/button";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/components/CartContext";
import { razorpayConfig } from "@/config/config.razorpay";
import { sendEmail } from "@/utils/sendMail";
import { supabase } from "@/lib/supabaseClient";
import { globalConfig } from "@/lib/globalConfig";

declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function RazorpayButton({
  cart,
  subtotal,
  userId,
}: {
  cart: any;
  subtotal: number;
  userId: string;
}) {
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
    const userDetails = (await supabase.auth.getUser()).data.user;
    // const updatedOrders = await createOrder(userDetails.id, cart);
    const createdOrdersResponse = await fetch('/api/orderDetails/createOrder',{
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fk_id_user: userDetails?.id, orderDetails: cart }),
    }).then(res => res.json());

    if (!window.Razorpay) {
      alert("Payment gateway is loading. Please try again in a moment.");
      return;
    }

    const res = await fetch("/api/razorpay/order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, subtotal }),
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

        const orderIds = createdOrdersResponse.createdOrders.map((item: any) => item.id);

        if (verifyData.success) {
          // Update order status to completed
          await fetch('/api/orderDetails/updateOrder',{
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ orderIds, isSuccess: true }),
          }).then(res => res.json());

          // Reset cart after successful payment
          await resetCart();

          // Redirect to order history page
          router.push("/account/orderhistory");
          router.refresh();
        } else {
          // Update order status to failed
          await fetch('/api/orderDetails/updateOrder',{
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ orderIds, isSuccess: false }),
          }).then(res => res.json());
        }

        const result = verifyData.success ? "Successful" : "Failed";
        const data = {
          to: userDetails?.email,
          message: `Your payment has ${result} for the order ${orderData.orderRowId} with amount ${subtotal}`,
          subject: `Payment ${result}`,
        };

        sendEmail(data);
      },
    };

    const paymentPopup = new window.Razorpay(options);
    paymentPopup.open();
  }

  async function createOrder(userDetails: any, cart: any) {
    let createdOrder = await Promise.all(
      cart.map(async (item:any) => {
        const response = await supabase
          .from("orderDetails")
          .insert([
            {
              quantity: item.qty,
              amount: item.price,
              fk_id_product: item.id,
              fk_id_user: userDetails.id,
              is_active: 0,
              order_status: globalConfig.orderStatus.pending,
            },
          ])
          .select()
          .single();
        return response.data;
      })
    )
    return createdOrder;
  }

  async function updateOrderStatus(orderIds: any) {
    const updatedOrders = await Promise.all(
      orderIds.map(async (id: any) => {
        const response = await supabase
          .from("orderDetails")
          .update({order_status: globalConfig.orderStatus.completed, is_active: 1})
          .eq("id",id)
          .select()
          .single()
        return response;  
      })
    )
    return updatedOrders;
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
