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
            .from("payment_transactions")
            .update({ status: razorpayConfig.failedPayment})
            .eq("razorpay_order_id", razorpay_order_id);
          
          if (error) {
            console.error("Error updating order status to failed:", error);
          }

          return NextResponse.json({ success: false });  
        }
        
        // Success - Update order status
        const { error: updateError } = await supabase
              .from("payment_transactions")
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
            }, { status: 400 });
        }

        // Clear cart after successful payment
        // Get user_id from the order
        const { data: orderData } = await supabase
            .from("payment_transactions")
            .select("user_id")
            .eq("razorpay_order_id", razorpay_order_id)
            .single();

        if (orderData?.user_id) {
            // Delete all cart items for this user
            const { error: cartError } = await supabase
                .from("cart")
                .delete()
                .eq("user_id", orderData.user_id);

            if (cartError) {
                console.error("Error clearing cart after payment:", cartError);
                // Don't fail the payment verification if cart clearing fails
            }
        }

        return NextResponse.json({ success: true });         
    }
    catch (err) {
      console.error("Error in payment verification:", err);
      return NextResponse.json({ 
          success: false,
          message: 'Internal server error'
      }, { status: 400 });
    }
}