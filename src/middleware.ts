import { NextResponse, type NextRequest } from "next/server";

import { LOGIN_PATH, SESSION_COOKIE } from "@/lib/admin/session-cookie";

/**
 * Middleware for the admin dashboard.
 *
 * Two jobs:
 * 1. Redirect unauthenticated visitors to the login page (convenience gate —
 *    `requireAdmin()` on the Node runtime is the actual security boundary).
 * 2. Generate a per-request nonce and set a strict Content-Security-Policy
 *    header so the admin surface has XSS protection without relying on
 *    'unsafe-inline' or 'unsafe-eval'.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isLogin =
    pathname === LOGIN_PATH || pathname.startsWith(`${LOGIN_PATH}/`);
  const hasSession = request.cookies.has(SESSION_COOKIE);

  if (!isLogin && !hasSession) {
    const url = request.nextUrl.clone();
    url.pathname = LOGIN_PATH;
    url.search = "";
    if (pathname !== "/admin") url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (isLogin && hasSession) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin";
    url.search = "";
    return NextResponse.redirect(url);
  }

  // Generate a nonce for CSP. Next.js App Router uses inline scripts for
  // hydration/RSC payload — a nonce lets us allow those without 'unsafe-inline'.
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");

  const csp = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`,
    `style-src 'self' 'nonce-${nonce}'`,
    "img-src 'self' https: data:",
    "font-src 'self'",
    "connect-src 'self' https://identitytoolkit.googleapis.com https://firebasestorage.googleapis.com",
    "frame-ancestors 'none'",
  ].join("; ");

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });

  response.headers.set("Content-Security-Policy", csp);

  return response;
}

export const config = {
  matcher: ["/admin", "/admin/:path*"],
};
