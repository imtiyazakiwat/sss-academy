import Image from "next/image";
import Link from "next/link";

import { Reveal } from "@/components/motion/Reveal";

/**
 * Art-directed placements header.
 *
 * The background is a single rendered scene (`placements-hero.webp`, a 1490×920
 * crop of the source render) that already contains the blank card slab. From
 * `lg` up the section locks to the artwork's aspect ratio and becomes a
 * container-query context, so every position and type size is expressed in
 * `cqw`/percentages and the composition scales as one piece — the card content
 * always lands exactly on the painted slab. `min()` caps stop type from growing
 * absurdly past ~1700px.
 *
 * Below `lg` the artwork drops back to a cover background, the copy returns to
 * normal flow with rem type, and the card paints its own surface.
 */
export function PlacementsHero({
  eyebrow,
  breadcrumbLabel,
  themes,
  footnote,
}: {
  eyebrow: string;
  breadcrumbLabel: string;
  themes: { title: string; body: string }[];
  footnote: string;
}) {
  return (
    <section className="relative isolate overflow-hidden bg-[#f9f2ec] text-navy-950">
      <div className="@container relative w-full lg:aspect-[1490/920]">
        <Image
          src="/img/placements-hero.webp"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-[22%_50%] lg:object-[50%_50%]"
        />

        {/* Keeps small-screen copy legible where the scene is busiest. */}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[#f7ead2]/65 lg:hidden"
        />

        {/* The render's own floor is a touch warmer than the page; fade it out. */}
        <div
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 h-[9%] bg-gradient-to-b from-transparent to-[#fffdf8]"
        />

        <div className="relative px-5 pt-7 pb-14 sm:px-8 lg:absolute lg:inset-0 lg:p-0">
          <nav
            aria-label="Breadcrumb"
            className="lg:absolute lg:top-[9.4%] lg:left-[13.8%]"
          >
            <ol className="flex min-w-0 flex-wrap items-center gap-2 text-xs text-ink-500 lg:gap-[0.6cqw] lg:text-[min(1.07cqw,18px)]">
              <li>
                <Link href="/" className="transition-colors hover:text-navy-900">
                  Home
                </Link>
              </li>
              <li className="flex min-w-0 items-center gap-2 lg:gap-[0.6cqw]">
                <span aria-hidden="true" className="text-ink-400">
                  /
                </span>
                <span aria-current="page" className="truncate font-medium text-navy-900">
                  {breadcrumbLabel}
                </span>
              </li>
            </ol>
          </nav>

          <Reveal className="mt-9 lg:absolute lg:top-[17%] lg:left-[13.8%] lg:mt-0 lg:w-[40%]">
            <p className="text-eyebrow flex items-center gap-2.5 uppercase text-ember-700 lg:gap-[1cqw] lg:text-[min(1.07cqw,18px)] lg:tracking-[0.14em]">
              <span
                aria-hidden="true"
                className="h-px w-6 bg-ember-700/60 lg:w-[1.6cqw]"
              />
              {eyebrow}
            </p>

            <h1 className="mt-5 max-w-4xl text-[clamp(2.5rem,10vw,3.5rem)] leading-[0.98] font-semibold tracking-[-0.045em] text-navy-900 lg:mt-[2.15cqw] lg:max-w-none lg:text-[min(5.75cqw,98px)] lg:leading-[0.96] lg:tracking-[-0.055em]">
              Careers
              <br className="hidden lg:inline" /> built through
              <br className="hidden lg:inline" /> practice.
            </h1>

            <p className="mt-5 max-w-xl text-base leading-7 text-ink-600 sm:text-lg sm:leading-8 lg:mt-[2.68cqw] lg:max-w-[41.5cqw] lg:text-[min(1.47cqw,25px)] lg:leading-[1.36]">
              These learners arrived with different backgrounds and goals. What
              connects their stories is practical work, consistent guidance and
              the confidence to take a meaningful next step.
            </p>
          </Reveal>

          <Reveal
            delay={110}
            direction="left"
            className="mt-10 lg:absolute lg:top-[14.35%] lg:left-[57.7%] lg:mt-0 lg:h-[55.2%] lg:w-[30.8%]"
          >
            <article className="flex h-full flex-col rounded-2xl border border-ink-200/80 bg-[#f8f1e7] p-5 shadow-card sm:p-6 lg:rounded-none lg:border-0 lg:bg-transparent lg:p-[2.7cqw] lg:shadow-none">
              <p className="text-[0.6875rem] font-semibold tracking-[0.14em] text-ember-700 uppercase lg:text-[min(1.07cqw,18px)]">
                What learners mention most
              </p>
              <span
                aria-hidden="true"
                className="mt-4 h-px bg-navy-900/12 lg:mt-[1.55cqw]"
              />

              <ol className="flex flex-1 flex-col divide-y divide-navy-900/10">
                {themes.map((theme, index) => (
                  <li
                    key={theme.title}
                    className="flex flex-1 items-start gap-3.5 py-4 lg:items-center lg:gap-[2cqw] lg:py-0"
                  >
                    <span
                      aria-hidden="true"
                      className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md bg-[#e5ece2] font-mono text-[0.6875rem] font-semibold text-navy-800 lg:mt-0 lg:size-[2.5cqw] lg:rounded-[0.5cqw] lg:text-[min(1cqw,17px)]"
                    >
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-navy-950 lg:text-[min(1.3cqw,22px)]">
                        {theme.title}
                      </p>
                      <p className="mt-1 text-xs leading-5 text-ink-500 lg:mt-[0.45cqw] lg:text-[min(1.07cqw,18px)] lg:leading-[1.45]">
                        {theme.body}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>

              <p className="mt-4 rounded-lg bg-[#f0e5d0] px-3 py-2.5 text-xs text-ink-500 lg:mt-[1.7cqw] lg:rounded-[0.55cqw] lg:px-[1.3cqw] lg:py-[0.95cqw] lg:text-[min(1.02cqw,17px)]">
                {footnote}
              </p>
            </article>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
