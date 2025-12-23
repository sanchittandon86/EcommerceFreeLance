"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Loader2, RefreshCw, DollarSign } from "lucide-react";
import Image from "next/image";

interface OrderDetailsDrawerProps {
  orderId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStatusUpdate: () => void;
}

interface OrderItem {
  id: string;
  amount: number;
  quantity: number;
  order_status: number;
  created_at: string;
  fk_id_product: string;
  products: {
    id: string;
    name: string;
    image_url: string;
    price: number;
  } | null;
}

interface Order {
  id: string;
  user_id: string;
  status: string;
  amount: number;
  razorpay_order_id: string | null;
  payment_id: string | null;
  signature: string | null;
  created_at: string;
  updated_at: string;
  profiles: {
    email: string;
  } | null;
}

export default function OrderDetailsDrawer({
  orderId,
  open,
  onOpenChange,
  onStatusUpdate,
}: OrderDetailsDrawerProps) {
  const [order, setOrder] = useState<Order | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [newStatus, setNewStatus] = useState<string>("");
  const [isRefunding, setIsRefunding] = useState(false);

  useEffect(() => {
    if (open && orderId) {
      fetchOrderDetails();
    }
  }, [open, orderId]);

  const fetchOrderDetails = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/admin/orders/${orderId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch order details");
      }
      const data = await response.json();
      setOrder(data.order);
      setOrderItems(data.orderItems || []);
      setNewStatus(data.order.status);
    } catch (error) {
      console.error("Error fetching order details:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusUpdate = async () => {
    if (!order || !newStatus || newStatus === order.status) return;

    try {
      setIsUpdating(true);
      const response = await fetch("/api/admin/orders/update-status", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: order.id,
          status: newStatus,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        alert(error.error || "Failed to update order status");
        return;
      }

      const data = await response.json();
      setOrder(data.order);
      onStatusUpdate();
      alert(`Order status updated to ${newStatus}`);
    } catch (error) {
      console.error("Error updating order status:", error);
      alert("Failed to update order status");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRefund = async () => {
    if (!order) return;

    if (!confirm(`Are you sure you want to refund order ${String(order.id || '').slice(0, 8)}?`)) {
      return;
    }

    try {
      setIsRefunding(true);
      const response = await fetch("/api/admin/orders/refund", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: order.id,
          reason: "Admin refund",
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        alert(error.error || "Failed to process refund");
        return;
      }

      const data = await response.json();
      setOrder(data.order);
      setNewStatus(data.order.status);
      onStatusUpdate();
      alert("Refund processed successfully");
    } catch (error) {
      console.error("Error processing refund:", error);
      alert("Failed to process refund");
    } finally {
      setIsRefunding(false);
    }
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadge = (status: string) => {
    const statusLower = status.toLowerCase();
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      paid: "default",
      pending: "secondary",
      failed: "destructive",
      refunded: "outline",
      closed: "outline",
    };

    return (
      <Badge variant={variants[statusLower] || "outline"}>
        {status.toUpperCase()}
      </Badge>
    );
  };

  const getValidNextStatuses = (currentStatus: string): string[] => {
    // Match the API's VALID_TRANSITIONS
    // Only pending can transition to paid or failed
    // paid and failed are terminal states
    const transitions: Record<string, string[]> = {
      pending: ["paid", "failed"],
      paid: [], // Terminal state
      failed: [], // Terminal state
      completed: [], // Terminal state (same as paid)
    };
    return transitions[currentStatus.toLowerCase()] || [];
  };

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Order Details</DialogTitle>
          <DialogDescription>
            View and manage order information
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-sm text-muted-foreground">Loading order details...</span>
          </div>
        ) : order ? (
          <div className="space-y-6">
            {/* Order Information */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Order ID</p>
                  <p className="font-mono text-sm">{order.id}</p>
                </div>
                <div>{getStatusBadge(order.status)}</div>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">User Email</p>
                  <p className="font-medium">{order.profiles?.email || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Amount</p>
                  <p className="font-bold text-lg">{formatCurrency(order.amount)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Created</p>
                  <p className="text-sm">{formatDate(order.created_at)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Last Updated</p>
                  <p className="text-sm">{formatDate(order.updated_at)}</p>
                </div>
              </div>

              {order.razorpay_order_id && (
                <div>
                  <p className="text-sm text-muted-foreground">Razorpay Order ID</p>
                  <p className="font-mono text-sm">{order.razorpay_order_id}</p>
                </div>
              )}

              {order.payment_id && (
                <div>
                  <p className="text-sm text-muted-foreground">Payment ID</p>
                  <p className="font-mono text-sm">{order.payment_id}</p>
                </div>
              )}
            </div>

            <Separator />

            {/* Order Items */}
            <div>
              <h3 className="font-semibold mb-4">Order Items</h3>
              {orderItems.length > 0 ? (
                <div className="space-y-3">
                  {orderItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-4 p-3 rounded-lg border"
                    >
                      {item.products?.image_url && (
                        <div className="relative w-16 h-16 rounded-md overflow-hidden bg-slate-100 flex-shrink-0">
                          <Image
                            src={item.products.image_url}
                            alt={item.products.name || "Product"}
                            fill
                            className="object-cover"
                          />
                        </div>
                      )}
                      <div className="flex-1">
                        <p className="font-medium">
                          {item.products?.name || "Unknown Product"}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Quantity: {item.quantity} × {formatCurrency(item.amount)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">
                          {formatCurrency(item.amount * item.quantity)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No order items found</p>
              )}
            </div>

            <Separator />

            {/* Status Update */}
            <div className="space-y-4">
              <h3 className="font-semibold">Update Order Status</h3>
              <div className="flex items-center gap-4">
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={order.status}>{order.status.toUpperCase()}</SelectItem>
                    {getValidNextStatuses(order.status).map((status) => (
                      <SelectItem key={status} value={status}>
                        {status.toUpperCase()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  onClick={handleStatusUpdate}
                  disabled={isUpdating || newStatus === order.status}
                >
                  {isUpdating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    "Update Status"
                  )}
                </Button>
              </div>
            </div>

            {/* Refund Action */}
            {/* Note: Refund functionality is available but marks order as failed since refunded status doesn't exist in DB */}
            {order.status === "paid" && (
              <div className="pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={handleRefund}
                  disabled={isRefunding}
                  className="w-full"
                >
                  {isRefunding ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processing Refund...
                    </>
                  ) : (
                    <>
                      <DollarSign className="h-4 w-4 mr-2" />
                      Process Refund (Marks as Failed)
                    </>
                  )}
                </Button>
                <p className="text-xs text-muted-foreground mt-2 text-center">
                  Note: Refunds will mark the order as failed. Refunded status is not yet supported in the database.
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Order not found</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

