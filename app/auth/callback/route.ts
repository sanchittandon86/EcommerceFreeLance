import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") || "/";

  if (code) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: any) {
            try {
              cookieStore.set({ name, value, ...options });
            } catch (error) {
              // Handle cookie setting errors (e.g., in middleware)
            }
          },
          remove(name: string, options: any) {
            try {
              cookieStore.set({ name, value: "", ...options });
            } catch (error) {
              // Handle cookie removal errors
            }
          },
        },
      }
    );

    // Exchange the code for a session
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Get the user to ensure profile is created
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        // Ensure profile exists
        const { data: profile } = await supabase
          .from("profiles")
          .select("id")
          .eq("id", user.id)
          .maybeSingle();

        if (!profile) {
          // Create profile if it doesn't exist
          // Only include email if the column exists (handled by making it optional)
          await supabase.from("profiles").insert([
            {
              id: user.id,
              ...(user.email && { email: user.email }),
              role: "user",
            },
          ]);
        }
      }

      // Wait a moment for profile creation
      await new Promise((resolve) => setTimeout(resolve, 500));
      
      // Redirect to home with success message (user is now logged in)
      const redirectUrl = new URL("/", request.url);
      redirectUrl.searchParams.set("confirmed", "true");
      return NextResponse.redirect(redirectUrl);
    } else {
      // If there's an error, redirect to login with error message
      const errorMessage = error.message || "auth_callback_error";
      return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(errorMessage)}`, request.url));
    }
  }

  // If there's no code, redirect to login
  return NextResponse.redirect(new URL("/login?error=no_code", request.url));
}

