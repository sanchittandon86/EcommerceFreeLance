"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";

export function LogoutButton() {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  async function handleLogout() {
    setIsLoggingOut(true);
    try {
      // Sign out from Supabase
      await supabase.auth.signOut();
      
      // Clear local storage (cart and wishlist)
      if (typeof window !== "undefined") {
        localStorage.removeItem("cart");
        localStorage.removeItem("wishlist");
      }
      
      // Wait a moment for sign out to complete
      await new Promise((resolve) => setTimeout(resolve, 100));
      
      // Redirect to homepage using hard redirect for immediate navigation
      window.location.href = "/";
    } catch (error) {
      console.error("Logout error:", error);
      setIsLoggingOut(false);
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleLogout}
      disabled={isLoggingOut}
      className="text-gray-700 hover:text-black disabled:opacity-50"
    >
      {isLoggingOut ? "Logging out..." : "Logout"}
    </Button>
  );
}

