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
    // Get initial session and profile
    async function loadUserData() {
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user ?? null)
      
      if (session?.user) {
        // Fetch user profile to check role
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", session.user.id)
          .maybeSingle()
        
        if (profileError) {
          console.error("Error fetching profile:", profileError)
        } else if (profileData) {
          setProfile(profileData as UserProfile)
        } else {
          // Profile doesn't exist, try to create it with default role
          // Use upsert to handle race conditions where profile might be created by trigger
          const { data: newProfile, error: createError } = await supabase
            .from("profiles")
            .upsert(
              { 
                id: session.user.id, 
                email: session.user.email || null, 
                role: "user" 
              },
              { onConflict: "id" }
            )
            .select("role")
            .single()
          
          if (createError) {
            // Check if it's a duplicate key error (profile was created by trigger)
            if (createError.code === "23505" || createError.message?.includes("duplicate")) {
              // Profile was created by trigger, fetch it again
              const { data: retryProfile } = await supabase
                .from("profiles")
                .select("role")
                .eq("id", session.user.id)
                .maybeSingle()
              
              if (retryProfile) {
                setProfile(retryProfile as UserProfile)
              }
            } else {
              // Only log non-duplicate errors
              console.error("Error creating profile:", createError.code, createError.message)
            }
          } else if (newProfile) {
            setProfile(newProfile as UserProfile)
          }
        }
      }
      
      setLoading(false)
    }

    loadUserData()

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      // Skip all processing if we're logging out
      if (logoutRef.current) {
        return
      }
      
      // Handle SIGNED_OUT event explicitly
      if (event === 'SIGNED_OUT' || !session) {
        setUser(null)
        setProfile(null)
        // Don't refresh during logout to avoid race conditions
        if (event !== 'SIGNED_OUT' && !logoutRef.current) {
          router.refresh()
        }
        return
      }
      
      // Only process if we have a user session and not logging out
      if (session?.user && !logoutRef.current) {
        setUser(session.user)
        
        // Fetch user profile to check role (with timeout to prevent hanging)
        try {
          const profilePromise = supabase
            .from("profiles")
            .select("role")
            .eq("id", session.user.id)
            .maybeSingle()
          
          const timeoutPromise = new Promise((resolve) => setTimeout(() => resolve(null), 2000))
          
          const result = await Promise.race([profilePromise, timeoutPromise])
          
          if (result && typeof result === 'object' && 'data' in result) {
            const { data: profileData, error: profileError } = result as { data: any, error: any }
            
            if (profileError) {
              console.error("Error fetching profile:", profileError)
            } else if (profileData) {
              setProfile(profileData as UserProfile)
            } else if (!logoutRef.current) {
              // Profile doesn't exist, try to create it with default role
              // Use upsert to handle race conditions where profile might be created by trigger
              const { data: newProfile, error: createError } = await supabase
                .from("profiles")
                .upsert(
                  { 
                    id: session.user.id, 
                    email: session.user.email || null, 
                    role: "user" 
                  },
                  { onConflict: "id" }
                )
                .select("role")
                .single()
              
              if (createError) {
                // Check if it's a duplicate key error (profile was created by trigger)
                if (createError.code === "23505" || createError.message?.includes("duplicate")) {
                  // Profile was created by trigger, fetch it again
                  const { data: retryProfile } = await supabase
                    .from("profiles")
                    .select("role")
                    .eq("id", session.user.id)
                    .maybeSingle()
                  
                  if (retryProfile && !logoutRef.current) {
                    setProfile(retryProfile as UserProfile)
                  }
                } else {
                  // Only log non-duplicate errors
                  console.error("Error creating profile:", createError.code, createError.message)
                }
              } else if (newProfile && !logoutRef.current) {
                setProfile(newProfile as UserProfile)
              }
            }
          }
        } catch (err) {
          // Silently handle errors during logout
          if (!logoutRef.current) {
            console.error("Error in auth state change:", err)
          }
        }
      }
      
      // Only refresh if not logging out
      if (!logoutRef.current) {
        router.refresh()
      }
    })

    return () => subscription.unsubscribe()
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
