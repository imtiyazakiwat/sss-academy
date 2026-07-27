import { Reveal } from "@/components/motion/Reveal";
import { Container, Section, SectionHeader } from "@/components/ui/Section";
import { problem } from "@/content/about";

/**
 * The "problem" beat. Naming the visitor's actual fear before pitching anything
 * is what makes the rest of the page feel like an answer rather than an advert.
 */
export function Problem() {
  return (
    <Section tone="muted">
      <Container>
        <Reveal>
          <SectionHeader
            eyebrow={problem.eyebrow}
            title={problem.heading}
            description={problem.body}
          />
        </Reveal>

        <ul className="mt-14 grid gap-px overflow-hidden rounded-2xl border border-ink-200 bg-ink-200 sm:grid-cols-3">
          {problem.points.map((point, i) => (
            <Reveal
              as="li"
              key={point.title}
              delay={i * 90}
              className="bg-white p-7"
            >
              <span
                aria-hidden="true"
                className="font-mono text-xs text-violet-600"
              >
                0{i + 1}
              </span>
              <h3 className="mt-4 text-[1.0625rem] font-semibold text-navy-950">
                {point.title}
              </h3>
              <p className="mt-2.5 text-sm leading-relaxed text-ink-600">
                {point.body}
              </p>
            </Reveal>
          ))}
        </ul>
      </Container>
    </Section>
  );
}
