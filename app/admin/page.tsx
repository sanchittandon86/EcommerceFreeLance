import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabaseServer";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Package, ShoppingBag, BarChart3 } from "lucide-react";

export default async function AdminPage() {
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

  return (
    <main className="max-w-6xl mx-auto px-6 py-16">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-slate-900">Admin Panel</h1>
        <p className="text-slate-600 mt-2">
          Welcome back, {user.email}. Manage your store from here.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 className="w-6 h-6 text-amber-700" />
              <CardTitle>Analytics</CardTitle>
            </div>
            <CardDescription>
              View business metrics and insights
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/admin/dashboard">View Dashboard</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-center gap-2 mb-2">
              <Package className="w-6 h-6 text-amber-700" />
              <CardTitle>Products</CardTitle>
            </div>
            <CardDescription>
              Manage your product catalog
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/admin/products">Manage Products</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-center gap-2 mb-2">
              <ShoppingBag className="w-6 h-6 text-amber-700" />
              <CardTitle>Orders</CardTitle>
            </div>
            <CardDescription>
              View and manage customer orders
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/admin/orders">View Orders</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8 p-4 bg-amber-50 border border-amber-200 rounded-lg">
        <p className="text-sm text-amber-800">
          <strong>Admin Role:</strong> You are logged in as an administrator.
          You have full access to manage products, orders, and store settings.
        </p>
      </div>
    </main>
  );
}

