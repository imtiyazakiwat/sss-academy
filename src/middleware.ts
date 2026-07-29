import { NextResponse, type NextRequest } from "next/server";

import { LOGIN_PATH, SESSION_COOKIE } from "@/lib/admin/session-cookie";

/**
 * Cheap first gate on the dashboard.
 *
 * This runs on the Edge runtime, where `firebase-admin` cannot run, so it can
 * only check that a session cookie is *present*. It is a redirect for
 * convenience, not a security boundary — `requireAdmin()` on the Node runtime
 * is what actually verifies the cookie, and every admin page and action calls
 * it.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isLogin = pathname === LOGIN_PATH || pathname.startsWith(`${LOGIN_PATH}/`);
  const hasSession = request.cookies.has(SESSION_COOKIE);

  if (!isLogin && !hasSession) {
    const url = request.nextUrl.clone();
    url.pathname = LOGIN_PATH;
    url.search = "";
    // Bounce back to the requested page after a successful sign-in. Relative
    // path only, so this cannot be turned into an open redirect.
    if (pathname !== "/admin") url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (isLogin && hasSession) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin", "/admin/:path*"],
};
