import type { Metadata } from "next";
import Link from "next/link";

import { LoginForm } from "@/app/admin/(auth)/login/LoginForm";
import { Logo } from "@/components/site/Logo";
import { ADMIN_HOME } from "@/lib/admin/session-cookie";
import { isFirebaseConfigured } from "@/lib/firebase";

export const metadata: Metadata = {
  title: "Sign in",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/**
 * Sits in the `(auth)` route group so it inherits the admin chrome reset but
 * not the `requireAdmin()` gate in `(dashboard)/layout.tsx`. Guarding the login
 * page would redirect it to itself forever.
 */
export default async function AdminLoginPage(
  props: PageProps<"/admin/login">,
) {
  const params = await props.searchParams;
  const raw = params.next;
  const next = typeof raw === "string" && raw.startsWith("/admin") ? raw : ADMIN_HOME;
  const configured = isFirebaseConfigured();

  return (
    <div className="flex min-h-[calc(100vh-var(--header-h))] items-center justify-center bg-ink-50 px-5 py-16">
      <div className="w-full max-w-sm">
        {/* Logo is itself a link to "/" — do not wrap it in another. */}
        <div className="mb-8 flex justify-center">
          <Logo />
        </div>

        <div className="rounded-2xl border border-ink-200 bg-[#fffdf8] p-6 shadow-card sm:p-8">
          <h1 className="text-title text-navy-950">Staff sign in</h1>
          <p className="mt-1.5 text-sm leading-6 text-ink-600">
            Enquiries and site content. Accounts are created by the academy — there
            is no sign-up.
          </p>

          {!configured ? (
            <div className="mt-5 border-l-4 border-ember-600 bg-ember-50 px-4 py-3 text-sm leading-6 text-ember-900">
              Firebase is not configured on this deployment, so sign-in is
              unavailable. Set <code className="font-mono">FIREBASE_SERVICE_ACCOUNT_KEY</code>{" "}
              and <code className="font-mono">FIREBASE_WEB_API_KEY</code>.
            </div>
          ) : null}

          <div className="mt-6">
            <LoginForm next={next} />
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-ink-500">
          <Link
            href="/"
            className="font-medium text-ink-600 underline decoration-ink-300 underline-offset-4 hover:text-navy-900"
          >
            Back to the website
          </Link>
        </p>
      </div>
    </div>
  );
}
