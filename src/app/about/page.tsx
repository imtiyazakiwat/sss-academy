import type { Metadata } from "next";
import Image from "next/image";

import { JsonLd } from "@/components/JsonLd";
import { CountUp } from "@/components/motion/CountUp";
import { Parallax } from "@/components/motion/Parallax";
import { Reveal } from "@/components/motion/Reveal";
import { FounderBlock } from "@/components/site/FounderBlock";
import { PageHero } from "@/components/site/PageHero";
import { Container, Eyebrow, Section } from "@/components/ui/Section";
import { mission, stats, story, vision } from "@/content/about";
import { breadcrumbSchema } from "@/lib/schema";

export const metadata: Metadata = {
  title: "About — building careers through quality IT training",
  description:
    "SSS Academy was founded to bridge the gap between academic learning and real-world industry requirements, by a practitioner with 26+ years in SQL, Oracle, Quality Engineering and Automation Testing.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <>
      <PageHero
        variant="editorial"
        eyebrow="About"
        title="Building careers through quality IT training"
        description="Founded to close the distance between what colleges teach and what employers actually test for."
        breadcrumb={[{ name: "About", href: "/about" }]}
      />

      <Section className="overflow-hidden pt-16 pb-0 sm:pt-24 sm:pb-0">
        <div
          aria-hidden="true"
          className="absolute -top-32 right-0 h-96 w-96 rounded-full bg-violet-100/60 blur-3xl"
        />
        <Container className="relative">
          <Reveal className="text-center">
            <Eyebrow className="justify-center">{story.eyebrow}</Eyebrow>
            <h2 className="text-title mx-auto mt-4 max-w-4xl text-navy-950 sm:text-headline">
              {story.heading}
            </h2>
          </Reveal>

          <div className="mt-12 grid items-start gap-12 lg:grid-cols-12 lg:gap-12">
            <Reveal className="lg:col-span-6" scale={0.98}>
              <div className="relative">
                <Parallax speed={0.05}>
                  <div
                    aria-hidden="true"
                    className="absolute -right-4 -bottom-4 h-full w-full rounded-3xl border border-navy-200 bg-navy-50"
                  />
                </Parallax>
                <figure className="relative overflow-hidden rounded-3xl bg-navy-950 shadow-subtle">
                  <Image
                    src="/img/classroom-portrait.webp"
                    alt="A training session in progress at SSS Academy"
                    width={640}
                    height={800}
                    sizes="(max-width: 1024px) 90vw, 540px"
                    className="aspect-[4/5] w-full object-cover"
                  />
                  <div
                    aria-hidden="true"
                    className="absolute inset-0 bg-gradient-to-t from-navy-950 via-transparent to-transparent"
                  />
                  <figcaption className="absolute inset-x-0 bottom-0 p-6 text-sm leading-relaxed text-white/80 sm:p-8">
                    <span className="mb-2 block text-eyebrow uppercase text-violet-300">
                      Practical by design
                    </span>
                    Learning shaped by real projects, real interviews and more
                    than two decades of industry experience.
                  </figcaption>
                </figure>

                <div className="mt-5 rounded-3xl border border-navy-200 bg-white p-5 shadow-subtle sm:p-6">
                  <Eyebrow>Our achievements</Eyebrow>
                  <dl className="mt-5 grid grid-cols-3 divide-x divide-ink-200">
                    {stats.map((stat) => (
                      <div key={stat.label} className="px-2 first:pl-0 last:pr-0 sm:px-4">
                        <dt className="text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-ink-500 sm:text-xs">
                          {stat.label}
                        </dt>
                        <dd className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-navy-950 sm:text-3xl">
                          <CountUp value={stat.value} suffix={stat.suffix} />
                        </dd>
                      </div>
                    ))}
                  </dl>
                </div>
              </div>
            </Reveal>

            <div className="lg:col-span-6">
              <ol className="divide-y divide-ink-200 border-y border-ink-200">
                {story.paragraphs.map((paragraph, i) => (
                  <Reveal
                    as="li"
                    key={i}
                    delay={i * 80}
                    className="grid gap-4 py-7 sm:grid-cols-[3rem_1fr] sm:gap-6 sm:py-8"
                  >
                    <span
                      aria-hidden="true"
                      className="flex h-10 w-10 items-center justify-center rounded-full bg-navy-50 text-sm font-semibold text-navy-700"
                    >
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <p
                      className={`text-sm leading-relaxed sm:text-[0.95rem] ${
                        i === 0 ? "text-navy-950" : "text-ink-600"
                      }`}
                    >
                      {paragraph}
                    </p>
                  </Reveal>
                ))}
              </ol>

              <Reveal delay={260}>
                <div className="mt-8 grid overflow-hidden rounded-2xl border border-navy-200 bg-navy-50 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
                  <div className="p-5 sm:p-6">
                    <span className="text-eyebrow uppercase text-ink-500">
                      The starting point
                    </span>
                    <p className="mt-2 font-semibold text-navy-950">
                      Academic theory
                    </p>
                  </div>
                  <span
                    aria-hidden="true"
                    className="mx-5 h-px bg-navy-200 text-center text-navy-500 sm:mx-0 sm:h-auto sm:bg-transparent"
                  >
                    →
                  </span>
                  <div className="p-5 sm:p-6">
                    <span className="text-eyebrow uppercase text-violet-600">
                      The outcome
                    </span>
                    <p className="mt-2 font-semibold text-navy-950">
                      Job-ready confidence
                    </p>
                  </div>
                </div>
              </Reveal>
            </div>
          </div>
        </Container>
      </Section>

      <Section className="pt-10 pb-16 sm:pt-12 sm:pb-24">
        <Container>
          <Reveal className="mb-10 text-center">
            <Eyebrow className="justify-center">What guides us</Eyebrow>
            <h2 className="text-title mx-auto mt-4 max-w-2xl text-navy-950">
              A shared direction for every student we train
            </h2>
          </Reveal>

          <div className="grid gap-5 md:grid-cols-2">
            {[vision, mission].map((item, i) => (
              <Reveal key={item.title} delay={i * 100} scale={0.98}>
                <div className="relative h-full overflow-hidden rounded-2xl border border-ink-200 bg-white p-8 shadow-subtle">
                  <span
                    aria-hidden="true"
                    className={`absolute inset-x-0 top-0 h-1 ${
                      i === 0 ? "bg-navy-700" : "bg-ember-500"
                    }`}
                  />
                  <h2 className="text-title text-navy-950">{item.title}</h2>
                  <p className="mt-4 leading-relaxed text-ink-600">
                    {item.body}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </Container>
      </Section>

      <FounderBlock tone="muted" />

      <JsonLd data={breadcrumbSchema([{ name: "About", href: "/about" }])} />
    </>
  );
}
