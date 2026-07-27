import type { Metadata } from "next";

import { JsonLd } from "@/components/JsonLd";
import { Reveal } from "@/components/motion/Reveal";
import { CourseCard } from "@/components/site/CourseCard";
import { PageHero } from "@/components/site/PageHero";
import { Container, Section } from "@/components/ui/Section";
import { courses, type CourseTrack } from "@/content/courses";
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
  // One continuous grid rather than a section per track: grouping left every
  // short track with a half-empty row and stacked ~210px of section padding
  // between rows of cards. The track is still on each card.
  const ordered = trackOrder.flatMap((track) =>
    courses.filter((course) => course.track === track),
  );

  return (
    <>
      <PageHero
        variant="catalogue"
        eyebrow="Courses"
        title="Eleven tracks. One outcome: you can do the job."
        description="Each course runs between one and three months, ends in real-time project work, and includes interview preparation. Not sure where to start? SQL first, then ETL Testing, is a path many of our learners followed."
        breadcrumb={[{ name: "Courses", href: "/courses" }]}
        aside={
          <dl className="grid grid-cols-2 gap-px overflow-hidden border border-navy-900/15 bg-navy-900/15 shadow-[8px_8px_0_0_#e7b94d]">
            <Fact value={`${courses.length}`} label="Courses offered" />
            <Fact value="1–3" label="Months per track" />
            <Fact value="1000+" label="Learners supported" />
            <Fact value="26+" label="Years of experience" />
          </dl>
        }
      />

      <Section className="py-14 sm:py-16">
        <Container>
          <Reveal className="flex items-baseline justify-between gap-6 border-b border-ink-200 pb-5">
            <h2 className="text-title text-navy-950 sm:text-2xl">
              Every track we teach
            </h2>
            <span className="font-mono text-xs text-ink-400">
              {courses.length} courses
            </span>
          </Reveal>

          <div className="mt-7 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {ordered.map((course, i) => (
              <Reveal
                key={course.slug}
                delay={(i % 3) * 70}
                scale={0.98}
                threshold={0.05}
                className="h-full"
              >
                <CourseCard course={course} className="h-full" />
              </Reveal>
            ))}
          </div>
        </Container>
      </Section>

      <JsonLd data={courseListSchema} />
      <JsonLd
        data={breadcrumbSchema([{ name: "Courses", href: "/courses" }])}
      />
    </>
  );
}

function Fact({ value, label }: { value: string; label: string }) {
  return (
    <div className="bg-[#fffdf8] px-5 py-5">
      <dt className="text-[0.625rem] font-semibold tracking-[0.13em] text-ink-500 uppercase">{label}</dt>
      <dd className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-navy-900">
        {value}
      </dd>
    </div>
  );
}
