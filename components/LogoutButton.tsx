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
    
    // Set a timeout fallback to ensure redirect happens even if signOut hangs
    const redirectTimeout = setTimeout(() => {
      console.warn("Logout timeout - forcing redirect");
      if (typeof window !== "undefined") {
        window.location.replace("/");
      }
    }, 2000); // 2 second fallback
    
    try {
      // Clear local storage first (cart and wishlist)
      if (typeof window !== "undefined") {
        localStorage.removeItem("cart");
        localStorage.removeItem("wishlist");
      }
      
      // Sign out from Supabase with timeout
      const signOutPromise = supabase.auth.signOut({
        scope: 'global' // Sign out from all sessions
      });
      
      // Race between signOut and timeout
      const timeoutPromise = new Promise((resolve) => setTimeout(resolve, 1000));
      
      const result = await Promise.race([signOutPromise, timeoutPromise]);
      
      if (result && typeof result === 'object' && 'error' in result) {
        const { error: signOutError } = result as { error: any };
        if (signOutError) {
          console.error("Logout error:", signOutError);
        }
      }
      
      // Clear the timeout since we're redirecting now
      clearTimeout(redirectTimeout);
      
      // Small delay to ensure state is cleared
      await new Promise((resolve) => setTimeout(resolve, 100));
      
      // Force hard redirect to homepage - using replace to prevent back button issues
      if (typeof window !== "undefined") {
        window.location.replace("/");
      }
    } catch (error) {
      console.error("Logout error:", error);
      // Clear the timeout
      clearTimeout(redirectTimeout);
      // Always redirect even on error to prevent stuck state
      if (typeof window !== "undefined") {
        window.location.replace("/");
      }
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

