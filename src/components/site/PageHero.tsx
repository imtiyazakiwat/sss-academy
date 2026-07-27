import Link from "next/link";
import type { ReactNode } from "react";

import { Reveal } from "@/components/motion/Reveal";
import { Container, Eyebrow } from "@/components/ui/Section";

/**
 * Shared interior-page header. Dark navy so every page opens with the same
 * visual weight as the homepage hero and the fixed navbar always has contrast
 * to sit against.
 */
export function PageHero({
  eyebrow,
  title,
  description,
  breadcrumb,
  aside,
}: {
  eyebrow: string;
  title: ReactNode;
  description?: ReactNode;
  breadcrumb?: { name: string; href: string }[];
  aside?: ReactNode;
}) {
  return (
    <section className="relative overflow-hidden bg-navy-950 pt-14 pb-16 text-white sm:pt-20 sm:pb-20">
      <div
        aria-hidden="true"
        className="grid-lines-dark pointer-events-none absolute inset-0 opacity-60"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-32 right-0 size-[26rem] rounded-full bg-ember-500/15 blur-[110px]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-40 -left-20 size-[24rem] rounded-full bg-navy-500/25 blur-[110px]"
      />

      <Container className="relative">
        {breadcrumb?.length ? (
          <nav aria-label="Breadcrumb" className="mb-7">
            <ol className="flex flex-wrap items-center gap-2 text-xs text-navy-400">
              <li>
                <Link href="/" className="transition-colors hover:text-white">
                  Home
                </Link>
              </li>
              {breadcrumb.map((crumb, i) => (
                <li key={crumb.href} className="flex items-center gap-2">
                  <span aria-hidden="true">/</span>
                  {i === breadcrumb.length - 1 ? (
                    <span aria-current="page" className="text-navy-200">
                      {crumb.name}
                    </span>
                  ) : (
                    <Link
                      href={crumb.href}
                      className="transition-colors hover:text-white"
                    >
                      {crumb.name}
                    </Link>
                  )}
                </li>
              ))}
            </ol>
          </nav>
        ) : null}

        <div className="grid gap-10 lg:grid-cols-12 lg:items-end">
          <Reveal className="lg:col-span-7">
            <Eyebrow tone="dark">{eyebrow}</Eyebrow>
            <h1 className="text-headline sm:text-display mt-4 text-white">
              {title}
            </h1>
            {description ? (
              <p className="mt-5 max-w-2xl text-lg leading-relaxed text-navy-200">
                {description}
              </p>
            ) : null}
          </Reveal>

          {aside ? (
            <Reveal delay={120} className="lg:col-span-5">
              {aside}
            </Reveal>
          ) : null}
        </div>
      </Container>
    </section>
  );
}
