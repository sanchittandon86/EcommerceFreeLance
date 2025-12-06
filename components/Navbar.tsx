"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useCart } from "@/components/CartContext"
import { useWishlist } from "@/components/WishlistContext"
import { supabase } from "@/lib/supabaseClient"
import { Heart, ShoppingCart, User, LogOut, Shield } from "lucide-react"
import NavbarFilters from "@/components/NavbarFilters"
import type { User as SupabaseUser } from "@supabase/supabase-js"

interface UserProfile {
  role: "user" | "admin";
}

export default function Navbar() {
  const { cart } = useCart()
  const { wishlist } = useWishlist()
  const pathname = usePathname()
  const router = useRouter()
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  const cartCount = cart.reduce((sum, item) => sum + item.qty, 0)
  const wishlistCount = wishlist.length
  const isCartPage = pathname === "/cart"
  const isWishlistPage = pathname === "/wishlist"

  useEffect(() => {
    // Get initial session and profile
    async function loadUserData() {
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user ?? null)
      
      if (session?.user) {
        // Fetch user profile to check role
        const { data: profileData } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", session.user.id)
          .single()
        
        if (profileData) {
          setProfile(profileData as UserProfile)
        }
      }
      
      setLoading(false)
    }

    loadUserData()

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ?? null)
      
      if (session?.user) {
        // Fetch user profile to check role
        const { data: profileData } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", session.user.id)
          .single()
        
        if (profileData) {
          setProfile(profileData as UserProfile)
        }
      } else {
        setProfile(null)
      }
      
      router.refresh()
    })

    return () => subscription.unsubscribe()
  }, [router])

  const [isLoggingOut, setIsLoggingOut] = useState(false)

  async function handleLogout() {
    setIsLoggingOut(true)
    try {
      // Sign out from Supabase
      await supabase.auth.signOut()
      
      // Clear local storage (cart and wishlist)
      if (typeof window !== "undefined") {
        localStorage.removeItem("cart")
        localStorage.removeItem("wishlist")
      }
      
      // Wait a moment for sign out to complete
      await new Promise((resolve) => setTimeout(resolve, 100))
      
      // Redirect to homepage using hard redirect for immediate navigation
      window.location.href = "/"
    } catch (error) {
      console.error("Logout error:", error)
      setIsLoggingOut(false)
    }
  }

  // Get user initials for avatar
  const getUserInitials = (email: string | undefined) => {
    if (!email) return "U"
    return email
      .split("@")[0]
      .slice(0, 2)
      .toUpperCase()
  }

  return (
    <nav className="sticky top-0 z-50 border-b bg-white/80 backdrop-blur-md">
      <div className="max-w-6xl mx-auto flex justify-between items-center p-4">
        <Link href="/" className="text-2xl font-bold">
          NGO STORE
        </Link>

        <div className="flex gap-6 items-center">
          <Link href="/" className="text-gray-700 hover:text-black text-sm">
            Home
          </Link>

          {!isCartPage && !isWishlistPage && <NavbarFilters />}

          {/* Only show Wishlist and Cart when user is logged in */}
          {user && (
            <>
              <Link
                href="/wishlist"
                className="relative text-gray-700 hover:text-black text-sm flex items-center gap-1"
              >
                <Heart className="w-5 h-5" />
                <span className="hidden sm:inline">Wishlist</span>
                {wishlistCount > 0 && (
                  <span className="absolute -right-2 -top-2 bg-red-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {wishlistCount}
                  </span>
                )}
              </Link>

              <Link href="/cart" className="relative text-gray-700 hover:text-black text-sm flex items-center gap-1">
                <ShoppingCart className="w-5 h-5" />
                <span className="hidden sm:inline">Cart</span>
                {cartCount > 0 && (
                  <span className="absolute -right-2 -top-2 bg-red-600 text-white text-xs rounded-full px-2 py-0.5 min-w-[1.25rem] flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </Link>
            </>
          )}

          {loading ? (
            <Button size="sm" disabled>
              Loading...
            </Button>
          ) : !user ? (
            <Button asChild size="sm">
              <Link href="/login">Login</Link>
            </Button>
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 focus:outline-none">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-amber-700 text-white">
                      {getUserInitials(user.email)}
                    </AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">My Account</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/account" className="flex items-center cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    Account
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/wishlist" className="flex items-center cursor-pointer">
                    <Heart className="mr-2 h-4 w-4" />
                    Wishlist
                    {wishlistCount > 0 && (
                      <span className="ml-auto bg-red-600 text-white text-xs rounded-full px-2 py-0.5">
                        {wishlistCount}
                      </span>
                    )}
                  </Link>
                </DropdownMenuItem>
                {profile?.role === "admin" && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/admin" className="flex items-center cursor-pointer">
                        <Shield className="mr-2 h-4 w-4" />
                        Admin Panel
                      </Link>
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="cursor-pointer text-red-600 focus:text-red-600 disabled:opacity-50"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  {isLoggingOut ? "Logging out..." : "Logout"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </nav>
  )
}
