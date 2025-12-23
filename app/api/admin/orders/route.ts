import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { globalConfig } from "@/lib/globalConfig";

// Helper function to map order_status integer to text
function getStatusText(orderStatus: number): string {
  const statusMap: Record<number, string> = {
    0: "pending",
    1: "paid", // completed = paid
    2: "failed",
  };
  return statusMap[orderStatus] || "pending";
}

// Helper function to map text status to order_status integer
function getStatusInt(status: string): number | null {
  const statusMap: Record<string, number> = {
    pending: 0,
    paid: 1,
    completed: 1,
    failed: 2,
  };
  return statusMap[status.toLowerCase()] ?? null;
}

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

// GET - Fetch orders with pagination and status filtering
export async function GET(req: NextRequest) {
  try {
    const { isAdmin, supabase } = await verifyAdmin();

    if (!isAdmin || !supabase) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || "all";
    const page = parseInt(searchParams.get("page") || "1", 10);
    const pageSize = Math.min(parseInt(searchParams.get("pageSize") || "20", 10), 100);

    // Validate pagination
    if (page < 1) {
      return NextResponse.json(
        { error: "Page must be greater than 0" },
        { status: 400 }
      );
    }

    if (pageSize < 1 || pageSize > 100) {
      return NextResponse.json(
        { error: "Page size must be between 1 and 100" },
        { status: 400 }
      );
    }

    const offset = (page - 1) * pageSize;

    // Map status filter to order_status integer
    const orderStatusFilter = status === "all" ? null : getStatusInt(status);

    // Fetch orderDetails and group by transaction
    // Group orders by user_id and created_at (within 5 second window)
    let query = supabase
      .from("orderDetails")
      .select(
        `
        id,
        fk_id_user,
        amount,
        quantity,
        order_status,
        is_active,
        created_at,
        profiles:fk_id_user (
          email
        )
        `,
        { count: "exact" }
      )
      .eq("is_active", 1)
      .order("created_at", { ascending: false });

    // Apply status filter
    if (orderStatusFilter !== null) {
      query = query.eq("order_status", orderStatusFilter);
    }

    const { data: allOrderDetails, error, count } = await query;

    if (error) {
      console.error("Error fetching orderDetails:", error);
      return NextResponse.json(
        { error: "Failed to fetch orders", details: error.message },
        { status: 500 }
      );
    }

    // Group orderDetails by transaction (same user, within 5 seconds)
    const groupedOrders = new Map<string, any>();
    
    (allOrderDetails || []).forEach((item: any) => {
      const userId = item.fk_id_user;
      const createdAt = new Date(item.created_at);
      // Round to nearest 5 seconds for grouping
      const roundedTime = new Date(Math.floor(createdAt.getTime() / 5000) * 5000);
      const groupKey = `${userId}_${roundedTime.toISOString()}`;

      if (!groupedOrders.has(groupKey)) {
        groupedOrders.set(groupKey, {
          id: item.id, // Use first order ID as group identifier
          user_id: userId,
          user_email: item.profiles?.email || null,
          status: getStatusText(item.order_status),
          order_status: item.order_status,
          amount: 0,
          total_quantity: 0,
          created_at: item.created_at,
          items: [],
        });
      }

      const group = groupedOrders.get(groupKey)!;
      group.amount += item.amount * item.quantity;
      group.total_quantity += item.quantity;
      group.items.push(item);
    });

    // Convert to array and sort by created_at
    let orders = Array.from(groupedOrders.values()).sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    // Apply pagination
    const total = orders.length;
    const totalPages = Math.ceil(total / pageSize);
    orders = orders.slice(offset, offset + pageSize);

    // Map to expected format
    const formattedOrders = orders.map((order) => ({
      id: String(order.id || ''), // Ensure ID is always a string
      user_id: order.user_id,
      status: order.status,
      amount: order.amount,
      razorpay_order_id: null, // Not available in orderDetails
      payment_id: null, // Not available in orderDetails
      created_at: order.created_at,
      updated_at: order.created_at, // Use created_at as updated_at
      profiles: order.user_email ? { email: order.user_email } : null,
    }));

    return NextResponse.json({
      orders: formattedOrders,
      pagination: {
        page,
        pageSize,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    });
  } catch (error) {
    console.error("Unexpected error in GET /api/admin/orders:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

