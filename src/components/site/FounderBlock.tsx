import Image from "next/image";

import { Parallax } from "@/components/motion/Parallax";
import { Reveal } from "@/components/motion/Reveal";
import { Container, Eyebrow, Section } from "@/components/ui/Section";
import { founder } from "@/content/about";

/**
 * Founder credibility block. The strongest trust signal the institute has —
 * a named practitioner with a verifiable specialism, not an anonymous "faculty".
 */
export function FounderBlock({
  tone = "light",
}: {
  tone?: "light" | "muted";
}) {
  return (
    <Section tone={tone === "muted" ? "muted" : "light"}>
      <Container>
        <div className="grid items-center gap-12 lg:grid-cols-12 lg:gap-16">
          <Reveal direction="right" className="lg:col-span-5">
            <div className="relative">
              {/* Offset frame gives the portrait depth without a drop shadow */}
              <Parallax speed={0.06}>
                <div
                  aria-hidden="true"
                  className="absolute -top-4 -left-4 h-full w-full rounded-2xl border border-ember-200 bg-ember-50"
                />
              </Parallax>
              <div className="relative overflow-hidden rounded-2xl bg-ink-100">
                <Image
                  src={founder.photo}
                  alt={`${founder.name}, ${founder.role} of SSS Academy`}
                  width={800}
                  height={966}
                  sizes="(max-width: 1024px) 90vw, 420px"
                  className="h-full w-full object-cover"
                />
              </div>
            </div>
          </Reveal>

          <Reveal direction="left" delay={100} className="lg:col-span-7">
            <Eyebrow>Who teaches you</Eyebrow>
            <h2 className="text-headline mt-4 text-navy-950">
              {founder.name}
            </h2>
            <p className="mt-1 text-[0.9375rem] font-medium text-violet-700">
              {founder.role}
            </p>

            <p className="mt-6 leading-relaxed text-ink-600">{founder.bio}</p>

            <ul className="mt-7 flex flex-wrap gap-2">
              {founder.expertise.map((skill) => (
                <li
                  key={skill}
                  className="rounded-full border border-ink-200 bg-white px-3.5 py-1.5 text-xs font-medium text-navy-800"
                >
                  {skill}
                </li>
              ))}
            </ul>

            <ul className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm text-ink-500">
              {founder.tags.map((tag) => (
                <li key={tag} className="flex items-center gap-2">
                  <span
                    aria-hidden="true"
                    className="size-1.5 rounded-full bg-ember-500"
                  />
                  {tag}
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </Container>
    </Section>
  );
}
