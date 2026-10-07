import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

// Next.js 16: export the NextAuth-wrapped handler as the named `proxy` export.
// auth(callback) returns a handler compatible with the proxy file convention.
// Avoid wrapping it again — that causes type mismatch with AppRouteHandlerFnContext.
export const proxy = auth((req) => {
  const isLoggedIn = !!req.auth?.user;
  const { pathname } = req.nextUrl;

  const isLoginPage = pathname === "/login";
  const isAuthApi = pathname.startsWith("/api/auth");
  const isCronApi = pathname.startsWith("/api/cron");

  // Allow auth API and cron routes through unconditionally
  if (isAuthApi || isCronApi) {
    return NextResponse.next();
  }

  // If user is logged in and visits /login, redirect to /dashboard
  if (isLoginPage) {
    if (isLoggedIn) {
      return NextResponse.redirect(new URL("/dashboard", req.nextUrl));
    }
    return NextResponse.next();
  }

  // Root path redirect
  if (pathname === "/") {
    if (isLoggedIn) {
      return NextResponse.redirect(new URL("/dashboard", req.nextUrl));
    }
    return NextResponse.redirect(new URL("/login", req.nextUrl));
  }

  // If not logged in and accessing protected routes
  if (!isLoggedIn) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { success: false, error: "Unauthorized access. Please login first." },
        { status: 401 }
      );
    }

    const redirectUrl = new URL("/login", req.nextUrl);
    redirectUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
