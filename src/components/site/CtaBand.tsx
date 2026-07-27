import { Reveal } from "@/components/motion/Reveal";
import { ArrowIcon, ButtonLink } from "@/components/ui/Button";
import { Container, Eyebrow } from "@/components/ui/Section";
import { contact } from "@/content/site";

/**
 * The closing decision point. Reused at the end of every page so there is
 * always a conversion opportunity at the natural end of the scroll journey,
 * not just in the header and footer.
 */
export function CtaBand({
  eyebrow = "Next step",
  title = "Talk to us before you decide",
  body = "A short counselling call is free. We will look at your background, tell you honestly which track fits, and what the job market for it looks like right now.",
  primaryLabel = "Book a free counselling call",
  primaryHref = "/contact",
}: {
  eyebrow?: string;
  title?: string;
  body?: string;
  primaryLabel?: string;
  primaryHref?: string;
}) {
  return (
    <section className="relative overflow-hidden bg-navy-900 py-20 text-white sm:py-24">
      <div
        aria-hidden="true"
        className="grid-lines-dark pointer-events-none absolute inset-0"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-24 -bottom-32 size-[28rem] rounded-full bg-ember-500/20 blur-[100px]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-40 -left-24 size-[24rem] rounded-full bg-navy-400/20 blur-[100px]"
      />

      <Container className="relative">
        <Reveal className="flex flex-col items-start gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <Eyebrow tone="dark">{eyebrow}</Eyebrow>
            <h2 className="text-headline sm:text-display mt-4 text-white">
              {title}
            </h2>
            <p className="mt-5 text-lg leading-relaxed text-navy-200">{body}</p>
          </div>

          <div className="flex w-full shrink-0 flex-col gap-3 sm:w-auto sm:flex-row lg:flex-col">
            <ButtonLink href={primaryHref} size="lg">
              {primaryLabel}
              <ArrowIcon />
            </ButtonLink>
            <ButtonLink
              href={`tel:${contact.phoneHrefs[0]}`}
              variant="onDark"
              size="lg"
            >
              {contact.phones[0]}
            </ButtonLink>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
