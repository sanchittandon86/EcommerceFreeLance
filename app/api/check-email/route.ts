import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    // Try to use service role key if available, otherwise use anon key
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      serviceRoleKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Check profiles table for existing email
    // If service role key is used, this bypasses RLS
    // If anon key is used, RLS might block it, but we'll try anyway
    const { data: profile, error } = await supabaseClient
      .from("profiles")
      .select("id, email, created_at")
      .eq("email", email)
      .maybeSingle();

    // If we get an RLS error, it means we can't check, so return false (allow signup to proceed)
    // The post-signup check will catch duplicates
    if (error) {
      if (error.code === "42501" || error.message?.includes("permission") || error.message?.includes("RLS")) {
        // RLS blocked the query, return false to allow signup attempt
        return NextResponse.json({ exists: false, checked: false });
      }
      // Other errors - log but don't block signup
      console.warn("Error checking email:", error);
      return NextResponse.json({ exists: false, checked: false });
    }

    return NextResponse.json({ exists: !!profile, checked: true });
  } catch (error) {
    console.error("Error in check-email route:", error);
    // On error, return false to allow signup (post-signup check will catch duplicates)
    return NextResponse.json({ exists: false, checked: false });
  }
}
