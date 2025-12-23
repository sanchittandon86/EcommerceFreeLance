import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabaseServer";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Package, ShoppingBag } from "lucide-react";
import { globalConfig } from "@/lib/globalConfig";

interface OrderDetail {
  id: string;
  fk_id_user: string;
  fk_id_product: string;
  amount: number;
  quantity: number;
  order_status: number;
  is_active: number;
  created_at: string;
  products: {
    id: string;
    name: string;
    image_url: string;
    price: number;
  } | null;
}

interface GroupedOrder {
  orderDate: string;
  orderItems: OrderDetail[];
  totalAmount: number;
  orderId: string; // First order ID as group identifier
}

export default async function OrderHistoryPage() {
  const supabase = await supabaseServer();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Fetch orderDetails for the user with completed status
  const { data: orderDetails, error } = await supabase
    .from("orderDetails")
    .select(
      `
      id,
      fk_id_user,
      fk_id_product,
      amount,
      quantity,
      order_status,
      is_active,
      created_at,
      products:fk_id_product (
        id,
        name,
        image_url,
        price
      )
    `
    )
    .eq("fk_id_user", user.id)
    .eq("order_status", globalConfig.orderStatus.completed)
    .eq("is_active", 1)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching order history:", error);
  }

  // Group orders by transaction (orders created within 5 seconds are grouped together)
  const groupedOrders: GroupedOrder[] = [];
  if (orderDetails && orderDetails.length > 0) {
    const orderMap = new Map<string, OrderDetail[]>();

    orderDetails.forEach((order: any) => {
      // Round created_at to nearest 5 seconds for grouping
      const orderDate = new Date(order.created_at);
      const roundedTime = Math.floor(orderDate.getTime() / 5000) * 5000;
      const groupKey = roundedTime.toString();

      if (!orderMap.has(groupKey)) {
        orderMap.set(groupKey, []);
      }
      orderMap.get(groupKey)!.push(order as OrderDetail);
    });

    // Convert map to array and sort by date (newest first)
    Array.from(orderMap.entries())
      .sort((a, b) => parseInt(b[0]) - parseInt(a[0]))
      .forEach(([groupKey, items]) => {
        const totalAmount = items.reduce(
          (sum, item) => sum + item.amount * item.quantity,
          0
        );
        groupedOrders.push({
          orderDate: new Date(parseInt(groupKey)).toISOString(),
          orderItems: items,
          totalAmount,
          orderId: String(items[0]?.id || groupKey),
        });
      });
  }

  return (
    <main className="max-w-6xl mx-auto px-6 py-16">
      <div className="mb-8">
        <Button asChild variant="outline" className="mb-4">
          <Link href="/account">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Account
          </Link>
        </Button>
        <h1 className="text-4xl font-bold text-slate-900">Order History</h1>
        <p className="text-slate-600 mt-2">
          View all your past orders and purchases
        </p>
      </div>

      {error ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-red-600 mb-4">
              Error loading order history. Please try again later.
            </p>
            <Button asChild>
              <Link href="/account">Back to Account</Link>
            </Button>
          </CardContent>
        </Card>
      ) : groupedOrders.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Package className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No Orders Yet
            </h3>
            <p className="text-gray-600 mb-6">
              You haven't placed any orders yet. Start shopping to see your
              order history here.
            </p>
            <Button asChild>
              <Link href="/">
                <ShoppingBag className="w-4 h-4 mr-2" />
                Browse Products
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {groupedOrders.map((group, index) => (
            <Card key={group.orderId} className="overflow-hidden">
              <CardHeader className="bg-slate-50">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <CardTitle className="text-lg">
                      Order #{String(group.orderId || '').slice(0, 8).toUpperCase()}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      Placed on{" "}
                      {new Date(group.orderDate).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-4">
                    <Badge
                      variant="default"
                      className="bg-green-600 hover:bg-green-700"
                    >
                      Completed
                    </Badge>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Total</p>
                      <p className="text-xl font-bold text-slate-900">
                        ₹{group.totalAmount.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {group.orderItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex gap-4 pb-4 border-b last:border-0 last:pb-0"
                    >
                      {item.products?.image_url && (
                        <div className="flex-shrink-0">
                          <img
                            src={item.products.image_url}
                            alt={item.products.name}
                            className="w-20 h-20 object-cover rounded-lg border"
                          />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-slate-900 truncate">
                          {item.products?.name || "Product"}
                        </h4>
                        <p className="text-sm text-gray-600 mt-1">
                          Quantity: {item.quantity}
                        </p>
                        <p className="text-sm text-gray-600">
                          Price: ₹{item.amount.toFixed(2)} each
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="font-semibold text-slate-900">
                          ₹{(item.amount * item.quantity).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                <Separator className="my-4" />
                <div className="flex justify-between items-center">
                  <p className="text-sm text-gray-600">
                    {group.orderItems.length}{" "}
                    {group.orderItems.length === 1 ? "item" : "items"}
                  </p>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Order Total</p>
                    <p className="text-xl font-bold text-slate-900">
                      ₹{group.totalAmount.toFixed(2)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </main>
  );
}

