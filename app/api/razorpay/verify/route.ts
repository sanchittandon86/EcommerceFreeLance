import crypto from "crypto"
import { supabaseServer } from "@/lib/supabaseServer";
import { NextRequest, NextResponse } from "next/server"
import { razorpayConfig } from "@/config/config.razorpay";

// FLOW:-
// Accept payment_id, order_id, signature
// Validate signature using crypto
// Update Supabase row to PAID

export async function POST(req: NextRequest) {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = await req.json();
        
        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            return NextResponse.json({ 
                success: false,
                message: 'Missing required payment parameters'
            }, { status: 400 });
        }

        const body = razorpay_order_id + '|' + razorpay_payment_id;
        const expectedSignature = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
            .update(body)
            .digest("hex")
            
        const supabase = await supabaseServer();
        
        if (expectedSignature !== razorpay_signature) {
          // Payment Failed  
          const { error } = await supabase
            .from("orders")
            .update({ status: razorpayConfig.failedPayment})
            .eq("razorpay_order_id", razorpay_order_id);
          
          if (error) {
            console.error("Error updating order status to failed:", error);
          }

          return NextResponse.json({ success: false });  
        }
        
        // Success
        const { error: updateError } = await supabase
              .from("orders")
              .update({
                status: razorpayConfig.paidPayment,
                payment_id: razorpay_payment_id,
                signature: razorpay_signature
              })
              .eq("razorpay_order_id", razorpay_order_id);

        if (updateError) {
            console.error("Error updating order status to paid:", updateError);
            return NextResponse.json({ 
                success: false,
                message: 'Failed to update order status'
            }, { status: 500 });
        }

        return NextResponse.json({ success: true });         
    }
    catch (err) {
      console.error("Error in payment verification:", err);
      return NextResponse.json({ 
          success: false,
          message: 'Internal server error'
      }, { status: 500 });
    }
}