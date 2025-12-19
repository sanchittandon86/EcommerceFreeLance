import Razorpay from "razorpay";
import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { razorpayConfig } from "@/config/config.razorpay";

// FLOW:-
// Calculate total price from cart
// Insert row in Supabase: status = PENDING
// Call Razorpay create order API
// Update row with razorpay_order_id
// Return data to frontend


const razorpay = new Razorpay({
    key_id : process.env.RAZORPAY_KEY_ID,
    key_secret : process.env.RAZORPAY_KEY_SECRET
});

export async function POST(req : NextRequest) {
    try {
        const { userId, subtotal } = await req.json();
        const totalAmountInPaise = subtotal * 100;
        
        const supabase = await supabaseServer();
        
        const { data:transactionRow, error} = await supabase
            .from("payment_transactions")
            .insert([{user_id: userId, status: razorpayConfig.pendingPayment, amount:subtotal}])
            .select()
            .single();
        
        if (error || !transactionRow) {
            console.error("Error creating order:", error);
            return NextResponse.json({
                success: false,
                message: 'Failed to create order'
            }, { status: 400 });
        }
    
        const razorayOrder = await razorpay.orders.create({
            amount: totalAmountInPaise,
            currency: razorpayConfig.currency,
            receipt: transactionRow.id.toString()
        });
    
        const { error: updateError } = await supabase
            .from("payment_transactions")
            .update({ razorpay_order_id:razorayOrder.id })
            .eq( "id",transactionRow.id );
        
        if (updateError) {
            console.error("Error updating order with Razorpay ID:", updateError);
        }
    
    
        return NextResponse.json({
            success: true,
            amount:totalAmountInPaise,
            orderRowId: transactionRow.id,
            razorayOrderId: razorayOrder.id,
            key:process.env.RAZORPAY_KEY_ID,
        });
    } 
    catch (err) {
        console.error(err)
        return NextResponse.json({
            success:false,
            message: 'Something went wrong'
        });
    }
}