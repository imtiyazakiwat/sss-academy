"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import { Logo } from "@/components/site/Logo";
import { ArrowIcon, ButtonLink } from "@/components/ui/Button";
import { courses, trackLabels, type CourseTrack } from "@/content/courses";
import { contact } from "@/content/site";
import { cn } from "@/lib/cn";

const links: { label: string; href: string; hasMenu?: boolean }[] = [
  { label: "Home", href: "/" },
  { label: "Courses", href: "/courses", hasMenu: true },
  { label: "Placements", href: "/placements" },
  { label: "About Us", href: "/about" },
  { label: "Contact", href: "/contact" },
];

const trackOrder: CourseTrack[] = [
  "data",
  "testing",
  "cloud",
  "programming",
  "bi",
];

export function Navbar() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Closing on link click (rather than reacting to a pathname change) avoids a
  // cascading render and also closes correctly when the target is the current page.
  const close = useCallback(() => {
    setOpen(false);
    setMenuOpen(false);
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Lock body scroll while the mobile drawer is open.
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    const onPointerDown = (e: PointerEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("pointerdown", onPointerDown);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointerdown", onPointerDown);
    };
  }, [close]);

  // Small grace period on mouseleave so the pointer can cross the gap into the panel.
  const scheduleMenuClose = () => {
    closeTimer.current = setTimeout(() => setMenuOpen(false), 140);
  };
  const cancelMenuClose = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
  };

  const grouped = trackOrder
    .map((track) => ({
      label: trackLabels[track],
      items: courses.filter((c) => c.track === track),
    }))
    .filter((g) => g.items.length > 0);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 bg-white transition-[box-shadow,border-color] duration-300",
        scrolled || open
          ? "border-b border-ink-200 shadow-[0_1px_20px_-8px_rgb(13_26_49/0.18)]"
          : "border-b border-ink-100",
      )}
      style={{ height: "var(--header-h)" }}
    >
      <div className="mx-auto flex h-full max-w-7xl items-center justify-between gap-6 px-5 sm:px-8">
        <Logo />

        <nav
          aria-label="Primary"
          className="hidden items-center gap-0.5 lg:flex"
        >
          {links.map((item) => {
            const active =
              item.href === "/"
                ? pathname === "/"
                : pathname === item.href || pathname.startsWith(`${item.href}/`);

            if (!item.hasMenu) {
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "relative px-3.5 py-2 text-[0.9375rem] font-medium transition-colors duration-200",
                    active ? "text-navy-950" : "text-ink-600 hover:text-navy-950",
                  )}
                >
                  {item.label}
                  {active ? (
                    <span
                      aria-hidden="true"
                      className="absolute inset-x-3.5 -bottom-1 h-[3px] rounded-full bg-ember-500"
                    />
                  ) : null}
                </Link>
              );
            }

            return (
              <div
                key={item.href}
                ref={menuRef}
                className="relative"
                onMouseEnter={() => {
                  cancelMenuClose();
                  setMenuOpen(true);
                }}
                onMouseLeave={scheduleMenuClose}
              >
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  aria-expanded={menuOpen}
                  onClick={() => setMenuOpen(false)}
                  className={cn(
                    "relative flex items-center gap-1.5 px-3.5 py-2 text-[0.9375rem] font-medium transition-colors duration-200",
                    active ? "text-navy-950" : "text-ink-600 hover:text-navy-950",
                  )}
                >
                  {item.label}
                  <svg
                    viewBox="0 0 16 16"
                    aria-hidden="true"
                    className={cn(
                      "size-3.5 transition-transform duration-200",
                      menuOpen && "rotate-180",
                    )}
                  >
                    <path
                      d="M4 6.5 8 10.5 12 6.5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  {active ? (
                    <span
                      aria-hidden="true"
                      className="absolute inset-x-3.5 -bottom-1 h-[3px] rounded-full bg-ember-500"
                    />
                  ) : null}
                </Link>

                <div
                  hidden={!menuOpen}
                  className="absolute top-full left-1/2 w-[42rem] -translate-x-1/2 pt-3"
                >
                  <div className="rounded-2xl border border-ink-200 bg-white p-5 shadow-lift">
                    <div className="grid grid-cols-3 gap-x-6 gap-y-5">
                      {grouped.map((group) => (
                        <div key={group.label}>
                          <p className="text-eyebrow uppercase text-ink-400">
                            {group.label}
                          </p>
                          <ul className="mt-2.5 space-y-0.5">
                            {group.items.map((course) => (
                              <li key={course.slug}>
                                <Link
                                  href={`/courses/${course.slug}`}
                                  onClick={close}
                                  className="block rounded-lg px-2 py-1.5 text-sm text-ink-700 transition-colors hover:bg-violet-50 hover:text-violet-700"
                                >
                                  {course.title}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                    <Link
                      href="/courses"
                      onClick={close}
                      className="mt-4 flex items-center justify-between rounded-xl bg-ink-50 px-4 py-3 text-sm font-medium text-navy-950 transition-colors hover:bg-violet-50"
                    >
                      View all {courses.length} courses
                      <ArrowIcon />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </nav>

        <div className="hidden items-center gap-5 lg:flex">
          <a
            href={`tel:${contact.phoneHrefs[0]}`}
            className="flex items-center gap-2 text-[0.9375rem] font-medium text-navy-900 transition-colors hover:text-violet-700"
          >
            <svg viewBox="0 0 18 18" aria-hidden="true" className="size-4">
              <path
                d="M6.2 2.6 7.6 5.3 6.1 6.9c.6 1.6 2.4 3.4 4 4l1.6-1.5 2.7 1.4-.4 2.3c-.2.7-.9 1.1-1.6 1C8.2 13.4 4.6 9.8 3.5 5.2c-.2-.7.3-1.4 1-1.6l1.7-.4Z"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinejoin="round"
              />
            </svg>
            {contact.phones[0]}
          </a>
          <ButtonLink href="/contact" size="md">
            Enroll Now
            <ArrowIcon />
          </ButtonLink>
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="mobile-nav"
          className="relative flex size-10 items-center justify-center rounded-xl border border-ink-200 lg:hidden"
        >
          <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
          <span aria-hidden="true" className="relative block h-3 w-4.5">
            <span
              className={cn(
                "absolute left-0 h-0.5 w-full rounded-full bg-navy-900 transition-all duration-300 ease-[var(--ease-out-expo)]",
                open ? "top-1.5 rotate-45" : "top-0",
              )}
            />
            <span
              className={cn(
                "absolute left-0 h-0.5 w-full rounded-full bg-navy-900 transition-all duration-300 ease-[var(--ease-out-expo)]",
                open ? "top-1.5 -rotate-45" : "top-3",
              )}
            />
          </span>
        </button>
      </div>

      {/* Mobile drawer */}
      <div
        id="mobile-nav"
        hidden={!open}
        className="lg:hidden"
        style={{ height: open ? "calc(100dvh - var(--header-h))" : 0 }}
      >
        <div className="flex h-full flex-col justify-between overflow-y-auto border-t border-ink-200 bg-white px-5 pt-5 pb-8">
          <nav aria-label="Mobile" className="flex flex-col">
            {links.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={close}
                className="flex items-center justify-between border-b border-ink-100 py-4 text-xl font-semibold tracking-[-0.02em] text-navy-950"
              >
                {item.label}
                <ArrowIcon className="size-5 text-ink-300" />
              </Link>
            ))}
          </nav>

          {/* Clicks bubble up from either CTA, so the drawer closes on both */}
          <div className="mt-8 space-y-3" onClick={close}>
            <ButtonLink href="/contact" size="lg" className="w-full">
              Enroll Now
              <ArrowIcon />
            </ButtonLink>
            <ButtonLink
              href={`tel:${contact.phoneHrefs[0]}`}
              variant="ghost"
              size="lg"
              className="w-full"
            >
              Call {contact.phones[0]}
            </ButtonLink>
          </div>
        </div>
      </div>
    </header>
  );
}
