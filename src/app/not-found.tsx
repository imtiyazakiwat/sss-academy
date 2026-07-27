import { ArrowIcon, ButtonLink } from "@/components/ui/Button";
import { Container } from "@/components/ui/Section";
import { courses } from "@/content/courses";

export default function NotFound() {
  return (
    <section className="relative overflow-hidden bg-navy-950 py-24 text-white sm:py-32">
      <div
        aria-hidden="true"
        className="grid-lines-dark pointer-events-none absolute inset-0 opacity-60"
      />
      <Container className="relative">
        <p className="font-mono text-sm text-ember-400">404</p>
        <h1 className="text-headline sm:text-display mt-4 max-w-2xl text-white">
          That page has moved or never existed
        </h1>
        <p className="mt-5 max-w-xl text-lg text-navy-200">
          The site was recently rebuilt. If you followed an old link, the
          equivalent page is probably one of these.
        </p>

        <div className="mt-9 flex flex-col gap-3 sm:flex-row">
          <ButtonLink href="/courses" size="lg">
            Browse {courses.length} courses
            <ArrowIcon />
          </ButtonLink>
          <ButtonLink href="/" variant="onDark" size="lg">
            Back to home
          </ButtonLink>
        </div>
      </Container>
    </section>
  );
}
