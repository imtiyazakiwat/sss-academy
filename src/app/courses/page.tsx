import type { Metadata } from "next";

import { JsonLd } from "@/components/JsonLd";
import { Reveal } from "@/components/motion/Reveal";
import { CourseCard } from "@/components/site/CourseCard";
import { CtaBand } from "@/components/site/CtaBand";
import { PageHero } from "@/components/site/PageHero";
import { Container, Section } from "@/components/ui/Section";
import { courses, trackLabels, type CourseTrack } from "@/content/courses";
import { breadcrumbSchema, courseListSchema } from "@/lib/schema";

export const metadata: Metadata = {
  title: "Courses — SQL, Python, ETL Testing, PySpark, Snowflake & more",
  description:
    "Eleven industry-oriented IT training tracks at SSS Academy: SQL, Python, ETL Testing, PySpark, Data Warehousing, Automation Testing, Power BI, Databricks, Azure Data Factory, NumPy and Snowflake.",
  alternates: { canonical: "/courses" },
};

const trackOrder: CourseTrack[] = [
  "data",
  "testing",
  "cloud",
  "programming",
  "bi",
];

export default function CoursesPage() {
  const grouped = trackOrder
    .map((track) => ({
      track,
      label: trackLabels[track],
      items: courses.filter((c) => c.track === track),
    }))
    .filter((group) => group.items.length > 0);

  return (
    <>
      <PageHero
        eyebrow="Courses"
        title="Eleven tracks. One outcome: you can do the job."
        description="Each course runs between one and three months, ends in real-time project work, and includes interview preparation. Not sure where to start? SQL first, then ETL Testing, is the path most of our placed students took."
        breadcrumb={[{ name: "Courses", href: "/courses" }]}
        aside={
          <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10">
            <Fact value={`${courses.length}`} label="Courses offered" />
            <Fact value="1–3" label="Months per track" />
            <Fact value="1000+" label="Students placed" />
            <Fact value="26+" label="Years of experience" />
          </dl>
        }
      />

      {grouped.map((group, groupIndex) => (
        <Section
          key={group.track}
          tone={groupIndex % 2 === 1 ? "muted" : "light"}
          className="py-16 sm:py-20"
        >
          <Container>
            <Reveal className="flex items-baseline justify-between gap-6 border-b border-ink-200 pb-5">
              <h2 className="text-title text-navy-950 sm:text-2xl">
                {group.label}
              </h2>
              <span className="font-mono text-xs text-ink-400">
                {group.items.length}{" "}
                {group.items.length === 1 ? "course" : "courses"}
              </span>
            </Reveal>

            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {group.items.map((course, i) => (
                <Reveal key={course.slug} delay={(i % 3) * 70} scale={0.98}>
                  <CourseCard course={course} className="h-full" />
                </Reveal>
              ))}
            </div>
          </Container>
        </Section>
      ))}

      <CtaBand
        eyebrow="Still deciding"
        title="Tell us the job you want. We'll tell you the track."
        body="A free counselling call takes fifteen minutes. We look at your background and the roles you're targeting, then recommend the shortest honest path — even if that means a cheaper course than you expected."
      />

      <JsonLd data={courseListSchema} />
      <JsonLd
        data={breadcrumbSchema([{ name: "Courses", href: "/courses" }])}
      />
    </>
  );
}

function Fact({ value, label }: { value: string; label: string }) {
  return (
    <div className="bg-navy-950/70 px-5 py-4 backdrop-blur">
      <dt className="text-eyebrow uppercase text-navy-400">{label}</dt>
      <dd className="mt-1.5 text-2xl font-semibold tracking-[-0.03em] text-white">
        {value}
      </dd>
    </div>
  );
}
