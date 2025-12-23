import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabaseServer";
import { LogoutButton } from "@/components/LogoutButton";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default async function AccountPage() {
  const supabase = await supabaseServer();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return (
    <main className="max-w-4xl mx-auto px-6 py-16">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl">My Account</CardTitle>
          <CardDescription>Manage your account information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-500">
                Email Address
              </label>
              <p className="text-lg mt-1">{user.email}</p>
            </div>
            <Separator />
            <div>
              <label className="text-sm font-medium text-gray-500">
                User ID
              </label>
              <p className="text-sm mt-1 font-mono text-gray-600 break-all">
                {user.id}
              </p>
            </div>
            <Separator />
            <div>
              <label className="text-sm font-medium text-gray-500">
                Account Created
              </label>
              <p className="text-sm mt-1 text-gray-600">
                {new Date(user.created_at).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
          </div>
          <Separator />
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Quick Actions</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="p-4 border rounded-lg bg-gray-50">
                <h4 className="font-medium mb-1">Saved Addresses</h4>
                <p className="text-sm text-gray-600">Manage your delivery addresses</p>
              </div>
              <Button asChild variant="outline" className="justify-start h-auto p-4">
                <Link href="/account/orderhistory" className="text-left">
                  <div>
                    <h4 className="font-medium mb-1">Order History</h4>
                    <p className="text-sm text-gray-600">View your past orders</p>
                  </div>
                </Link>
              </Button>
            </div>
          </div>
          <Separator />
          <div className="flex justify-end">
            <LogoutButton />
          </div>
        </CardContent>
      </Card>
    </main>
  );
}

