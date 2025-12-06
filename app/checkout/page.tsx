import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabaseServer";
import CheckoutClient from "./CheckoutClient";

export default async function CheckoutPage() {
  const supabase = await supabaseServer();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return <CheckoutClient />;
}

