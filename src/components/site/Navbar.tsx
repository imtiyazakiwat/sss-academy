"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import { Logo } from "@/components/site/Logo";
import { MenuToggleIcon } from "@/components/ui/MenuToggleIcon";
import { ArrowIcon, ButtonLink } from "@/components/ui/Button";
import { useScroll } from "@/components/ui/use-scroll";
import {
  trackLabels,
  type Course,
  type CourseTrack,
} from "@/content/courses";
import { contact } from "@/content/site";
import { ENQUIRY_HREF, focusEnquiryField } from "@/lib/anchors";
import { cn } from "@/lib/cn";

const links: { label: string; href: string; hasMenu?: boolean }[] = [
  { label: "Home", href: "/" },
  { label: "Courses", href: "/courses", hasMenu: true },
  { label: "Playground", href: "/playground" },
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

/* Ghost-button styling for nav links, mirroring the reference's
   `buttonVariants({ variant: 'ghost' })`. Note that this project's `cn` is a
   plain class joiner with no conflict resolution, so the idle and active states
   are kept mutually exclusive rather than layered — a later class would not
   reliably win over an earlier one. */
const deskLink =
  "inline-flex h-9 items-center justify-center gap-1 rounded-md px-2.5 text-sm font-medium whitespace-nowrap transition-colors duration-200";
const deskLinkIdle = "text-ink-600 hover:bg-navy-50 hover:text-navy-900";
const deskLinkActive = "bg-navy-50 text-navy-900";

const mobileRow =
  "flex h-11 w-full items-center justify-start rounded-md px-4 text-sm font-medium transition-colors duration-200";

/**
 * `courses` arrives as a prop from the root layout — the catalogue is loaded on
 * the server now, and this component runs in the browser. `trackLabels` is a
 * static helper with no data dependency, so it stays a direct import.
 */
export function Navbar({ courses }: { courses: Course[] }) {
  const pathname = usePathname();
  const scrolled = useScroll(10);

  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  const menuRef = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Closing on link click (rather than reacting to a pathname change) avoids a
  // cascading render and also closes correctly when the target is the current page.
  const close = useCallback(() => {
    setOpen(false);
    setExpanded(null);
    setMenuOpen(false);
  }, []);

  // Lock body scroll while the mobile panel is open.
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    if (!open) setExpanded(null);
  }, [open]);

  // Drop the panel once the viewport reaches the desktop nav.
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const handler = (e: MediaQueryListEvent | MediaQueryList) => {
      if (e.matches) setOpen(false);
    };
    handler(mq);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

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

  // The App Router changes a same-page hash with pushState, which does not fire
  // hashchange — so when we are already on /contact, focus the field here. A
  // frame of delay lets the mobile panel close and release the scroll lock.
  const onEnrollClick = () => {
    if (pathname !== "/contact") return;
    requestAnimationFrame(() => focusEnquiryField());
  };

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

  const isActive = (href: string) =>
    href === "/"
      ? pathname === "/"
      : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <>
      {/* Fixed band of constant height. The pill inside it resizes on scroll,
          but `--header-h` must stay stable: the playground shell and both hero
          sections subtract it to compute their own height. The band ignores the
          pointer so it never swallows clicks on the page beneath it. */}
      <header
        className="pointer-events-none fixed inset-x-0 top-0 z-50 md:px-4"
        style={{ height: "var(--header-h)" }}
      >
        <div
          className={cn(
            "pointer-events-auto mx-auto w-full border-b transition-all duration-300 ease-out md:rounded-xl md:border",
            open
              ? "border-ink-200 bg-[#fffdf8]/95 backdrop-blur-lg md:max-w-5xl"
              : scrolled
                ? // /90 rather than a lighter wash: page content scrolls behind
                  // the floating pill, and a thin backdrop let it show through.
                  "border-ink-200 bg-[#fffdf8]/90 shadow-card backdrop-blur-lg md:mt-2 md:max-w-4xl"
                : "border-transparent md:max-w-5xl",
          )}
        >
          {/* Height and padding are deliberately constant. The pill holds a
              40px logo mark beside a two-line wordmark, so a shorter bar leaves
              it touching the edges — and tightening the padding on scroll (as
              the reference does for its small wordmark) puts the CTA hard
              against the border. */}
          <nav
            aria-label="Primary"
            className="flex h-16 w-full items-center justify-between gap-4 px-4 md:px-5"
          >
            {/* min-w-0 lets the wordmark yield first if a font swap makes the
                row wider than the contracted pill, rather than the links
                wrapping. */}
            <Logo className="min-w-0 gap-2.5" />

            {/* Desktop nav */}
            <div className="hidden shrink-0 items-center gap-0.5 lg:flex">
              {links.map((item) => {
                const active = isActive(item.href);

                if (!item.hasMenu) {
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        deskLink,
                        active ? deskLinkActive : deskLinkIdle,
                      )}
                    >
                      {item.label}
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
                        deskLink,
                        active ? deskLinkActive : deskLinkIdle,
                      )}
                    >
                      {item.label}
                      <svg
                        viewBox="0 0 16 16"
                        aria-hidden="true"
                        className={cn(
                          "size-3.5 transition-transform duration-300",
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
                    </Link>

                    <div
                      hidden={!menuOpen}
                      className="absolute top-full left-1/2 w-[42rem] max-w-[calc(100vw-2rem)] -translate-x-1/2 pt-3"
                    >
                      <div className="animate-zoom-in rounded-xl border border-ink-200 bg-[#fffdf8] p-5 shadow-lift">
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
                                      className="block rounded-md px-2 py-1.5 text-sm text-ink-700 transition-colors duration-200 hover:bg-navy-50 hover:text-navy-900"
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
                          className="group mt-4 flex items-center justify-between rounded-md bg-ink-50 px-4 py-3 text-sm font-medium text-navy-950 transition-colors duration-200 hover:bg-navy-50"
                        >
                          View all {courses.length} courses
                          <ArrowIcon />
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}

              <ButtonLink
                href={ENQUIRY_HREF}
                size="sm"
                className="ml-1.5"
                onClick={onEnrollClick}
              >
                Enroll Now
                <ArrowIcon />
              </ButtonLink>
            </div>

            {/* Panel trigger */}
            <button
              type="button"
              onClick={() => setOpen(!open)}
              aria-expanded={open}
              aria-controls="mobile-nav"
              aria-label="Toggle navigation menu"
              className="flex size-9 items-center justify-center rounded-md border border-ink-200 text-navy-900 transition-colors duration-200 hover:bg-navy-50 lg:hidden"
            >
              <MenuToggleIcon open={open} className="size-5" duration={300} />
            </button>
          </nav>
        </div>
      </header>

      {/* Mobile panel. `top-16` tracks the pill's h-16 so the sheet begins
          flush under it, matching the reference's full-bleed sheet. */}
      <div
        id="mobile-nav"
        hidden={!open}
        className="fixed inset-x-0 top-16 bottom-0 z-40 flex flex-col overflow-hidden border-y border-ink-200 bg-[#fffdf8]/95 backdrop-blur-lg lg:hidden"
      >
        <div className="animate-zoom-in flex h-full w-full flex-col justify-between gap-y-2 overflow-y-auto p-4">
          <div className="grid gap-y-1">
            {links.map((item) => {
              const active = isActive(item.href);

              if (!item.hasMenu) {
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={close}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      mobileRow,
                      active
                        ? "bg-navy-50 text-navy-900"
                        : "text-ink-700 hover:bg-navy-50 hover:text-navy-900",
                    )}
                  >
                    {item.label}
                  </Link>
                );
              }

              const isExpanded = expanded === item.label;

              return (
                <div key={item.href}>
                  <button
                    type="button"
                    onClick={() => setExpanded(isExpanded ? null : item.label)}
                    aria-expanded={isExpanded}
                    className={cn(
                      mobileRow,
                      "justify-between",
                      active
                        ? "bg-navy-50 text-navy-900"
                        : "text-ink-700 hover:bg-navy-50 hover:text-navy-900",
                    )}
                  >
                    {item.label}
                    <svg
                      viewBox="0 0 16 16"
                      aria-hidden="true"
                      className={cn(
                        "size-4 text-ink-400 transition-transform duration-300",
                        isExpanded && "rotate-180",
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
                  </button>

                  {isExpanded && (
                    <div className="animate-slide-in-top mt-1 ml-3 grid gap-y-0.5 border-l border-ink-200 pl-3">
                      {grouped.map((group) => (
                        <div key={group.label}>
                          <p className="text-eyebrow px-2 pt-3 pb-1 uppercase text-ink-400">
                            {group.label}
                          </p>
                          {group.items.map((course) => (
                            <Link
                              key={course.slug}
                              href={`/courses/${course.slug}`}
                              onClick={close}
                              className="flex h-10 items-center rounded-md px-2 text-sm text-ink-600 transition-colors duration-200 hover:bg-navy-50 hover:text-navy-900"
                            >
                              {course.title}
                            </Link>
                          ))}
                        </div>
                      ))}

                      <Link
                        href="/courses"
                        onClick={close}
                        className="group mt-2 flex items-center justify-between rounded-md bg-ink-50 px-2 py-2.5 text-sm font-medium text-navy-950 transition-colors duration-200 hover:bg-navy-50"
                      >
                        View all {courses.length} courses
                        <ArrowIcon className="size-4" />
                      </Link>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex flex-col gap-2 pt-2">
            <ButtonLink
              href={ENQUIRY_HREF}
              size="lg"
              className="w-full"
              onClick={() => {
                close();
                onEnrollClick();
              }}
            >
              Enroll Now
              <ArrowIcon />
            </ButtonLink>

            <a
              href={`tel:${contact.phoneHrefs[0]}`}
              onClick={close}
              className="flex h-10 items-center justify-center text-sm text-ink-500 transition-colors duration-200 hover:text-navy-900"
            >
              {contact.phones[0]}
            </a>
          </div>
        </div>
      </div>
    </>
  );
}
