import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost" | "onDark";
type Size = "sm" | "md" | "lg";

const base =
  "group relative inline-flex items-center justify-center gap-2 rounded-full font-medium whitespace-nowrap transition-[transform,box-shadow,background-color,color] duration-200 ease-[var(--ease-out-expo)] active:translate-y-px disabled:pointer-events-none disabled:opacity-55";

const variants: Record<Variant, string> = {
  // The single highest-intent action. Ember, so it never competes with navy UI.
  // Uses ember-600 rather than the raw brand orange: white on #f26522 is only
  // 3.15:1, which fails AA at button label sizes. The glow keeps the brand
  // orange visible without putting text on it.
  primary:
    "bg-ember-600 text-white shadow-[0_10px_30px_-10px_rgb(242_101_34/0.6)] hover:bg-ember-700 hover:-translate-y-0.5 hover:shadow-[0_16px_40px_-12px_rgb(242_101_34/0.65)]",
  secondary:
    "bg-navy-900 text-white hover:bg-navy-800 hover:-translate-y-0.5 hover:shadow-lift",
  ghost:
    "border border-ink-200 bg-white/70 text-navy-900 backdrop-blur hover:border-navy-300 hover:bg-white hover:-translate-y-0.5 hover:shadow-card",
  onDark:
    "border border-white/25 bg-white/10 text-white backdrop-blur hover:border-white/40 hover:bg-white/20 hover:-translate-y-0.5",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-4 text-sm",
  md: "h-11 px-5 text-[0.9375rem]",
  lg: "h-13 px-7 text-base",
};

interface CommonProps {
  variant?: Variant;
  size?: Size;
  className?: string;
  children: ReactNode;
}

export function Button({
  variant = "primary",
  size = "md",
  className,
  children,
  ...props
}: CommonProps & Omit<ComponentProps<"button">, "className" | "children">) {
  return (
    <button
      className={cn(base, variants[variant], sizes[size], className)}
      {...props}
    >
      {children}
    </button>
  );
}

export function ButtonLink({
  variant = "primary",
  size = "md",
  className,
  children,
  href,
  ...props
}: CommonProps & Omit<ComponentProps<typeof Link>, "className" | "children">) {
  const external = typeof href === "string" && /^(https?:|tel:|mailto:)/.test(href);

  if (external) {
    return (
      <a
        href={href}
        className={cn(base, variants[variant], sizes[size], className)}
        {...(href.startsWith("http")
          ? { target: "_blank", rel: "noopener noreferrer" }
          : {})}
      >
        {children}
      </a>
    );
  }

  return (
    <Link
      href={href}
      className={cn(base, variants[variant], sizes[size], className)}
      {...props}
    >
      {children}
    </Link>
  );
}

/** Right-pointing chevron that nudges on hover. Signals forward motion on CTAs. */
export function ArrowIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
      className={cn(
        "size-4 transition-transform duration-200 ease-[var(--ease-out-expo)] group-hover:translate-x-0.5",
        className,
      )}
    >
      <path
        d="M6 3.5 10.5 8 6 12.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
