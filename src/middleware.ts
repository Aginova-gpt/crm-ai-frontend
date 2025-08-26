import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const isLoggedIn = request.cookies.get("auth")?.value === "true";
  const { pathname } = request.nextUrl;

  // Protected routes that require authentication
  const protectedRoutes = ['/', '/dashboard', '/management', '/profiles', '/reports', '/admin', '/alarms'];

  // Rule 1: Redirect to /login if not logged in and accessing protected routes
  if (!isLoggedIn && protectedRoutes.some(route => pathname === route || pathname.startsWith(`${route}/`))) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Rule 2: Redirect to /dashboard if logged in and accessing the root page
  if (isLoggedIn && pathname === "/") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Rule 3: Redirect to /dashboard if logged in and accessing the login page
  if (isLoggedIn && pathname === "/login") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next(); // Allow other requests to pass through
}

// Define routes to apply middleware
export const config = {
  matcher: [
    '/',
    '/dashboard/:path*',
    '/management/:path*',
    '/profiles/:path*',
    '/reports/:path*',
    '/admin/:path*',
    '/alarms/:path*',
    '/login'
  ],
};