"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { cn } from "@/lib/cn";

/**
 * Sidebar navigation. A client component only because it needs `usePathname`
 * for the active state and a disclosure for the narrow layout — the session it
 * displays is resolved on the server and passed in as plain strings.
 */
export interface NavItem {
  href: string;
  label: string;
  /** Rendered beside the label, e.g. the count of new enquiries. */
  badge?: number;
}

export interface NavGroup {
  heading: string;
  items: NavItem[];
}

export function AdminNav({
  groups,
  user,
  signOut,
}: {
  groups: NavGroup[];
  user: { name: string; email: string; role: string };
  signOut: React.ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isActive = (href: string) =>
    href === "/admin"
      ? pathname === "/admin"
      : pathname === href || pathname.startsWith(`${href}/`);

  const nav = (
    <nav aria-label="Dashboard" className="flex flex-col gap-6">
      {groups.map((group) => (
        <div key={group.heading}>
          <p className="px-3 text-[0.625rem] font-semibold tracking-[0.14em] text-ink-400 uppercase">
            {group.heading}
          </p>
          <ul className="mt-2 flex flex-col gap-0.5">
            {group.items.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={isActive(item.href) ? "page" : undefined}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-150",
                    isActive(item.href)
                      ? "bg-navy-900 text-white"
                      : "text-ink-700 hover:bg-ink-100 hover:text-navy-900",
                  )}
                >
                  <span>{item.label}</span>
                  {item.badge ? (
                    <span
                      className={cn(
                        "min-w-5 rounded-full px-1.5 py-0.5 text-center text-[0.625rem] font-semibold",
                        isActive(item.href)
                          ? "bg-white/20 text-white"
                          : "bg-ember-100 text-ember-800",
                      )}
                    >
                      {item.badge > 99 ? "99+" : item.badge}
                    </span>
                  ) : null}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );

  const footer = (
    <div className="border-t border-ink-200 pt-4">
      <p className="truncate px-3 text-sm font-semibold text-navy-900">
        {user.name}
      </p>
      <p className="truncate px-3 text-xs text-ink-500">{user.email}</p>
      <p className="mt-0.5 px-3 text-[0.625rem] font-semibold tracking-wide text-ink-400 uppercase">
        {user.role}
      </p>
      <div className="mt-3 px-3">{signOut}</div>
    </div>
  );

  return (
    <>
      {/* Narrow layout: a disclosure above the content rather than an overlay
          drawer. Cheaper, and the dashboard is a two-column list-and-detail
          tool where a full-screen drawer buys nothing. */}
      <div className="border-b border-ink-200 bg-[#fffdf8] px-4 py-3 lg:hidden">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="admin-nav-panel"
          className="flex items-center gap-2 rounded-lg border border-ink-200 px-3 py-2 text-sm font-medium text-navy-900"
        >
          <MenuIcon />
          Menu
        </button>
        {open ? (
          <div
            id="admin-nav-panel"
            className="mt-3 flex flex-col gap-5 rounded-xl border border-ink-200 bg-white p-3"
          >
            {nav}
            {footer}
          </div>
        ) : null}
      </div>

      <aside className="hidden w-64 shrink-0 flex-col justify-between border-r border-ink-200 bg-[#fffdf8] p-4 lg:sticky lg:top-0 lg:flex lg:h-screen">
        <div className="flex flex-col gap-6 overflow-y-auto">
          <Link
            href="/admin"
            className="px-3 text-[0.9375rem] font-semibold tracking-[-0.02em] text-navy-950"
          >
            SSS Academy
            <span className="mt-0.5 block text-[0.625rem] font-medium tracking-[0.14em] text-ink-500 uppercase">
              Dashboard
            </span>
          </Link>
          {nav}
        </div>
        {footer}
      </aside>
    </>
  );
}

function MenuIcon() {
  return (
    <svg viewBox="0 0 16 16" className="size-4" aria-hidden="true">
      <path
        d="M2 4h12M2 8h12M2 12h12"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}
