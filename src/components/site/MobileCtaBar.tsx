"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { ArrowIcon, ButtonLink } from "@/components/ui/Button";
import { contact } from "@/content/site";
import { cn } from "@/lib/cn";

/**
 * Persistent mobile conversion bar.
 *
 * Appears only after the visitor has shown intent by scrolling past the hero,
 * and stays out of the way on /contact where the form is already the page.
 */
export function MobileCtaBar() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 700);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (pathname === "/contact") return null;

  return (
    <div
      data-mobile-cta=""
      className={cn(
        "fixed inset-x-0 bottom-0 z-40 border-t border-ink-200 bg-white/90 px-4 pt-3 backdrop-blur-xl transition-transform duration-400 ease-[var(--ease-out-expo)] lg:hidden",
        visible ? "translate-y-0" : "translate-y-full",
      )}
      style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
      aria-hidden={!visible}
    >
      <div className="flex gap-2.5">
        <ButtonLink
          href={`tel:${contact.phoneHrefs[0]}`}
          variant="ghost"
          className="flex-1"
          tabIndex={visible ? undefined : -1}
        >
          Call now
        </ButtonLink>
        <ButtonLink
          href="/contact"
          className="flex-[1.4]"
          tabIndex={visible ? undefined : -1}
        >
          Free counselling
          <ArrowIcon />
        </ButtonLink>
      </div>
    </div>
  );
}
