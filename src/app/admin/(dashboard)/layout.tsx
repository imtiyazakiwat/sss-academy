import type { ReactNode } from "react";

import { logoutAction } from "@/app/admin/_actions/auth";
import { AdminNav, type NavGroup } from "@/app/admin/(dashboard)/AdminNav";
import { requireAdmin } from "@/lib/admin/auth";
import { getEnquiryStats } from "@/lib/cms/enquiries";

/**
 * The guarded shell.
 *
 * `requireAdmin()` here covers every page nested under it, but it is not a
 * substitute for the same call inside each server action — actions are their own
 * entry points and are reachable without ever rendering this layout.
 */
export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await requireAdmin();

  // Drives the "new" badge in the sidebar. One read, shared with the overview
  // page in the same render pass.
  const { counts } = await getEnquiryStats();

  const groups: NavGroup[] = [
    {
      heading: "Inbox",
      items: [
        { href: "/admin", label: "Overview" },
        { href: "/admin/enquiries", label: "Enquiries", badge: counts.new },
      ],
    },
    {
      heading: "Content",
      items: [
        { href: "/admin/notices", label: "Notices" },
        { href: "/admin/banners", label: "Banners" },
        { href: "/admin/courses", label: "Courses" },
        { href: "/admin/placements", label: "Placements" },
        { href: "/admin/team", label: "Staff" },
      ],
    },
    {
      heading: "Account",
      items: [{ href: "/admin/audit", label: "Audit log" }],
    },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-ink-50 lg:flex-row">
      <AdminNav
        groups={groups}
        user={{
          name: session.name,
          email: session.email,
          role: session.role,
        }}
        signOut={
          <form action={logoutAction}>
            <button
              type="submit"
              className="w-full rounded-lg border border-ink-200 px-3 py-2 text-sm font-medium text-ink-700 transition-colors duration-150 hover:border-ember-300 hover:bg-ember-50 hover:text-ember-800"
            >
              Sign out
            </button>
          </form>
        }
      />

      <div className="min-w-0 flex-1">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-5 py-8 sm:px-8 sm:py-10">
          {children}
        </div>
      </div>
    </div>
  );
}
