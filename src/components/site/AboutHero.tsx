import Image from "next/image";
import Link from "next/link";

import { Reveal } from "@/components/motion/Reveal";
import { Container } from "@/components/ui/Section";

/**
 * About-page hero. The 3D scene is a single pre-rendered image that carries the
 * right-hand composition (including the "01 / Our story" plate), so the markup
 * only owns the copy column and the parchment scrim that keeps it legible.
 */
export function AboutHero() {
  return (
    <section className="relative isolate overflow-hidden border-b border-[#173f35]/10 bg-[#f5f1e8]">
      {/* Desktop: the artwork is the section background, anchored right. */}
      <div aria-hidden="true" className="absolute inset-0 hidden lg:block">
        <Image
          src="/img/about-us-bg.webp"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-[right_65%]"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#f5f1e8] via-[#f5f1e8]/75 via-38% to-transparent" />
      </div>

      <Container className="relative">
        <div className="grid items-center gap-10 pt-12 pb-14 sm:pt-16 lg:min-h-[min(calc(100svh-var(--header-h)),44rem)] lg:grid-cols-2 lg:gap-0 lg:pt-0 lg:pb-0">
          <Reveal className="lg:py-24">
            <p className="flex items-center gap-3 text-eyebrow uppercase text-navy-800">
              <span aria-hidden="true" className="h-px w-7 bg-navy-900/45" />
              About
            </p>

            <h1 className="mt-6 max-w-[15ch] text-[clamp(2.75rem,5.6vw,4.5rem)] leading-[0.95] font-bold tracking-[-0.045em] text-navy-900">
              Building careers through quality IT training
            </h1>

            <p className="mt-7 max-w-md text-base leading-8 text-ink-600 sm:text-[1.0625rem]">
              Founded to close the distance between what colleges teach and what
              employers actually test for.
            </p>

            <Link
              href="#our-story"
              className="group mt-9 inline-flex h-13 items-center gap-3 rounded-full bg-navy-900 pr-6 pl-7 text-base font-medium text-white shadow-[0_10px_30px_-12px_rgb(23_63_53/0.45)] transition-[transform,background-color,box-shadow] duration-200 ease-[var(--ease-out-expo)] hover:-translate-y-0.5 hover:bg-navy-950 hover:shadow-[0_16px_40px_-14px_rgb(23_63_53/0.5)]"
            >
              Explore Our Story
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
          </Reveal>
        </div>

        {/* Mobile / tablet: the same artwork, stacked under the copy. */}
        <div className="relative -mx-5 pb-2 sm:-mx-8 lg:hidden">
          <Image
            src="/img/about-us-bg.webp"
            alt="An illustrated SSS Academy workspace with a laptop, code cube and books marked Learn, Practice and Grow"
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
