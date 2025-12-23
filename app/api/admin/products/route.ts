import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

// Helper function to verify admin role
async function verifyAdmin() {
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { isAdmin: false, user: null, supabase: null };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile || profile.role !== "admin") {
    return { isAdmin: false, user: null, supabase: null };
  }

  return { isAdmin: true, user, supabase };
}

// GET - Fetch products with pagination (with optional includeInactive parameter)
export async function GET(req: NextRequest) {
  try {
    const { isAdmin, supabase } = await verifyAdmin();

    if (!isAdmin || !supabase) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const showInactiveOnly = searchParams.get("includeInactive") === "true";
    
    // Pagination parameters
    const page = parseInt(searchParams.get("page") || "1", 10);
    const pageSize = parseInt(searchParams.get("pageSize") || "10", 10);
    
    // Validate pagination parameters
    if (page < 1) {
      return NextResponse.json(
        { error: "Page must be greater than 0" },
        { status: 400 }
      );
    }
    
    if (pageSize < 1 || pageSize > 100) {
      return NextResponse.json(
        { error: "Page size must be between 1 and 100" },
        { status: 400 }
      );
    }

    const offset = (page - 1) * pageSize;

    // Build base query for counting total products
    let countQuery = supabase
      .from("products")
      .select("*", { count: "exact", head: true });

    // Build query for fetching products
    let query = supabase
      .from("products")
      .select("id, name, price, category, image_url, created_at, is_active, deleted_at")
      .order("created_at", { ascending: false })
      .range(offset, offset + pageSize - 1);

    // Filter by active status
    if (showInactiveOnly) {
      // Show only inactive products
      query = query.eq("is_active", false);
      countQuery = countQuery.eq("is_active", false);
    } else {
      // Show only active products
      query = query.eq("is_active", true);
      countQuery = countQuery.eq("is_active", true);
    }

    // Execute both queries in parallel
    const [productsResult, countResult] = await Promise.all([
      query,
      countQuery,
    ]);

    if (productsResult.error) {
      console.error("Error fetching products:", productsResult.error);
      return NextResponse.json(
        { error: "Failed to fetch products" },
        { status: 500 }
      );
    }

    if (countResult.error) {
      console.error("Error counting products:", countResult.error);
      return NextResponse.json(
        { error: "Failed to count products" },
        { status: 500 }
      );
    }

    const total = countResult.count || 0;
    const totalPages = Math.ceil(total / pageSize);

    return NextResponse.json({
      products: productsResult.data || [],
      pagination: {
        page,
        pageSize,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    });
  } catch (error) {
    console.error("Error in GET /api/admin/products:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Create new product
export async function POST(req: NextRequest) {
  try {
    const { isAdmin, supabase } = await verifyAdmin();

    if (!isAdmin || !supabase) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { name, price, category, image_url } = body;

    // Validation
    if (!name || !price || !category || !image_url) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (typeof price !== "number" || price <= 0) {
      return NextResponse.json(
        { error: "Price must be a positive number" },
        { status: 400 }
      );
    }

    // Validate category
    const validCategories = ["Bags", "BedSheet", "PillowCover", "Blankets"];
    if (!validCategories.includes(category)) {
      return NextResponse.json(
        { error: "Invalid category" },
        { status: 400 }
      );
    }

    const { data: product, error } = await supabase
      .from("products")
      .insert([
        {
          name,
          price,
          category,
          image_url,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("Error creating product:", error);
      return NextResponse.json(
        { error: "Failed to create product" },
        { status: 500 }
      );
    }

    return NextResponse.json({ product }, { status: 201 });
  } catch (error) {
    console.error("Error in POST /api/admin/products:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT - Update existing product
export async function PUT(req: NextRequest) {
  try {
    const { isAdmin, supabase } = await verifyAdmin();

    if (!isAdmin || !supabase) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { id, name, price, category, image_url } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Product ID is required" },
        { status: 400 }
      );
    }

    // Validation
    if (!name || !price || !category || !image_url) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (typeof price !== "number" || price <= 0) {
      return NextResponse.json(
        { error: "Price must be a positive number" },
        { status: 400 }
      );
    }

    // Validate category
    const validCategories = ["Bags", "BedSheet", "PillowCover", "Blankets"];
    if (!validCategories.includes(category)) {
      return NextResponse.json(
        { error: "Invalid category" },
        { status: 400 }
      );
    }

    const { data: product, error } = await supabase
      .from("products")
      .update({
        name,
        price,
        category,
        image_url,
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating product:", error);
      return NextResponse.json(
        { error: "Failed to update product" },
        { status: 500 }
      );
    }

    return NextResponse.json({ product });
  } catch (error) {
    console.error("Error in PUT /api/admin/products:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE - Soft delete product (set is_active = false, deleted_at = now())
export async function DELETE(req: NextRequest) {
  try {
    const { isAdmin, supabase } = await verifyAdmin();

    if (!isAdmin || !supabase) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Product ID is required" },
        { status: 400 }
      );
    }

    // Soft delete: set is_active = false and deleted_at = now()
    // Note: After running the column fix SQL, only is_active should exist
    const { error } = await supabase
      .from("products")
      .update({
        is_active: false,
        deleted_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) {
      console.error("Error soft deleting product:", error);
      return NextResponse.json(
        { error: "Failed to delete product" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in DELETE /api/admin/products:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

