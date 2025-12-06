import { supabase } from "@/lib/supabaseClient";

/**
 * Shared logout utility function
 * Handles Supabase sign out and clears local storage
 * Note: Cart clearing is handled by CartContext, not here
 */
export async function handleLogout() {
  try {
    // Sign out from Supabase
    await supabase.auth.signOut();
    
    // Clear local storage (cart and wishlist)
    // CartContext will handle cart clearing automatically on auth state change
    if (typeof window !== "undefined") {
      localStorage.removeItem("cart");
      localStorage.removeItem("wishlist");
    }
  } catch (error) {
    console.error("Error during logout:", error);
    throw error;
  }
}

