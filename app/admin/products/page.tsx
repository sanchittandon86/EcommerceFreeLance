import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabaseServer";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import AdminProductsClient from "./AdminProductsClient";

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
    .maybeSingle();

  if (!profile || profile.role !== "admin") redirect("/not-authorized");

  return (
    <main className="max-w-6xl mx-auto px-6 py-16">
      <div className="mb-8">
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

      <AdminProductsClient />
    </main>
  );
}

