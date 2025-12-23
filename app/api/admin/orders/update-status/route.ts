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

// Valid status transitions (using order_status integers)
const VALID_TRANSITIONS: Record<number, number[]> = {
  0: [1, 2], // pending -> paid (1) or failed (2)
  1: [], // paid (completed) - terminal
  2: [], // failed - terminal
};

function getStatusInt(status: string): number | null {
  const statusMap: Record<string, number> = {
    pending: 0,
    paid: 1,
    completed: 1,
    failed: 2,
  };
  return statusMap[status.toLowerCase()] ?? null;
}

function getStatusText(orderStatus: number): string {
  const statusMap: Record<number, string> = {
    0: "pending",
    1: "paid",
    2: "failed",
  };
  return statusMap[orderStatus] || "pending";
}

function isValidTransition(currentStatus: number, newStatus: number): boolean {
  const allowed = VALID_TRANSITIONS[currentStatus] || [];
  return allowed.includes(newStatus);
}

// PATCH - Update order status
export async function PATCH(req: NextRequest) {
  try {
    const { isAdmin, supabase } = await verifyAdmin();

    if (!isAdmin || !supabase) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { orderId, status } = body;

    // Validation
    if (!orderId) {
      return NextResponse.json(
        { error: "Order ID is required" },
        { status: 400 }
      );
    }

    if (!status) {
      return NextResponse.json(
        { error: "Status is required" },
        { status: 400 }
      );
    }

    const newStatusInt = getStatusInt(status);
    if (newStatusInt === null) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: pending, paid, failed` },
        { status: 400 }
      );
    }

    // Fetch orderDetails for this order (group by orderId which is actually a group identifier)
    // Since orderId is a group identifier, we need to find all orderDetails in that group
    // For now, we'll treat orderId as a single orderDetail ID and update all items in that transaction
    const { data: orderDetail, error: fetchError } = await supabase
      .from("orderDetails")
      .select("id, order_status, fk_id_user, created_at")
      .eq("id", orderId)
      .single();

    if (fetchError || !orderDetail) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }

    // Validate transition
    if (!isValidTransition(orderDetail.order_status, newStatusInt)) {
      const currentStatusText = getStatusText(orderDetail.order_status);
      const allowed = VALID_TRANSITIONS[orderDetail.order_status] || [];
      const allowedText = allowed.map(getStatusText);
      return NextResponse.json(
        {
          error: `Invalid status transition from ${currentStatusText} to ${status}`,
          currentStatus: currentStatusText,
          allowedTransitions: allowedText,
        },
        { status: 400 }
      );
    }

    // Update all orderDetails in the same transaction (same user, within 5 seconds)
    const createdAt = new Date(orderDetail.created_at);
    const timeWindowStart = new Date(createdAt.getTime() - 5 * 1000);
    const timeWindowEnd = new Date(createdAt.getTime() + 5 * 1000);

    const { data: updatedOrderDetails, error: updateError } = await supabase
      .from("orderDetails")
      .update({
        order_status: newStatusInt,
      })
      .eq("fk_id_user", orderDetail.fk_id_user)
      .gte("created_at", timeWindowStart.toISOString())
      .lte("created_at", timeWindowEnd.toISOString())
      .select();

    if (updateError) {
      console.error("Error updating order status:", updateError);
      return NextResponse.json(
        { error: "Failed to update order status", details: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      order: {
        id: orderId,
        status: status,
        order_status: newStatusInt,
        updated_count: updatedOrderDetails?.length || 0,
      },
      message: `Order status updated from ${getStatusText(orderDetail.order_status)} to ${status}`,
    });
  } catch (error) {
    console.error("Unexpected error in PATCH /api/admin/orders/update-status:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

