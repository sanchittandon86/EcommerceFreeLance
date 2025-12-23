import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabaseServer";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, TrendingUp, ShoppingCart, Calendar, AlertCircle, Package } from "lucide-react";
import AdminDashboardClient from "./AdminDashboardClient";

// Fetch analytics data server-side
async function getAnalyticsData() {
  const supabase = await supabaseServer();

  // Try to fetch from views first, fallback to direct queries if views don't exist
  const [
    totalRevenueResult,
    ordersTodayResult,
    ordersWeekResult,
    failedPaymentsResult,
    topProductsResult,
  ] = await Promise.all([
    supabase.from("admin_total_revenue").select("*").single(),
    supabase.from("admin_orders_today").select("*").single(),
    supabase.from("admin_orders_this_week").select("*").single(),
    supabase.from("admin_failed_payments").select("*").single(),
    supabase.from("admin_top_selling_products").select("*").limit(10),
  ]);

  // Fallback: If views don't exist, calculate directly from orderDetails
  let totalRevenue = totalRevenueResult.data?.total_revenue;
  let ordersToday = ordersTodayResult.data;
  let ordersWeek = ordersWeekResult.data;
  let failedPayments = failedPaymentsResult.data;
  let topProducts = topProductsResult.data;

  // Fallback calculations if views fail
  if (totalRevenueResult.error || totalRevenue === undefined) {
    const { data: fallbackData } = await supabase
      .from("orderDetails")
      .select("amount, quantity")
      .eq("order_status", 1)
      .eq("is_active", 1);
    
    totalRevenue = fallbackData?.reduce((sum, item) => sum + (item.amount * item.quantity), 0) || 0;
  }

  if (ordersTodayResult.error || !ordersToday) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const { data: fallbackData } = await supabase
      .from("orderDetails")
      .select("amount, quantity")
      .eq("order_status", 1)
      .eq("is_active", 1)
      .gte("created_at", today.toISOString());
    
    ordersToday = {
      orders_count: fallbackData?.length || 0,
      revenue_today: fallbackData?.reduce((sum, item) => sum + (item.amount * item.quantity), 0) || 0,
    };
  }

  if (ordersWeekResult.error || !ordersWeek) {
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // Start of week (Sunday)
    weekStart.setHours(0, 0, 0, 0);
    const { data: fallbackData } = await supabase
      .from("orderDetails")
      .select("amount, quantity")
      .eq("order_status", 1)
      .eq("is_active", 1)
      .gte("created_at", weekStart.toISOString());
    
    ordersWeek = {
      orders_count: fallbackData?.length || 0,
      revenue_week: fallbackData?.reduce((sum, item) => sum + (item.amount * item.quantity), 0) || 0,
    };
  }

  if (failedPaymentsResult.error || !failedPayments) {
    const { data: fallbackData } = await supabase
      .from("orderDetails")
      .select("amount, quantity")
      .eq("order_status", 2) // failed
      .eq("is_active", 1);
    
    failedPayments = {
      failed_count: fallbackData?.length || 0,
      failed_revenue: fallbackData?.reduce((sum, item) => sum + (item.amount * item.quantity), 0) || 0,
    };
  }

  if (topProductsResult.error || !topProducts || topProducts.length === 0) {
    // Fallback: Get top products by aggregating orderDetails
    const { data: orderDetailsData } = await supabase
      .from("orderDetails")
      .select("fk_id_product, quantity, amount")
      .eq("order_status", 1)
      .eq("is_active", 1);
    
    if (orderDetailsData) {
      // Aggregate by product
      const productMap = new Map();
      orderDetailsData.forEach((item) => {
        const productId = item.fk_id_product;
        if (!productMap.has(productId)) {
          productMap.set(productId, { quantity: 0, revenue: 0 });
        }
        const stats = productMap.get(productId);
        stats.quantity += item.quantity;
        stats.revenue += item.amount * item.quantity;
      });

      // Get product details and combine with stats
      const productIds = Array.from(productMap.keys());
      if (productIds.length > 0) {
        const { data: productsData } = await supabase
          .from("products")
          .select("id, name, image_url, price")
          .in("id", productIds)
          .eq("is_active", true);
        
        if (productsData) {
          topProducts = productsData
            .map((product) => ({
              ...product,
              total_quantity_sold: productMap.get(product.id)?.quantity || 0,
              total_revenue: productMap.get(product.id)?.revenue || 0,
            }))
            .sort((a, b) => b.total_quantity_sold - a.total_quantity_sold)
            .slice(0, 10);
        }
      }
    }
    
    if (!topProducts) topProducts = [];
  }

  // Fetch recent orders (last 5 completed orders)
  const { data: recentOrdersData, error: recentOrdersError } = await supabase
    .from("orderDetails")
    .select(`
      id,
      amount,
      quantity,
      created_at,
      order_status,
      fk_id_product,
      products:fk_id_product (
        id,
        name,
        image_url,
        price
      )
    `)
    .eq("order_status", 1) // completed
    .eq("is_active", 1)
    .order("created_at", { ascending: false })
    .limit(5);

  // Transform recentOrders to match expected type
  // Supabase foreign key joins return a single object (not array) or null
  // Note: Join might return null if product is soft-deleted or RLS blocks it
  const recentOrders = recentOrdersData?.map((order: any) => {
    // Handle both cases: object (normal) or array (edge case)
    let product = null;
    if (order.products) {
      if (Array.isArray(order.products)) {
        product = order.products.length > 0 ? order.products[0] : null;
      } else {
        product = order.products; // Already an object
      }
    }
    
    return {
      id: order.id,
      amount: order.amount,
      quantity: order.quantity,
      created_at: order.created_at,
      order_status: order.order_status,
      fk_id_product: order.fk_id_product, // Keep product ID for fallback
      products: product,
    };
  }) || [];

  // Always fetch products separately to ensure we get them even if soft-deleted
  // This is necessary because RLS or join might filter out inactive products
  const allProductIds = recentOrders
    .map((order) => order.fk_id_product)
    .filter((id): id is string => !!id);

  if (allProductIds.length > 0) {
    // Fetch all products (including inactive ones) for historical orders
    const { data: productsData, error: productsError } = await supabase
      .from("products")
      .select("id, name, image_url, price")
      .in("id", allProductIds);
      // Note: No is_active filter - we want to show products even if soft-deleted

    if (productsError) {
      console.error("Error fetching products for recent orders:", productsError);
    }

    // Update orders with fetched products (replace null products or keep existing)
    if (productsData && productsData.length > 0) {
      const productMap = new Map(productsData.map((p) => [p.id, p]));
      recentOrders.forEach((order) => {
        // If product is null or missing, use fetched product
        if (!order.products && order.fk_id_product && productMap.has(order.fk_id_product)) {
          order.products = productMap.get(order.fk_id_product)!;
        }
      });
    }
  }

  // Remove fk_id_product from final result (not needed in UI)
  const finalRecentOrders = recentOrders.map(({ fk_id_product, ...order }) => order);

  return {
    totalRevenue: totalRevenue || 0,
    ordersToday: {
      count: ordersToday?.orders_count || 0,
      revenue: ordersToday?.revenue_today || 0,
    },
    ordersWeek: {
      count: ordersWeek?.orders_count || 0,
      revenue: ordersWeek?.revenue_week || 0,
    },
    failedPayments: {
      count: failedPayments?.failed_count || 0,
      revenue: failedPayments?.failed_revenue || 0,
    },
    topProducts: topProducts || [],
    recentOrders: finalRecentOrders || [],
    errors: {
      totalRevenue: totalRevenueResult.error,
      ordersToday: ordersTodayResult.error,
      ordersWeek: ordersWeekResult.error,
      failedPayments: failedPaymentsResult.error,
      topProducts: topProductsResult.error,
      recentOrders: recentOrdersError,
    },
  };
}

export default async function AdminDashboardPage() {
  const supabase = await supabaseServer();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile || profile.role !== "admin") redirect("/not-authorized");

  // Fetch analytics data
  const analyticsData = await getAnalyticsData();

  return (
    <main className="max-w-7xl mx-auto px-6 py-16">
      <div className="mb-8">
        <Button asChild variant="outline" className="mb-4">
          <Link href="/admin">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Admin Panel
          </Link>
        </Button>
        <h1 className="text-4xl font-bold text-slate-900">Analytics Dashboard</h1>
        <p className="text-slate-600 mt-2">
          Real-time business metrics and insights
        </p>
      </div>

      <AdminDashboardClient analyticsData={analyticsData} />
    </main>
  );
}

