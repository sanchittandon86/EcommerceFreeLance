import crypto from "crypto"
import { supabase } from "@/lib/supabaseClient";
import { NextRequest, NextResponse } from "next/server"
import { razorpayConfig } from "@/config/config.razorpay";

// FLOW:-
// Accept payment_id, order_id, signature
// Validate signature using crypto
// Update Supabase row to PAID

export async function POST(req: NextRequest) {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = await req.json();
        const body = razorpay_order_id + '|' + razorpay_payment_id;
        const expectedSignature = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
            .update(body)
            .digest("hex")
            
        if (expectedSignature !== razorpay_signature) {
          // Payment Failed  
          await supabase
            .from("orders")
            .update({ status: razorpayConfig.failedPayment})
            .eq("razorpay_order_id", razorpay_order_id);  

          return NextResponse.json({ success: false });  
        }
        // Success
        await supabase
              .from("orders")
              .update({
                status: razorpayConfig.paidPayment,
                payment_id: razorpay_payment_id,
                signature: razorpay_signature
              })
              .eq("razorpay_order_id", razorpay_order_id);

        return NextResponse.json({ success: true });         
    }
    catch (err) {
      console.error(err);
    }
}