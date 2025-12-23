"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  TrendingUp,
  ShoppingCart,
  Calendar,
  AlertCircle,
  Package,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";

interface AnalyticsData {
  totalRevenue: number;
  ordersToday: {
    count: number;
    revenue: number;
  };
  ordersWeek: {
    count: number;
    revenue: number;
  };
  failedPayments: {
    count: number;
    revenue: number;
  };
  topProducts: Array<{
    id: string;
    name: string;
    image_url: string;
    price: number;
    total_quantity_sold: number;
    total_revenue: number;
  }>;
  recentOrders: Array<{
    id: string;
    amount: number;
    quantity: number;
    created_at: string;
    order_status: number;
    products: {
      id: string;
      name: string;
      image_url: string;
      price: number;
    } | null;
  }>;
  errors: Record<string, any>;
}

interface AdminDashboardClientProps {
  analyticsData: AnalyticsData;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AdminDashboardClient({
  analyticsData,
}: AdminDashboardClientProps) {
  const {
    totalRevenue,
    ordersToday,
    ordersWeek,
    failedPayments,
    topProducts,
    recentOrders,
    errors,
  } = analyticsData;

  // Check for errors
  const hasErrors = Object.values(errors).some((error) => error !== null);

  if (hasErrors) {
    console.error("Analytics errors:", errors);
  }

  return (
    <div className="space-y-8">
      {/* Error Banner */}
      {hasErrors && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-amber-800">
              <AlertCircle className="w-5 h-5" />
              <p className="text-sm">
                Some analytics data could not be loaded. Please check your database views.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Key Metrics Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Revenue */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(totalRevenue)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              All completed orders
            </p>
          </CardContent>
        </Card>

        {/* Orders Today */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Orders Today</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{ordersToday.count}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {formatCurrency(ordersToday.revenue)} revenue
            </p>
          </CardContent>
        </Card>

        {/* Orders This Week */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Week</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{ordersWeek.count}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {formatCurrency(ordersWeek.revenue)} revenue
            </p>
          </CardContent>
        </Card>

        {/* Failed Payments */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed Payments</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{failedPayments.count}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {formatCurrency(failedPayments.revenue)} lost
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Top Products and Recent Orders */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top Selling Products */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              Top Selling Products
            </CardTitle>
            <CardDescription>
              Best performing products by quantity sold
            </CardDescription>
          </CardHeader>
          <CardContent>
            {topProducts.length > 0 ? (
              <div className="space-y-4">
                {topProducts.map((product, index) => (
                  <div
                    key={product.id}
                    className="flex items-center gap-4 p-3 rounded-lg border hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex-shrink-0">
                      <span className="text-lg font-bold text-slate-400 w-6 inline-block">
                        #{index + 1}
                      </span>
                    </div>
                    {product.image_url && (
                      <div className="relative w-12 h-12 rounded-md overflow-hidden bg-slate-100 flex-shrink-0">
                        <Image
                          src={product.image_url}
                          alt={product.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{product.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {product.total_quantity_sold} sold •{" "}
                        {formatCurrency(product.total_revenue)} revenue
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-sm">
                        {formatCurrency(product.price)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">
                No products sold yet
              </p>
            )}
          </CardContent>
        </Card>

        {/* Recent Orders */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5" />
              Recent Orders
            </CardTitle>
            <CardDescription>Last 5 completed orders</CardDescription>
          </CardHeader>
          <CardContent>
            {recentOrders.length > 0 ? (
              <div className="space-y-4">
                {recentOrders.map((order) => (
                  <div
                    key={order.id}
                    className="flex items-center gap-4 p-3 rounded-lg border hover:bg-slate-50 transition-colors"
                  >
                    {order.products?.image_url && (
                      <div className="relative w-12 h-12 rounded-md overflow-hidden bg-slate-100 flex-shrink-0">
                        <Image
                          src={order.products.image_url}
                          alt={order.products.name || "Product"}
                          fill
                          className="object-cover"
                        />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">
                        {order.products?.name || "Unknown Product"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(order.created_at)} • Qty: {order.quantity}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-sm">
                        {formatCurrency(order.amount * order.quantity)}
                      </p>
                      <Badge variant="outline" className="text-xs mt-1">
                        Completed
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">
                No recent orders
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

