import { Parallax } from "@/components/motion/Parallax";
import { Reveal } from "@/components/motion/Reveal";
import { Container, Section, SectionHeader } from "@/components/ui/Section";
import { approach, trustSignals } from "@/content/about";

/**
 * The "how" beat: a four-step ladder, then the trust signals that make each
 * step believable. Parallax on the step numerals only — the text never moves,
 * so nothing becomes hard to read mid-scroll.
 */
export function Approach() {
  return (
    <Section>
      <Container>
        <div className="grid gap-14 lg:grid-cols-12 lg:gap-10">
          <div className="lg:col-span-5">
            <Reveal>
              <SectionHeader
                eyebrow={approach.eyebrow}
                title={approach.heading}
                description="Four things happen in every track. Skip any one of them and the interview goes badly."
              />
            </Reveal>

            <Reveal delay={150} className="mt-10">
              <ul className="grid gap-4 sm:grid-cols-2">
                {trustSignals.map((signal) => (
                  <li
                    key={signal.title}
                    className="rounded-xl border border-ink-200 bg-ink-50/60 p-4"
                  >
                    <p className="text-sm font-semibold text-navy-950">
                      {signal.title}
                    </p>
                    <p className="mt-1.5 text-xs leading-relaxed text-ink-600">
                      {signal.body}
                    </p>
                  </li>
                ))}
              </ul>
            </Reveal>
          </div>

          <ol className="lg:col-span-7 lg:pt-4">
            {approach.steps.map((step, i) => (
              <Reveal
                as="li"
                key={step.step}
                delay={i * 80}
                direction="left"
                className="group relative flex gap-6 border-t border-ink-200 py-7 first:border-t-0 first:pt-0"
              >
                <Parallax speed={0.03 * (i + 1)} className="shrink-0">
                  <span
                    aria-hidden="true"
                    className="block font-mono text-3xl font-medium tracking-tighter text-ink-200 transition-colors duration-300 group-hover:text-ember-300 sm:text-4xl"
                  >
                    {step.step}
                  </span>
                </Parallax>

                <div className="pt-1">
                  <h3 className="text-title text-navy-950">{step.title}</h3>
                  <p className="mt-2 max-w-lg leading-relaxed text-ink-600">
                    {step.body}
                  </p>
                </div>
              </Reveal>
            ))}
          </ol>
        </div>
      </Container>
    </Section>
  );
}
