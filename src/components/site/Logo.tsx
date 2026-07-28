import Image from "next/image";
import Link from "next/link";

import { cn } from "@/lib/cn";

/**
 * Institute mark plus a typographic wordmark.
 *
 * The mark is the supplied 1080x1080 raster, served through next/image so it is
 * resized and re-encoded to avif/webp at the 40px box it actually occupies. The
 * source is a JPEG (no alpha), so the tile keeps a white backdrop and
 * object-contain to avoid cropping the artwork.
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
        className={cn(
          "relative flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white shadow-[0_6px_16px_-6px_rgb(23_63_53/0.35)]",
          tone === "dark" ? "ring-1 ring-white/15" : "ring-1 ring-ink-200",
        )}
      >
        <Image
          src="/img/logo.jpeg"
          alt=""
          width={80}
          height={80}
          sizes="40px"
          priority
          className="size-full object-contain"
        />
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
