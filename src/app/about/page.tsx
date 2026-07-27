import type { Metadata } from "next";
import Image from "next/image";

import { JsonLd } from "@/components/JsonLd";
import { CountUp } from "@/components/motion/CountUp";
import { Parallax } from "@/components/motion/Parallax";
import { Reveal } from "@/components/motion/Reveal";
import { CtaBand } from "@/components/site/CtaBand";
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

      <Section className="py-16 sm:py-24">
        <Container>
          <div className="grid gap-14 lg:grid-cols-12 lg:gap-16">
            <div className="lg:col-span-7">
              <Reveal>
                <Eyebrow>{story.eyebrow}</Eyebrow>
                <h2 className="text-headline mt-4 text-navy-950">
                  {story.heading}
                </h2>
              </Reveal>

              <div className="mt-7 space-y-5">
                {story.paragraphs.map((paragraph, i) => (
                  <Reveal key={i} delay={i * 70}>
                    <p className="leading-relaxed text-ink-600">{paragraph}</p>
                  </Reveal>
                ))}
              </div>
            </div>

            <Reveal direction="left" delay={120} className="lg:col-span-5">
              <div className="relative">
                <Parallax speed={0.05}>
                  <div
                    aria-hidden="true"
                    className="absolute -right-4 -bottom-4 h-full w-full rounded-2xl border border-navy-200 bg-navy-50"
                  />
                </Parallax>
                <div className="relative overflow-hidden rounded-2xl">
                  <Image
                    src="/img/classroom.webp"
                    alt="A training session in progress at SSS Academy"
                    width={1600}
                    height={800}
                    sizes="(max-width: 1024px) 90vw, 460px"
                    className="h-full w-full object-cover"
                  />
                </div>
              </div>
            </Reveal>
          </div>
        </Container>
      </Section>

      <Section tone="dark" className="py-16 sm:py-20">
        <div
          aria-hidden="true"
          className="grid-lines-dark pointer-events-none absolute inset-0 opacity-60"
        />
        <Container className="relative">
          <Reveal>
            <Eyebrow tone="dark">Our achievements</Eyebrow>
          </Reveal>
          <dl className="mt-8 grid gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 sm:grid-cols-3">
            {stats.map((stat, i) => (
              <Reveal
                key={stat.label}
                delay={i * 90}
                className="bg-navy-950/80 px-7 py-8"
              >
                <dt className="text-eyebrow uppercase text-navy-400">
                  {stat.label}
                </dt>
                <dd className="mt-3 text-4xl font-semibold tracking-[-0.04em] text-white sm:text-5xl">
                  <CountUp value={stat.value} suffix={stat.suffix} />
                </dd>
              </Reveal>
            ))}
          </dl>
        </Container>
      </Section>

      <Section className="py-16 sm:py-24">
        <Container>
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

      <CtaBand
        eyebrow="Start here"
        title="Start your IT career today"
        body="Join SSS Academy and become industry-ready. Book a free counselling call and we'll tell you honestly where you stand and what it will take."
      />

      <JsonLd data={breadcrumbSchema([{ name: "About", href: "/about" }])} />
    </>
  );
}
