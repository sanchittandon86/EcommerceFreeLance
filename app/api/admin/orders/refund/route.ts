import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { globalConfig } from "@/lib/globalConfig";

// Helper function to verify admin role
async function verifyAdmin() {
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { isAdmin: false, user: null, supabase: null };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile || profile.role !== "admin") {
    return { isAdmin: false, user: null, supabase: null };
  }

  return { isAdmin: true, user, supabase };
}

// POST - Process refund (logical flow only for now)
export async function POST(req: NextRequest) {
  try {
    const { isAdmin, supabase } = await verifyAdmin();

    if (!isAdmin || !supabase) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { orderId, reason } = body;

    // Validation
    if (!orderId) {
      return NextResponse.json(
        { error: "Order ID is required" },
        { status: 400 }
      );
    }

    // Fetch orderDetail to get transaction info
    const { data: orderDetail, error: fetchError } = await supabase
      .from("orderDetails")
      .select("id, order_status, fk_id_user, created_at, amount, quantity")
      .eq("id", orderId)
      .single();

    if (fetchError || !orderDetail) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }

    // Only allow refunds for paid orders (order_status = 1 = completed/paid)
    if (orderDetail.order_status !== globalConfig.orderStatus.completed) {
      return NextResponse.json(
        {
          error: `Cannot refund order with status: ${orderDetail.order_status === 0 ? "pending" : "failed"}. Only paid orders can be refunded.`,
          currentStatus: orderDetail.order_status === 0 ? "pending" : orderDetail.order_status === 1 ? "paid" : "failed",
        },
        { status: 400 }
      );
    }

    // TODO: Add Razorpay refund API call here when ready
    // For now, we just mark the order as failed (since we don't have refunded status)
    // In a real system, you'd add order_status = 3 for refunded
    // Example future integration:
    // const razorpayRefund = await razorpay.payments.refund(paymentId, { amount: amountInPaise });
    // if (razorpayRefund.error) { ... }

    // Update all orderDetails in the same transaction
    const createdAt = new Date(orderDetail.created_at);
    const timeWindowStart = new Date(createdAt.getTime() - 5 * 1000);
    const timeWindowEnd = new Date(createdAt.getTime() + 5 * 1000);

    // For now, mark as failed since we don't have refunded status
    // TODO: Add order_status = 3 for refunded when database supports it
    const { data: updatedOrderDetails, error: updateError } = await supabase
      .from("orderDetails")
      .update({
        order_status: globalConfig.orderStatus.failed, // Using failed as refunded for now
        // TODO: Add refund metadata when columns exist
      })
      .eq("fk_id_user", orderDetail.fk_id_user)
      .gte("created_at", timeWindowStart.toISOString())
      .lte("created_at", timeWindowEnd.toISOString())
      .select();

    if (updateError) {
      console.error("Error processing refund:", updateError);
      return NextResponse.json(
        { error: "Failed to process refund", details: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      order: {
        id: orderId,
        status: "refunded",
        updated_count: updatedOrderDetails?.length || 0,
      },
      message: "Refund processed successfully",
      note: "Razorpay refund API integration pending. Order marked as refunded (using failed status).",
    });
  } catch (error) {
    console.error("Unexpected error in POST /api/admin/orders/refund:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

