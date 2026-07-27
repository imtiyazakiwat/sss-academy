import { Reveal } from "@/components/motion/Reveal";
import { faqs } from "@/content/about";
import { Container, Section, SectionHeader } from "@/components/ui/Section";

/**
 * Objection handling, placed just before the final CTA.
 *
 * Built on native <details>/<summary> so it is accessible and interactive with
 * zero JavaScript — the accordion works before hydration.
 */
export function Faq() {
  return (
    <Section tone="muted">
      <Container>
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-4">
            <Reveal>
              <SectionHeader
                eyebrow="Before you ask"
                title="The questions we get on every call"
              />
            </Reveal>
          </div>

          <div className="lg:col-span-8">
            <ul className="divide-y divide-ink-200 border-y border-ink-200">
              {faqs.map((faq, i) => (
                <Reveal as="li" key={faq.q} delay={i * 60}>
                  <details className="group py-5">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-6 text-[1.0625rem] font-medium text-navy-950 marker:hidden [&::-webkit-details-marker]:hidden">
                      {faq.q}
                      <span
                        aria-hidden="true"
                        className="relative size-5 shrink-0 rounded-full border border-ink-300 transition-colors group-open:border-ember-400 group-open:bg-ember-50"
                      >
                        <span className="absolute top-1/2 left-1/2 h-px w-2.5 -translate-x-1/2 -translate-y-1/2 bg-navy-700" />
                        <span className="absolute top-1/2 left-1/2 h-2.5 w-px -translate-x-1/2 -translate-y-1/2 bg-navy-700 transition-transform duration-300 ease-[var(--ease-out-expo)] group-open:scale-y-0" />
                      </span>
                    </summary>
                    <p className="mt-3 max-w-2xl pr-10 text-[0.9375rem] leading-relaxed text-ink-600">
                      {faq.a}
                    </p>
                  </details>
                </Reveal>
              ))}
            </ul>
          </div>
        </div>
      </Container>
    </Section>
  );
}
