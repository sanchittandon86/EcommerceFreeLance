import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;
  const protectedRoutes = ["/wishlist", "/checkout", "/account", "/admin"];

  // Check if route is protected
  if (!protectedRoutes.some((r) => pathname.startsWith(r))) {
    return NextResponse.next();
  }

  // Check for any Supabase auth cookie (they start with "sb-" and contain "auth")
  const hasSupabaseCookie = req.cookies.getAll().some(
    (cookie) => cookie.name.startsWith("sb-") && cookie.name.includes("auth")
  );

  if (!hasSupabaseCookie) {
    const url = new URL("/login", req.url);
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/wishlist/:path*",
    "/checkout/:path*",
    "/account/:path*",
    "/admin/:path*",
  ],
};
