import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { JsonLd } from "@/components/JsonLd";
import { Reveal } from "@/components/motion/Reveal";
import { CourseCard } from "@/components/site/CourseCard";
import { CourseHero } from "@/components/site/CourseHero";
import { EnquiryForm } from "@/components/site/EnquiryForm";
import { ArrowIcon, ButtonLink } from "@/components/ui/Button";
import { Container, Eyebrow, Section } from "@/components/ui/Section";
import {
  courses,
  durationLabel,
  getCourse,
  relatedCourses,
} from "@/content/courses";
import { placementsByPackage } from "@/content/placements";
import { contact } from "@/content/site";
import { breadcrumbSchema, courseSchema } from "@/lib/schema";

/** All eleven courses are known at build time — prerender every detail page. */
export function generateStaticParams() {
  return courses.map((course) => ({ slug: course.slug }));
}

export async function generateMetadata(
  props: PageProps<"/courses/[slug]">,
): Promise<Metadata> {
  const { slug } = await props.params;
  const course = getCourse(slug);
  if (!course) return { title: "Course not found" };

  return {
    title: `${course.title} Training — ${durationLabel(course.durationMonths)}`,
    description: course.summary,
    alternates: { canonical: `/courses/${course.slug}` },
    openGraph: {
      title: `${course.title} Training at SSS Academy`,
      description: course.summary,
      url: `/courses/${course.slug}`,
    },
  };
}

export default async function CoursePage(props: PageProps<"/courses/[slug]">) {
  const { slug } = await props.params;
  const course = getCourse(slug);
  if (!course) notFound();

  const related = relatedCourses(course.slug);
  const schema = courseSchema(course.slug);

  // Illustrative proof: the top packages, which came through these tracks.
  const proof = placementsByPackage.slice(0, 3);

  return (
    <>
      <CourseHero course={course} />

      <Section className="py-16 sm:py-20">
        <Container>
          <div className="grid gap-14 lg:grid-cols-12 lg:gap-16">
            <div className="lg:col-span-7">
              <Reveal>
                <Eyebrow>What you&apos;ll cover</Eyebrow>
                <h2 className="text-headline mt-4 text-navy-950">
                  {course.outcome}
                </h2>
              </Reveal>

              <ol className="mt-9">
                {course.topics.map((topic, i) => (
                  <Reveal
                    as="li"
                    key={topic}
                    delay={i * 50}
                    direction="left"
                    className="flex items-baseline gap-5 border-t border-ink-200 py-4"
                  >
                    <span className="font-mono text-xs text-violet-600">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="text-[1.0625rem] text-navy-900">
                      {topic}
                    </span>
                  </Reveal>
                ))}
              </ol>

              <Reveal delay={80} className="mt-10">
                <div className="rounded-2xl border border-ink-200 bg-ink-50 p-6">
                  <h3 className="text-[1.0625rem] font-semibold text-navy-950">
                    Included with every track
                  </h3>
                  <ul className="mt-4 grid gap-2.5 sm:grid-cols-2">
                    {[
                      "Real-time project scenarios",
                      "Interview preparation & mock interviews",
                      "Resume guidance",
                      "Placement assistance",
                    ].map((item) => (
                      <li
                        key={item}
                        className="flex items-start gap-2.5 text-sm text-ink-600"
                      >
                        <svg
                          viewBox="0 0 16 16"
                          aria-hidden="true"
                          className="mt-0.5 size-4 shrink-0 text-ember-500"
                        >
                          <path
                            d="M3.5 8.5 6.5 11.5 12.5 5"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </Reveal>
            </div>

            {/* Sticky proof + conversion rail */}
            <div className="lg:col-span-5">
              <Reveal direction="left" className="lg:sticky lg:top-24">
                <div className="rounded-2xl border border-ink-200 bg-white p-6 shadow-card">
                  <Eyebrow>Where this leads</Eyebrow>
                  <p className="mt-4 text-sm leading-relaxed text-ink-600">
                    Students from our data and testing tracks have been placed at
                    multinationals on packages up to ₹
                    {placementsByPackage[0].packageLpa.toFixed(2)} LPA.
                  </p>

                  <ul className="mt-5 space-y-3">
                    {proof.map((p) => (
                      <li
                        key={p.slug}
                        className="flex items-center justify-between gap-4 border-t border-ink-100 pt-3 first:border-t-0 first:pt-0"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-navy-950">
                            {p.name}
                          </p>
                          <p className="truncate text-xs text-ink-500">
                            {p.role}
                          </p>
                        </div>
                        <span className="shrink-0 font-mono text-xs font-medium text-ember-600">
                          {p.packageLpa.toFixed(2)} LPA
                        </span>
                      </li>
                    ))}
                  </ul>

                  <ButtonLink
                    href="/placements"
                    variant="ghost"
                    size="sm"
                    className="mt-6 w-full"
                  >
                    All placement stories
                    <ArrowIcon />
                  </ButtonLink>
                </div>
              </Reveal>
            </div>
          </div>
        </Container>
      </Section>

      <Section id="enquire" tone="muted" className="py-16 sm:py-20">
        <Container>
          <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
            <Reveal className="lg:col-span-5">
              <Eyebrow>Enquire</Eyebrow>
              <h2 className="text-headline mt-4 text-navy-950">
                Ask about the {course.title} batch
              </h2>
              <p className="mt-5 leading-relaxed text-ink-600">
                Send us your details and we&apos;ll get back to you with batch
                timings, fees and whether this is the right starting point for
                your background.
              </p>
              <p className="mt-6 text-sm text-ink-500">
                Prefer to talk?{" "}
                <a
                  href={`tel:${contact.phoneHrefs[0]}`}
                  className="font-medium text-navy-900 underline decoration-ember-400 decoration-2 underline-offset-2"
                >
                  {contact.phones[0]}
                </a>
              </p>
            </Reveal>

            <Reveal delay={100} className="lg:col-span-7">
              <div className="rounded-2xl border border-ink-200 bg-white p-6 shadow-card sm:p-8">
                <EnquiryForm defaultCourse={course.slug} />
              </div>
            </Reveal>
          </div>
        </Container>
      </Section>

      <Section className="py-16 sm:py-20">
        <Container>
          <Reveal>
            <h2 className="text-title text-navy-950 sm:text-2xl">
              Often taken alongside
            </h2>
          </Reveal>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((c, i) => (
              <Reveal key={c.slug} delay={i * 70} scale={0.98}>
                <CourseCard course={c} className="h-full" />
              </Reveal>
            ))}
          </div>
        </Container>
      </Section>

      {schema ? <JsonLd data={schema} /> : null}
      <JsonLd
        data={breadcrumbSchema([
          { name: "Courses", href: "/courses" },
          { name: course.title, href: `/courses/${course.slug}` },
        ])}
      />
    </>
  );
}
