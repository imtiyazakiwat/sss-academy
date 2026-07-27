import Link from "next/link";

import { cn } from "@/lib/cn";

/**
 * Typographic wordmark rather than the legacy raster logo.
 *
 * The original logo.png was a 718 KB bitmap with baked-in text — it went soft at
 * small sizes and cost more than the whole CSS bundle. The mark keeps the
 * forest body and the layered-S motif. The raster still ships as the favicon
 * and OG image.
 */
export function Logo({
  tone = "light",
  className,
}: {
  tone?: "light" | "dark";
  className?: string;
}) {
  return (
    <Link
      href="/"
      className={cn("group flex items-center gap-3", className)}
      // No aria-label: the visible wordmark already names the link, and a label
      // that omits the visible text creates a name mismatch for speech input.
    >
      {/* Decorative mark — the wordmark beside it carries the accessible name */}
      <span
        aria-hidden="true"
        className="relative flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-navy-950 shadow-[0_6px_16px_-6px_rgb(23_63_53/0.5)]"
      >
        <span className="absolute inset-0 bg-gradient-to-br from-navy-800 via-navy-950 to-navy-950" />
        <span className="absolute -right-2.5 -bottom-2.5 size-6 rounded-full bg-violet-500/70 blur-[7px] transition-transform duration-500 ease-[var(--ease-out-expo)] group-hover:scale-150" />
        <svg viewBox="0 0 24 24" className="relative size-5.5" fill="none">
          <path
            d="M17.5 7.2c-1-1.6-2.9-2.6-5-2.6-2.6 0-4.6 1.5-4.6 3.6 0 2 1.6 3 4.4 3.6"
            stroke="white"
            strokeWidth="2.1"
            strokeLinecap="round"
          />
          <path
            d="M6.5 16.8c1 1.6 2.9 2.6 5 2.6 2.6 0 4.6-1.5 4.6-3.6 0-2-1.6-3-4.4-3.6"
            stroke="var(--color-violet-300)"
            strokeWidth="2.1"
            strokeLinecap="round"
          />
        </svg>
      </span>

      <span className="flex flex-col leading-none">
        <span
          className={cn(
            "text-[1.125rem] font-semibold tracking-[-0.025em]",
            tone === "dark" ? "text-white" : "text-navy-950",
          )}
        >
          SSS Academy
        </span>
        <span
          className={cn(
            "mt-1 text-[0.6875rem] font-medium tracking-[0.01em]",
            tone === "dark" ? "text-navy-300" : "text-ink-500",
          )}
        >
          Industry Ready Learning
        </span>
      </span>
    </Link>
  );
}
