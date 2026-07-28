import Image from "next/image";
import Link from "next/link";

import { Reveal } from "@/components/motion/Reveal";
import { Container } from "@/components/ui/Section";

/**
 * Contact page hero with a full-bleed 3D artwork background.
 *
 * Layout mirrors ArtHero: on large screens the image fills the section and copy
 * floats over the left side behind a soft scrim. Below `lg` the image stacks
 * beneath the copy.
 */
export function ContactHero() {
  return (
    <section className="relative isolate overflow-hidden border-b border-[#173f35]/10 bg-[#f5cbb8]">
      {/* Desktop: artwork as section background */}
      <div aria-hidden="true" className="absolute inset-0 hidden lg:block">
        <Image
          src="/img/contact-bg.webp"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-[right_center]"
        />
        {/* Scrim so left-column text stays readable */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#f5cbb8] via-[#f5cbb8]/80 via-40% to-transparent" />
      </div>

      <Container className="relative">
        <div className="grid items-center gap-10 pt-8 pb-14 sm:pt-10 lg:min-h-[min(calc(100svh-var(--header-h)),44rem)] lg:grid-cols-2 lg:gap-0 lg:pt-0 lg:pb-0">
          <div className="lg:py-24">
            {/* Breadcrumb */}
            <nav aria-label="Breadcrumb" className="mb-9 lg:mb-10">
              <ol className="flex min-w-0 flex-wrap items-center gap-2 text-xs text-navy-700">
                <li>
                  <Link href="/" className="transition-colors hover:text-navy-900">
                    Home
                  </Link>
                </li>
                <li className="flex min-w-0 items-center gap-2">
                  <span aria-hidden="true" className="text-navy-900/40">
                    /
                  </span>
                  <span aria-current="page" className="truncate font-medium text-navy-900">
                    Contact
                  </span>
                </li>
              </ol>
            </nav>

            <Reveal>
              {/* Eyebrow */}
              <p className="text-eyebrow flex items-center gap-3 text-navy-800 uppercase">
                <span aria-hidden="true" className="h-px w-7 bg-navy-900/45" />
                Contact
              </p>

              {/* Headline */}
              <h1 className="mt-6 max-w-[15ch] text-[clamp(2.75rem,5.6vw,4.5rem)] leading-[0.95] font-bold tracking-[-0.045em] text-navy-900">
                Let&apos;s work out where you should start
              </h1>

              {/* Description */}
              <p className="mt-7 max-w-md text-base leading-8 font-medium text-navy-800 sm:text-[1.0625rem]">
                Send an enquiry or call us directly. Counselling is free, and
                we&apos;ll give you a straight answer about which track fits your
                background.
              </p>
            </Reveal>
          </div>
        </div>

        {/* Mobile / tablet: stacked image */}
        <div className="relative -mx-5 pb-2 sm:-mx-8 lg:hidden">
          <Image
            src="/img/contact-bg.webp"
            alt="Contact illustration showing headphones, envelope and chat icons in a warm 3D scene"
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
