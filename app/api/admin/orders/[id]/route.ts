import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

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

// GET - Fetch order details with order items
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { isAdmin, supabase } = await verifyAdmin();

    if (!isAdmin || !supabase) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: "Order ID is required" },
        { status: 400 }
      );
    }

    // Fetch orderDetail to get transaction info
    const { data: orderDetail, error: orderError } = await supabase
      .from("orderDetails")
      .select(
        `
        id,
        fk_id_user,
        order_status,
        amount,
        quantity,
        created_at,
        profiles:fk_id_user (
          email
        )
        `
      )
      .eq("id", id)
      .single();

    if (orderError || !orderDetail) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }

    // Fetch order items (orderDetails) for this order
    // Note: We need to match orderDetails by user_id and created_at (within a time window)
    // Since there's no direct foreign key, we'll fetch orderDetails for this user
    // that were created around the same time as the order
    const orderCreatedAt = new Date(orderDetail.created_at);
    const timeWindowStart = new Date(orderCreatedAt.getTime() - 5 * 1000); // 5 seconds before
    const timeWindowEnd = new Date(orderCreatedAt.getTime() + 5 * 1000); // 5 seconds after

    const { data: orderDetails, error: orderDetailsError } = await supabase
      .from("orderDetails")
      .select(
        `
        id,
        amount,
        quantity,
        order_status,
        created_at,
        fk_id_product,
        products:fk_id_product (
          id,
          name,
          image_url,
          price
        )
        `
      )
      .eq("fk_id_user", orderDetail.fk_id_user)
      .gte("created_at", timeWindowStart.toISOString())
      .lte("created_at", timeWindowEnd.toISOString())
      .order("created_at", { ascending: true });

    if (orderDetailsError) {
      console.error("Error fetching order details:", orderDetailsError);
    }

    // If products are null (soft-deleted), fetch them separately
    const orderDetailsWithProducts = (orderDetails || []).map((item: any) => {
      // Handle both array and object cases from Supabase join
      let product = null;
      if (item.products) {
        if (Array.isArray(item.products)) {
          product = item.products.length > 0 ? item.products[0] : null;
        } else {
          product = item.products;
        }
      }
      return {
        ...item,
        products: product,
      };
    });

    const missingProductIds = orderDetailsWithProducts
      .filter((item: any) => !item.products && item.fk_id_product)
      .map((item: any) => item.fk_id_product)
      .filter((id): id is string => !!id);

    if (missingProductIds.length > 0) {
      const { data: productsData } = await supabase
        .from("products")
        .select("id, name, image_url, price")
        .in("id", missingProductIds);

      if (productsData) {
        const productMap = new Map(productsData.map((p) => [p.id, p]));
        orderDetailsWithProducts.forEach((item: any) => {
          if (!item.products && item.fk_id_product && productMap.has(item.fk_id_product)) {
            item.products = productMap.get(item.fk_id_product)!;
          }
        });
      }
    }

    // Calculate total amount from all items
    const totalAmount = orderDetailsWithProducts.reduce(
      (sum, item) => sum + item.amount * item.quantity,
      0
    );

    // Build order object
    const order = {
      id: orderDetail.id,
      user_id: orderDetail.fk_id_user,
      status: orderDetail.order_status === 0 ? "pending" : orderDetail.order_status === 1 ? "paid" : "failed",
      order_status: orderDetail.order_status,
      amount: totalAmount,
      razorpay_order_id: null, // Not available in orderDetails
      payment_id: null, // Not available in orderDetails
      signature: null, // Not available in orderDetails
      created_at: orderDetail.created_at,
      updated_at: orderDetail.created_at,
      profiles: orderDetail.profiles,
    };

    return NextResponse.json({
      order,
      orderItems: orderDetailsWithProducts,
    });
  } catch (error) {
    console.error("Unexpected error in GET /api/admin/orders/[id]:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

