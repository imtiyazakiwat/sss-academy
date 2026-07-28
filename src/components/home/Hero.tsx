import Image from "next/image";

import { Reveal } from "@/components/motion/Reveal";
import { ArrowIcon, ButtonLink } from "@/components/ui/Button";
import { initials, placements } from "@/content/placements";
import { socials } from "@/content/site";

const youtube = socials.find((s) => s.label === "YouTube")!.href;

/** Four names off the top of the placement list, used for the avatar stack. */
const avatars = placements.slice(0, 4);

const avatarTints = [
  "bg-navy-900 text-white",
  "bg-violet-600 text-white",
  "bg-ember-600 text-white",
  "bg-navy-600 text-white",
];

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-white">
      {/* Soft violet wash behind the copy */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-gradient-to-br from-violet-50 via-white to-white"
      />
      <div
        aria-hidden="true"
        className="dot-grid pointer-events-none absolute top-40 left-0 hidden size-56 opacity-70 [mask-image:radial-gradient(circle,black,transparent_70%)] lg:block"
      />

      {/* The sweeping image panel. Hidden below lg, where it becomes a card. */}
      <div
        aria-hidden="true"
        className="hero-sweep absolute inset-y-0 right-0 hidden w-[56%] lg:block"
      >
        <Image
          src="/img/classroom.webp"
          alt=""
          fill
          priority
          sizes="60vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-white via-transparent to-transparent" />
      </div>

      <div className="relative mx-auto max-w-7xl px-5 pt-12 sm:px-8 sm:pt-16 lg:pt-20">
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-8">
          <div className="lg:pb-16">
            <Reveal>
              <p className="inline-flex items-center gap-2 rounded-full border border-violet-200 bg-white py-2 pr-4 pl-2 text-sm font-medium text-navy-900 shadow-subtle">
                <span className="flex size-6 items-center justify-center rounded-full bg-violet-600">
                  <svg
                    viewBox="0 0 16 16"
                    aria-hidden="true"
                    className="size-3.5"
                    fill="none"
                  >
                    <path
                      d="M8 2.5 13 5v5.2c0 .3-.2.6-.4.7L8 13.5 3.4 10.9c-.2-.1-.4-.4-.4-.7V5L8 2.5Z"
                      stroke="white"
                      strokeWidth="1.3"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
                Industry-Oriented IT Training
              </p>
            </Reveal>

            <Reveal delay={80}>
              <h1 className="text-display sm:text-display-xl mt-7 text-navy-950">
                Become Job Ready in
                <br />
                <span className="text-gradient-brand">Data Engineering</span>
              </h1>
            </Reveal>

            <Reveal delay={150}>
              <p className="mt-6 max-w-lg text-lg leading-relaxed text-ink-600">
                Master SQL, Python, ETL Testing, Azure Data Factory, PySpark and
                Databricks with real-world projects and expert mentorship.
              </p>
            </Reveal>

            <Reveal delay={220}>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <ButtonLink href="/contact" size="lg">
                  Enroll Now
                  <ArrowIcon />
                </ButtonLink>
                <ButtonLink href="/courses" variant="ghost" size="lg">
                  View Curriculum
                  <ArrowIcon />
                </ButtonLink>
              </div>
            </Reveal>

            {/* Social proof, immediately under the CTAs where hesitation lives */}
            <Reveal delay={300}>
              <div className="mt-10 flex flex-wrap items-center gap-x-10 gap-y-6">
                <div className="flex items-center gap-3">
                  <span className="flex size-11 items-center justify-center rounded-full bg-ember-50 text-ember-600">
                    <svg
                      viewBox="0 0 20 20"
                      aria-hidden="true"
                      className="size-5"
                      fill="none"
                    >
                      <path
                        d="M10 2.5v15M5 5.5h10M4 9h12M6 12.5h8"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                      />
                    </svg>
                  </span>
                  <span>
                    <span className="block text-[1.0625rem] font-semibold text-navy-950">
                      26+ Years
                    </span>
                    <span className="block text-xs text-ink-500">
                      Of industry experience
                    </span>
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <ul className="flex" aria-hidden="true">
                    {avatars.map((p, i) => (
                      <li
                        key={p.slug}
                        className={`-ml-2.5 flex size-9 items-center justify-center rounded-full text-[0.6875rem] font-semibold ring-2 ring-white first:ml-0 ${avatarTints[i]}`}
                      >
                        {initials(p.name)}
                      </li>
                    ))}
                  </ul>
                  <span>
                    <span className="block text-[1.0625rem] font-semibold text-navy-950">
                      1000+
                    </span>
                    <span className="block text-xs text-ink-500">
                      Learners supported
                    </span>
                  </span>
                </div>
              </div>
            </Reveal>
          </div>

          {/* Mobile / tablet image, plus the floating video card on all sizes */}
          <div className="relative lg:h-[30rem]">
            <div className="relative overflow-hidden rounded-2xl shadow-lift lg:hidden">
              <Image
                src="/img/classroom.webp"
                alt="Students in a training session at SSS Academy"
                width={1600}
                height={800}
                sizes="100vw"
                className="h-56 w-full object-cover sm:h-72"
              />
            </div>

            <Reveal
              delay={380}
              direction="up"
              className="mt-4 lg:absolute lg:right-28 lg:-bottom-16 lg:mt-0"
            >
              <a
                href={youtube}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex w-full items-center gap-3.5 rounded-2xl border border-ink-200 bg-white/95 p-3.5 shadow-lift backdrop-blur transition-transform duration-300 ease-[var(--ease-out-expo)] hover:-translate-y-0.5 sm:w-auto"
              >
                <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-violet-600 transition-colors group-hover:bg-violet-700">
                  <svg viewBox="0 0 16 16" aria-hidden="true" className="size-4">
                    <path d="M5.5 3.5 12 8l-6.5 4.5V3.5Z" fill="white" />
                  </svg>
                </span>
                <span className="pr-2">
                  <span className="block text-sm font-semibold text-navy-950">
                    Watch Our Story
                  </span>
                  <span className="block text-xs text-ink-500">
                    See how we transform careers
                  </span>
                </span>
              </a>
            </Reveal>
          </div>
        </div>
      </div>

      {/* Thin violet arc that ties the hero into the stats strip below */}
      <svg
        aria-hidden="true"
        viewBox="0 0 1440 60"
        preserveAspectRatio="none"
        className="relative mt-8 block h-10 w-full text-violet-300 lg:-mt-2"
      >
        <path
          d="M0 46C240 46 420 6 720 6s480 40 720 40"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        />
      </svg>
    </section>
  );
}
