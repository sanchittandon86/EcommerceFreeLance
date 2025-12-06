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
import { ArrowLeft, Plus } from "lucide-react";

export default async function AdminProductsPage() {
  const supabase = await supabaseServer();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") redirect("/not-authorized");

  return (
    <main className="max-w-6xl mx-auto px-6 py-16">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <Button asChild variant="outline" className="mb-4">
              <Link href="/admin">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Admin Panel
              </Link>
            </Button>
            <h1 className="text-4xl font-bold text-slate-900">Manage Products</h1>
            <p className="text-slate-600 mt-2">
              Add, edit, and manage your product catalog
            </p>
          </div>
          <Button asChild>
            <Link href="/admin/products/new">
              <Plus className="w-4 h-4 mr-2" />
              Add Product
            </Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Products</CardTitle>
          <CardDescription>
            Your product management interface
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <p className="text-gray-600 mb-4">
              Product management interface coming soon
            </p>
            <p className="text-sm text-gray-500">
              This page will allow you to:
            </p>
            <ul className="text-sm text-gray-500 mt-2 space-y-1 list-disc list-inside">
              <li>View all products</li>
              <li>Add new products</li>
              <li>Edit existing products</li>
              <li>Delete products</li>
              <li>Manage product categories</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}

