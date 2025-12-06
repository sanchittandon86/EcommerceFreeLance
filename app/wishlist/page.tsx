import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabaseServer";
import WishlistClient from "./WishlistClient";

export default async function WishlistPage() {
  const supabase = await supabaseServer();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return <WishlistClient />;
}

