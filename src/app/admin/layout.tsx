import type { Metadata } from "next";
import type { ReactNode } from "react";

/**
 * Outermost admin wrapper. Holds nothing that requires a session, so the login
 * page can live under it — the guarded shell is the `(dashboard)` route group
 * inside this one.
 *
 * `data-admin-shell` is what stands down the public chrome (navbar, notice bar,
 * footer) that the root layout renders for every route. Same mechanism the
 * playground uses; see the rules at the end of `globals.css`.
 */
export const metadata: Metadata = {
  title: "Admin",
  // Overrides the root layout's index/follow. Paired with a Disallow in
  // robots.ts — belt and braces, since a stray inbound link would otherwise be
  // enough to get the login page indexed.
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: { index: false, follow: false },
  },
};

/** Nothing in the dashboard may be cached or shared between admins. */
export const dynamic = "force-dynamic";

export default function AdminRootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div data-admin-shell="" className="min-h-[calc(100vh-var(--header-h))]">
      {children}
    </div>
  );
}
