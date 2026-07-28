import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

import { Reveal } from "@/components/motion/Reveal";
import { Container } from "@/components/ui/Section";
import { cn } from "@/lib/cn";

/**
 * Interior-page hero built around a pre-rendered 3D scene. The artwork already
 * carries the right-hand composition, so this component only owns the copy
 * column: on large screens the image becomes the section background (anchored
 * right so the scene stays in frame), and below `lg` it stacks under the copy.
 */
export function ArtHero({
  eyebrow,
  title,
  description,
  image,
  imageAlt,
  breadcrumb,
  cta,
  surfaceClassName = "bg-[#f5f1e8]",
  objectPosition = "object-[right_65%]",
  scrim = true,
}: {
  eyebrow: string;
  title: ReactNode;
  description?: ReactNode;
  image: string;
  imageAlt: string;
  breadcrumb?: { name: string; href: string }[];
  cta?: { label: string; href: string };
  /** Background colour of the section, matched to the artwork's flat area. */
  surfaceClassName?: string;
  objectPosition?: string;
  /** Parchment wash over the copy column. Turn off when the art is light. */
  scrim?: boolean;
}) {
  return (
    <section
      className={cn(
        "relative isolate overflow-hidden border-b border-[#173f35]/10",
        surfaceClassName,
      )}
    >
      {/* Desktop: the artwork is the section background. */}
      <div aria-hidden="true" className="absolute inset-0 hidden lg:block">
        <Image
          src={image}
          alt=""
          fill
          priority
          sizes="100vw"
          className={cn("object-cover", objectPosition)}
        />
        {scrim ? (
          <div className="absolute inset-0 bg-gradient-to-r from-[#f5f1e8] via-[#f5f1e8]/75 via-38% to-transparent" />
        ) : null}
      </div>

      <Container className="relative">
        <div className="grid items-center gap-10 pt-8 pb-14 sm:pt-10 lg:min-h-[min(calc(100svh-var(--header-h)),44rem)] lg:grid-cols-2 lg:gap-0 lg:pt-0 lg:pb-0">
          <div className="lg:py-24">
            {breadcrumb?.length ? (
              <nav aria-label="Breadcrumb" className="mb-9 lg:mb-10">
                <ol className="flex min-w-0 flex-wrap items-center gap-2 text-xs text-navy-700">
                  <li>
                    <Link href="/" className="transition-colors hover:text-navy-900">
                      Home
                    </Link>
                  </li>
                  {breadcrumb.map((crumb, i) => (
                    <li key={crumb.href} className="flex min-w-0 items-center gap-2">
                      <span aria-hidden="true" className="text-navy-900/40">
                        /
                      </span>
                      {i === breadcrumb.length - 1 ? (
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

            <Reveal>
              <p className="text-eyebrow flex items-center gap-3 text-navy-800 uppercase">
                <span aria-hidden="true" className="h-px w-7 bg-navy-900/45" />
                {eyebrow}
              </p>

              <h1 className="mt-6 max-w-[15ch] text-[clamp(2.75rem,5.6vw,4.5rem)] leading-[0.95] font-bold tracking-[-0.045em] text-navy-900">
                {title}
              </h1>

              {description ? (
                <p className="mt-7 max-w-md text-base leading-8 font-medium text-navy-800 sm:text-[1.0625rem]">
                  {description}
                </p>
              ) : null}

              {cta ? (
                <Link
                  href={cta.href}
                  className="group mt-9 inline-flex h-13 items-center gap-3 rounded-full bg-navy-900 pr-6 pl-7 text-base font-medium text-white shadow-[0_10px_30px_-12px_rgb(23_63_53/0.45)] transition-[transform,background-color,box-shadow] duration-200 ease-[var(--ease-out-expo)] hover:-translate-y-0.5 hover:bg-navy-950 hover:shadow-[0_16px_40px_-14px_rgb(23_63_53/0.5)]"
                >
                  {cta.label}
                  <svg
                    viewBox="0 0 16 16"
                    fill="none"
                    aria-hidden="true"
                    className="size-4 transition-transform duration-200 ease-[var(--ease-out-expo)] group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                  >
                    <path
                      d="M4.5 11.5 11.5 4.5M6 4.5h5.5V10"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </Link>
              ) : null}
            </Reveal>
          </div>
        </div>

        {/* Mobile / tablet: the same artwork, stacked under the copy. */}
        <div className="relative -mx-5 pb-2 sm:-mx-8 lg:hidden">
          <Image
            src={image}
            alt={imageAlt}
            width={1536}
            height={1024}
            priority
            sizes="100vw"
            className="w-full object-cover"
          />
        </div>
      </Container>
    </section>
  );
}
