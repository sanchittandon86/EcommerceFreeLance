"use client"

import { useEffect, useState, useRef } from "react"
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
    let mounted = true
    let timeoutId: NodeJS.Timeout | null = null

    // Get initial auth state - use getUser() for more reliable validation
    async function loadUserData() {
      try {
        // Use getUser() instead of getSession() - validates session server-side
        const { data: { user: currentUser }, error: authError } = await supabase.auth.getUser()
        
        if (!mounted) return

        // Set user immediately - don't wait for profile
        setUser(currentUser ?? null)
        
        // CRITICAL: Clear loading state immediately after auth resolution
        // Profile fetch will happen asynchronously and won't block UI
        setLoading(false)

        // Fetch profile asynchronously - don't block UI rendering
        if (currentUser) {
          // Use void to explicitly mark as fire-and-forget
          void loadUserProfile(currentUser.id, currentUser.email)
        }
      } catch (error) {
        console.error("Error loading user data:", error)
        // Ensure loading is cleared even on error
        if (mounted) {
          setLoading(false)
        }
      }
    }

    // Load profile separately - non-blocking
    async function loadUserProfile(userId: string, userEmail?: string) {
      try {
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", userId)
          .maybeSingle()

        if (!mounted) return

        if (profileError) {
          console.error("Error fetching profile:", profileError)
        } else if (profileData) {
          setProfile(profileData as UserProfile)
        } else {
          // Profile doesn't exist, try to create it (async, non-blocking)
          const { data: newProfile, error: createError } = await supabase
            .from("profiles")
            .upsert(
              { 
                id: userId, 
                email: userEmail || null, 
                role: "user" 
              },
              { onConflict: "id" }
            )
            .select("role")
            .single()

          if (!mounted) return

          if (createError) {
            // Check if it's a duplicate key error (profile was created by trigger)
            if (createError.code === "23505" || createError.message?.includes("duplicate")) {
              // Profile was created by trigger, fetch it again
              const { data: retryProfile } = await supabase
                .from("profiles")
                .select("role")
                .eq("id", userId)
                .maybeSingle()

              if (mounted && retryProfile) {
                setProfile(retryProfile as UserProfile)
              }
            } else {
              console.error("Error creating profile:", createError.code, createError.message)
            }
          } else if (newProfile) {
            setProfile(newProfile as UserProfile)
          }
        }
      } catch (error) {
        // Silently fail - profile is optional, don't block UI
        console.error("Profile load error:", error)
      }
    }

    loadUserData()

    // Hard fallback timeout - ensures loading is ALWAYS cleared
    timeoutId = setTimeout(() => {
      if (mounted) {
        setLoading(false)
      }
    }, 3000) // Max 3 seconds loading

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return

      // Skip all processing if we're logging out
      if (logoutRef.current) {
        return
      }

      // Handle SIGNED_OUT event explicitly
      if (event === 'SIGNED_OUT' || !session) {
        setUser(null)
        setProfile(null)
        setLoading(false) // Ensure loading is cleared
        // Don't refresh during logout to avoid race conditions
        if (event !== 'SIGNED_OUT' && !logoutRef.current) {
          router.refresh()
        }
        return
      }

      // Only process if we have a user session and not logging out
      if (session?.user && !logoutRef.current) {
        // Update user immediately - don't wait for profile
        setUser(session.user)
        setLoading(false) // Clear loading immediately

        // Fetch profile asynchronously - non-blocking
        void loadUserProfile(session.user.id, session.user.email)
      }

      // Only refresh if not logging out
      if (!logoutRef.current) {
        router.refresh()
      }
    })

    return () => {
      mounted = false
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
      subscription.unsubscribe()
    }
  }, [router])

  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const logoutRef = useRef(false)

  async function handleLogout() {
    logoutRef.current = true
    setIsLoggingOut(true)
    setDropdownOpen(false) // Close dropdown immediately
    
    // Clear user state immediately to prevent any UI updates
    setUser(null)
    setProfile(null)
    
    // Set a timeout fallback to ensure redirect happens even if signOut hangs
    const redirectTimeout = setTimeout(() => {
      console.warn("Logout timeout - forcing redirect")
      if (typeof window !== "undefined") {
        window.location.replace("/")
      }
    }, 2000) // 2 second fallback
    
    try {
      // Clear local storage first (cart and wishlist)
      if (typeof window !== "undefined") {
        localStorage.removeItem("cart")
        localStorage.removeItem("wishlist")
      }
      
      // Sign out from Supabase with timeout
      const signOutPromise = supabase.auth.signOut({
        scope: 'global' // Sign out from all sessions
      })
      
      // Race between signOut and timeout
      const timeoutPromise = new Promise((resolve) => setTimeout(resolve, 1000))
      
      const result = await Promise.race([signOutPromise, timeoutPromise])
      
      if (result && typeof result === 'object' && 'error' in result) {
        const { error: signOutError } = result as { error: any }
        if (signOutError) {
          console.error("Logout error:", signOutError)
        }
      }
      
      // Clear the timeout since we're redirecting now
      clearTimeout(redirectTimeout)
      
      // Small delay to ensure state is cleared
      await new Promise((resolve) => setTimeout(resolve, 100))
      
      // Force hard redirect to homepage - this ensures clean state
      // Using replace to prevent back button issues
      if (typeof window !== "undefined") {
        window.location.replace("/")
      }
    } catch (error) {
      console.error("Logout error:", error)
      // Clear the timeout
      clearTimeout(redirectTimeout)
      // Always redirect even on error to prevent stuck state
      if (typeof window !== "undefined") {
        window.location.replace("/")
      }
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
            <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
              <DropdownMenuTrigger asChild>
                <button 
                  className="flex items-center gap-2 focus:outline-none"
                  disabled={isLoggingOut}
                >
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-amber-700 text-white">
                      {isLoggingOut ? "..." : getUserInitials(user.email)}
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
                  onClick={(e) => {
                    e.preventDefault()
                    handleLogout()
                  }}
                  disabled={isLoggingOut}
                  className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  {isLoggingOut ? (
                    <span className="flex items-center">
                      <span className="animate-pulse">Logging out...</span>
                    </span>
                  ) : (
                    "Logout"
                  )}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </nav>
  )
}
