"use client"

import { useEffect, useState, useMemo } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"
import CategorySection from "@/components/CategorySection"
import { useFilters } from "@/components/FiltersContext"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Heart, Users, Handshake, BookOpen, X } from "lucide-react"
import ProductCard from "@/components/ProductCard"

export default function Home() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [products, setProducts] = useState<any[]>([])
  const [hasError, setHasError] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [showConfirmationSuccess, setShowConfirmationSuccess] = useState(false)
  const { filters, setFilters } = useFilters()

  // Check for email confirmation success
  useEffect(() => {
    const confirmed = searchParams.get("confirmed")
    if (confirmed === "true") {
      setShowConfirmationSuccess(true)
      // Clear the URL parameter
      router.replace("/", { scroll: false })
      // Auto-hide after 5 seconds
      setTimeout(() => setShowConfirmationSuccess(false), 5000)
    }
  }, [searchParams, router])

  useEffect(() => {
    let mounted = true
    let timeoutId: NodeJS.Timeout | null = null

    const fetchProducts = async () => {
      try {
        setIsLoading(true)
        
        // Add timeout to prevent infinite loading
        const fetchPromise = supabase.from("products").select("*")
        const timeoutPromise = new Promise((resolve) => 
          setTimeout(() => resolve({ data: null, error: { message: "Request timeout" } }), 5000)
        )

        const result = await Promise.race([fetchPromise, timeoutPromise]) as {
          data: any[] | null
          error: any
        }

        if (!mounted) return

        if (result.error) {
          console.error("Error fetching products:", result.error)
          setHasError(true)
          setProducts([])
        } else {
          setProducts(result.data || [])
          setHasError(false)
        }
      } catch (err) {
        console.error("Error connecting to Supabase:", err)
        if (mounted) {
          setHasError(true)
          setProducts([])
        }
      } finally {
        // CRITICAL: Always clear loading state
        if (mounted) {
          setIsLoading(false)
        }
      }
    }

    fetchProducts()

    // Hard fallback timeout - ensures loading is ALWAYS cleared
    timeoutId = setTimeout(() => {
      if (mounted) {
        setIsLoading(false)
      }
    }, 6000) // Max 6 seconds loading (products might take longer than auth)

    return () => {
      mounted = false
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
    }
  }, [])

  const categories = ["Bags", "BedSheet", "PillowCover", "Blankets"]

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    let filtered = [...products]

    // Filter by category
    if (filters.category) {
      filtered = filtered.filter((p: any) => p.category === filters.category)
    }

    // Filter by price range
    filtered = filtered.filter(
      (p: any) => p.price >= filters.priceRange[0] && p.price <= filters.priceRange[1]
    )

    // Sort
    if (filters.sort === "low") {
      filtered.sort((a: any, b: any) => a.price - b.price)
    } else if (filters.sort === "high") {
      filtered.sort((a: any, b: any) => b.price - a.price)
    }

    return filtered
  }, [products, filters])

  // Check if any filters are active
  const hasActiveFilters = filters.category !== "" || filters.priceRange[0] > 0 || filters.priceRange[1] < 3000 || filters.sort !== ""

  const scrollToProducts = () => {
    const productsSection = document.getElementById("products-section")
    if (productsSection) {
      productsSection.scrollIntoView({ behavior: "smooth" })
    }
  }

  return (
    <>
      {/* Email Confirmation Success Banner */}
      {showConfirmationSuccess && (
        <div className="bg-green-50 border-b border-green-200 sticky top-0 z-50">
          <div className="max-w-6xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-5 w-5 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                  <svg
                    className="h-3 w-3 text-white"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path d="M5 13l4 4L19 7"></path>
                  </svg>
                </div>
                <p className="text-green-800 font-medium">
                  Email confirmed successfully! Welcome to NGO STORE.
                </p>
              </div>
              <button
                onClick={() => setShowConfirmationSuccess(false)}
                className="text-green-600 hover:text-green-800 transition-colors"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      )}
      <section className="w-full bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col items-center justify-center text-center space-y-6">
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-light text-slate-900 text-balance leading-tight">
              Support Change Through Every Purchase
            </h1>
            <p className="text-lg md:text-xl text-slate-700 max-w-2xl text-balance leading-relaxed">
              Every product you buy directly funds our NGO initiatives. Together, we're empowering communities and
              creating meaningful change.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Button size="lg" className="bg-amber-700 hover:bg-amber-800 text-white" onClick={scrollToProducts}>
                Shop Now
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-amber-700 text-amber-700 hover:bg-amber-50 bg-transparent"
              >
                Learn About Our Mission
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="w-full bg-white py-16 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="border-0 bg-gradient-to-br from-blue-50 to-blue-100 shadow-sm hover:shadow-md transition p-6">
              <div className="flex flex-col items-center text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-blue-200 flex items-center justify-center">
                  <Heart className="w-6 h-6 text-blue-700" />
                </div>
                <h3 className="font-semibold text-slate-900">100% Transparent</h3>
                <p className="text-sm text-slate-700">Every dollar goes directly to our mission</p>
              </div>
            </Card>

            <Card className="border-0 bg-gradient-to-br from-green-50 to-green-100 shadow-sm hover:shadow-md transition p-6">
              <div className="flex flex-col items-center text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-green-200 flex items-center justify-center">
                  <Handshake className="w-6 h-6 text-green-700" />
                </div>
                <h3 className="font-semibold text-slate-900">Handmade Products</h3>
                <p className="text-sm text-slate-700">Crafted with care by our artisan partners</p>
              </div>
            </Card>

            <Card className="border-0 bg-gradient-to-br from-amber-50 to-amber-100 shadow-sm hover:shadow-md transition p-6">
              <div className="flex flex-col items-center text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-amber-200 flex items-center justify-center">
                  <Users className="w-6 h-6 text-amber-700" />
                </div>
                <h3 className="font-semibold text-slate-900">Empowering Communities</h3>
                <p className="text-sm text-slate-700">Supporting local artisans and their families</p>
              </div>
            </Card>

            <Card className="border-0 bg-gradient-to-br from-purple-50 to-purple-100 shadow-sm hover:shadow-md transition p-6">
              <div className="flex flex-col items-center text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-purple-200 flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-purple-700" />
                </div>
                <h3 className="font-semibold text-slate-900">Supports Education</h3>
                <p className="text-sm text-slate-700">Funding childcare and educational programs</p>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {hasError ? (
        <main className="max-w-7xl mx-auto px-6 py-16">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 text-center">
            <h2 className="text-lg font-semibold text-amber-900 mb-2">Configuration Required</h2>
            <p className="text-amber-800">
              Supabase is not configured. Please add your environment variables to get started.
            </p>
          </div>
        </main>
      ) : (
        <main id="products-section" className="max-w-7xl mx-auto px-6 py-16">
          {isLoading ? (
            categories.map((cat) => (
              <div key={cat} className="mb-16 pb-16 border-b border-slate-200 last:border-0">
                <CategorySection title={cat} products={[]} isLoading={true} />
              </div>
            ))
          ) : hasActiveFilters ? (
            // Show filtered products in a single grid
            <div className="mb-12">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-3xl font-bold text-slate-900">
                  Filtered Products
                </h2>
                <p className="text-slate-600">
                  {filteredProducts.length} {filteredProducts.length === 1 ? "product" : "products"} found
                </p>
              </div>
              {filteredProducts.length > 0 ? (
                <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 auto-rows-fr">
                  {filteredProducts.map((p: any) => (
                    <ProductCard
                      key={p.id}
                      id={p.id}
                      name={p.name}
                      price={p.price}
                      image_url={p.image_url}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-16">
                  <p className="text-xl text-slate-600 mb-4">No products match your filters</p>
                  <Button
                    variant="outline"
                    onClick={() => setFilters({ category: "", priceRange: [0, 3000], sort: "" })}
                  >
                    Clear Filters
                  </Button>
                </div>
              )}
            </div>
          ) : (
            // Show products by category when no filters are active
            categories.map((cat) => (
              <div key={cat} className="mb-16 pb-16 border-b border-slate-200 last:border-0">
                <CategorySection title={cat} products={products.filter((p: any) => p.category === cat) || []} />
              </div>
            ))
          )}
        </main>
      )}

      <section className="w-full bg-gradient-to-br from-slate-50 to-slate-100 py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col items-center text-center space-y-6">
            <h2 className="text-3xl md:text-4xl font-light text-slate-900 text-balance">
              Every Purchase Makes a Difference
            </h2>
            <p className="text-lg text-slate-700 max-w-2xl text-balance">
              Our mission is to create sustainable livelihoods for artisans while providing quality, purposeful
              products. Together, we're building a community of conscious consumers.
            </p>
            <Button size="lg" className="bg-amber-700 hover:bg-amber-800 text-white mt-4">
              Support Our Work
            </Button>
          </div>
        </div>
      </section>
    </>
  )
}
