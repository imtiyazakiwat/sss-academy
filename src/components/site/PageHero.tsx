import Link from "next/link";
import type { ReactNode } from "react";

import { Reveal } from "@/components/motion/Reveal";
import { Container, Eyebrow } from "@/components/ui/Section";
import { cn } from "@/lib/cn";

export type PageHeroVariant =
  | "editorial"
  | "catalogue"
  | "proof"
  | "contact"
  | "lab";

const surfaces: Record<PageHeroVariant, string> = {
  editorial: "border-[#173f35]/10 bg-[#f5f1e8]",
  catalogue: "border-[#173f35]/10 bg-[#e3ede5]",
  proof: "border-[#173f35]/15 bg-[#f1dfaa]",
  contact: "border-[#d95d39]/15 bg-[#fae2d8]",
  lab: "border-[#173f35]/10 bg-[#dce9de]",
};

/**
 * Interior-page header with one stable content contract and page-specific art
 * direction. Variants change tone and decoration, not the page layout below.
 */
export function PageHero({
  eyebrow,
  title,
  description,
  breadcrumb,
  aside,
  variant = "editorial",
}: {
  eyebrow: string;
  title: ReactNode;
  description?: ReactNode;
  breadcrumb?: { name: string; href: string }[];
  aside?: ReactNode;
  variant?: PageHeroVariant;
}) {
  return (
    <section
      className={cn(
        "relative isolate overflow-hidden border-b text-navy-950",
        surfaces[variant],
      )}
    >
      <HeroArtwork variant={variant} />

      <Container className="relative pt-8 pb-16 sm:pt-10 sm:pb-20 lg:pb-24">
        {breadcrumb?.length ? (
          <nav aria-label="Breadcrumb">
            <ol className="flex min-w-0 flex-wrap items-center gap-2 text-xs text-ink-500">
              <li>
                <Link
                  href="/"
                  className="transition-colors hover:text-navy-900"
                >
                  Home
                </Link>
              </li>
              {breadcrumb.map((crumb, index) => (
                <li key={crumb.href} className="flex min-w-0 items-center gap-2">
                  <span aria-hidden="true" className="text-ink-400">
                    /
                  </span>
                  {index === breadcrumb.length - 1 ? (
                    <span
                      aria-current="page"
                      className="truncate font-medium text-navy-900"
                    >
                      {crumb.name}
                    </span>
                  ) : (
                    <Link
                      href={crumb.href}
                      className="transition-colors hover:text-navy-900"
                    >
                      {crumb.name}
                    </Link>
                  )}
                </li>
              ))}
            </ol>
          </nav>
        ) : null}

        <div
          className={cn(
            "mt-11 grid gap-11 lg:mt-14 lg:grid-cols-12 lg:gap-14",
            Boolean(aside) && "lg:items-end",
          )}
        >
          <Reveal className={aside ? "lg:col-span-7" : "lg:col-span-9"}>
            <Eyebrow className="text-ember-700">{eyebrow}</Eyebrow>
            <h1 className="mt-5 max-w-4xl text-[clamp(2.75rem,6vw,5.25rem)] leading-[0.96] font-semibold tracking-[-0.055em] text-navy-900">
              {title}
            </h1>
            {description ? (
              <p className="mt-6 max-w-2xl text-base leading-7 text-ink-600 sm:text-lg sm:leading-8">
                {description}
              </p>
            ) : null}
          </Reveal>

          {aside ? (
            <Reveal delay={100} direction="left" className="lg:col-span-5">
              {aside}
            </Reveal>
          ) : (
            <Reveal
              delay={120}
              className="hidden lg:col-span-3 lg:flex lg:justify-end"
            >
              <VariantMark variant={variant} />
            </Reveal>
          )}
        </div>
      </Container>
    </section>
  );
}

function HeroArtwork({ variant }: { variant: PageHeroVariant }) {
  if (variant === "editorial") {
    return (
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute top-0 right-[12%] h-full w-px bg-navy-900/10" />
        <div className="absolute top-20 right-[7%] size-44 rounded-full border border-ember-500/20" />
        <div className="absolute top-28 right-[4%] size-44 rounded-full border border-navy-900/10" />
      </div>
    );
  }

  if (variant === "catalogue") {
    return (
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute inset-y-0 right-0 hidden w-[38%] bg-[#cbdcce] lg:block" />
        <div className="absolute top-0 right-[38%] hidden h-full w-px bg-navy-900/15 lg:block" />
        <div className="absolute -top-10 right-10 size-28 border-[18px] border-[#e7b94d]/70" />
      </div>
    );
  }

  if (variant === "proof") {
    return (
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute top-0 right-0 h-3 w-full bg-[#e7b94d]" />
        <div className="absolute right-[44%] bottom-0 hidden h-[82%] w-px rotate-[18deg] bg-navy-900/15 lg:block" />
        <div className="absolute -right-12 -bottom-20 size-64 rounded-full border-[34px] border-ember-500/15" />
      </div>
    );
  }

  if (variant === "contact") {
    return (
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute top-0 right-0 hidden h-full w-[34%] bg-[#f2c4b2]/55 lg:block" />
        <div className="absolute top-20 right-[9%] hidden h-32 w-44 rounded-[2rem] border border-ember-700/20 lg:block" />
        <div className="absolute top-[12.25rem] right-[15%] hidden size-8 rotate-45 border-r border-b border-ember-700/20 lg:block" />
      </div>
    );
  }

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0">
      <div className="dot-grid absolute inset-0 opacity-45 [mask-image:linear-gradient(to_right,transparent,black_48%,black)]" />
      <div className="absolute top-0 right-0 hidden h-full w-[39%] border-l border-navy-900/10 bg-[#cbdcce]/70 lg:block" />
      <p className="absolute top-16 right-10 hidden font-mono text-7xl font-semibold tracking-[-0.08em] text-navy-900/10 lg:block">
        {">_"}
      </p>
    </div>
  );
}

function VariantMark({ variant }: { variant: PageHeroVariant }) {
  const labels: Record<PageHeroVariant, { number: string; label: string }> = {
    editorial: { number: "01", label: "Our story" },
    catalogue: { number: "11", label: "Career tracks" },
    proof: { number: "23", label: "Published stories" },
    contact: { number: "1:1", label: "Free counselling" },
    lab: { number: "SQL", label: "Run it live" },
  };
  const item = labels[variant];

  return (
    <div className="border-l border-navy-900/20 pl-5 text-right">
      <p className="font-mono text-4xl font-semibold tracking-[-0.05em] text-navy-900">
        {item.number}
      </p>
      <p className="mt-2 text-[0.6875rem] font-semibold tracking-[0.14em] text-ink-500 uppercase">
        {item.label}
      </p>
    </div>
  );
}
