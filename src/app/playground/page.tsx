import type { Metadata } from "next";
import Link from "next/link";

import { JsonLd } from "@/components/JsonLd";
import { Reveal } from "@/components/motion/Reveal";
import { PageHero } from "@/components/site/PageHero";
import { ArrowIcon, ButtonLink } from "@/components/ui/Button";
import { Container, Eyebrow, Section } from "@/components/ui/Section";
import { courses, durationLabel } from "@/content/courses";
import { ALL_TABLES } from "@/content/lab-seed";
import { interviewQuestions, labGroups, labOrder, labs } from "@/content/labs";
import { breadcrumbSchema } from "@/lib/schema";

export const metadata: Metadata = {
  title: "Interactive SQL & ETL Lab",
  description:
    "Run real SQL in your browser against a seeded data warehouse. Execute an ETL job stage by stage, run the six standard validation checks, and watch an SCD Type 2 change write history — all mapped to the SSS Academy syllabus.",
  alternates: { canonical: "/playground" },
  openGraph: {
    title: "Interactive SQL & ETL Lab — SSS Academy",
    description:
      "A live SQLite database in the browser: SQL playground, ETL pipeline simulator, validation lab and SCD simulator, built around our SQL, ETL Testing and Data Warehousing courses.",
    url: "/playground",
  },
};

const challengeCount = labs.reduce(
  (total, lab) => total + (lab.challenges?.length ?? 0),
  0,
);

const withoutLabs = courses.filter(
  (course) => !labGroups.some((group) => group.course.slug === course.slug),
);

export default function PlaygroundHubPage() {
  const firstLab = labOrder[0];

  return (
    <>
      <PageHero
        variant="lab"
        eyebrow="Practice lab"
        title="Stop reading about SQL. Run it."
        description="A real SQLite database, seeded with a warehouse and a deliberately dirty ETL feed, running entirely in your browser. Write a query and see rows. Run an ETL job and watch rows get rejected. Change a customer's city and watch history get written."
        breadcrumb={[{ name: "Playground", href: "/playground" }]}
        aside={
          <div className="border border-navy-900/15 bg-[#fffdf8] p-6 shadow-[8px_8px_0_0_#e7b94d]">
            <dl className="grid grid-cols-2 gap-5">
              <Metric value={labs.length} label="Labs" />
              <Metric value={ALL_TABLES.length} label="Live tables" />
              <Metric value={challengeCount} label="Graded challenges" />
              <Metric value={interviewQuestions.length} label="Interview questions" />
            </dl>
            <div className="mt-6 flex flex-col gap-2.5">
              <ButtonLink href={`/playground/${firstLab}`} size="md">
                Open the SQL playground
                <ArrowIcon />
              </ButtonLink>
              <ButtonLink href="/courses" variant="ghost" size="md">
                See the full syllabus
              </ButtonLink>
            </div>
            <p className="mt-4 border-t border-ink-200 pt-4 text-xs leading-relaxed text-ink-600">
              Nothing is installed and nothing is uploaded. The database is created
              in your browser and reset with one click.
            </p>
          </div>
        }
      />

      <Section className="py-16 sm:py-20">
        <Container>
          <Reveal>
            <Eyebrow>How it works</Eyebrow>
            <h2 className="text-headline mt-4 max-w-3xl text-navy-950">
              Real SQLite, compiled to WebAssembly, running on your machine
            </h2>
          </Reveal>

          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {[
              {
                title: "Every result is genuine",
                body: "Queries execute against an actual SQLite engine. Row counts, error messages and every relationship on the schema map are read from the database, not from a script written to look convincing.",
              },
              {
                title: "The data is dirty on purpose",
                body: "The source feed has nulls, duplicates, an orphan key, two date formats and a number with a comma in it. Each defect maps to a check in the validation lab.",
              },
              {
                title: "It works like an editor",
                body: "Resizable panes, a zoomable schema canvas, light and dark themes, and a Reset DB button that rebuilds all 18 tables from the seed script — so you can break anything in front of a live class.",
              },
            ].map((item, index) => (
              <Reveal key={item.title} delay={index * 70}>
                <div className="h-full rounded-2xl border border-ink-200 bg-white p-6 shadow-subtle">
                  <h3 className="text-[1.0625rem] font-semibold text-navy-950">
                    {item.title}
                  </h3>
                  <p className="mt-2.5 text-sm leading-relaxed text-ink-600">
                    {item.body}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </Container>
      </Section>

      <Section tone="muted" className="py-16 sm:py-20">
        <Container>
          <Reveal>
            <Eyebrow>The labs</Eyebrow>
            <h2 className="text-headline mt-4 max-w-3xl text-navy-950">
              Grouped by the course they belong to
            </h2>
            <p className="mt-4 max-w-2xl text-lg leading-relaxed text-ink-600">
              Each lab quotes the topics from its course syllabus, so what you
              practise here is what the classroom sessions cover.
            </p>
          </Reveal>

          <div className="mt-12 space-y-12">
            {labGroups.map((group) => (
              <div key={group.course.slug}>
                <Reveal className="flex flex-wrap items-baseline justify-between gap-3 border-b border-ink-200 pb-3">
                  <h3 className="text-title text-navy-950">
                    {group.course.title}
                    <span className="ml-3 text-sm font-normal text-ink-500">
                      {durationLabel(group.course.durationMonths)} ·{" "}
                      {group.labs.length} {group.labs.length === 1 ? "lab" : "labs"}
                    </span>
                  </h3>
                  <Link
                    href={`/courses/${group.course.slug}`}
                    className="group inline-flex items-center gap-1.5 text-sm font-medium text-navy-900 transition-colors hover:text-violet-700"
                  >
                    Course syllabus
                    <ArrowIcon />
                  </Link>
                </Reveal>

                <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {group.labs.map((lab, index) => (
                    <Reveal key={lab.slug} delay={index * 60} scale={0.98}>
                      <Link
                        href={`/playground/${lab.slug}`}
                        className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-ink-200 bg-white p-6 shadow-subtle transition-[transform,box-shadow,border-color] duration-300 ease-[var(--ease-out-expo)] hover:-translate-y-1 hover:border-violet-200 hover:shadow-lift"
                      >
                        <span
                          aria-hidden="true"
                          className="pointer-events-none absolute inset-x-0 -top-24 h-40 bg-gradient-to-b from-violet-50 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                        />

                        <div className="relative flex items-start justify-between gap-3">
                          <span className="text-eyebrow rounded-full bg-ink-100 px-2.5 py-1 uppercase text-ink-500">
                            {kindLabel(lab.kind)}
                          </span>
                          <span className="font-mono text-xs text-ink-400">
                            {lab.minutes} min
                          </span>
                        </div>

                        <h4 className="text-title relative mt-5 text-navy-950">
                          {lab.title}
                        </h4>
                        <p className="relative mt-3 line-clamp-4 text-sm leading-relaxed text-ink-600">
                          {lab.summary}
                        </p>

                        <ul className="relative mt-4 flex flex-wrap gap-1.5">
                          {lab.topics.slice(0, 2).map((topic) => (
                            <li
                              key={topic}
                              className="rounded-full bg-violet-50 px-2.5 py-1 text-[0.6875rem] text-violet-700"
                            >
                              {topic}
                            </li>
                          ))}
                        </ul>

                        <span className="relative mt-auto inline-flex items-center gap-1.5 pt-6 text-sm font-medium text-navy-900">
                          Open lab
                          <ArrowIcon />
                        </span>
                      </Link>
                    </Reveal>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {withoutLabs.length > 0 ? (
            <Reveal className="mt-12">
              <div className="rounded-2xl border border-ink-200 bg-white p-6">
                <h3 className="text-[1.0625rem] font-semibold text-navy-950">
                  Why some courses have no lab here
                </h3>
                <p className="mt-2.5 max-w-3xl text-sm leading-relaxed text-ink-600">
                  {withoutLabs.map((course) => course.title).join(", ")} are taught in
                  the classroom rather than in this playground. Their syllabus is not
                  SQL-executable — a Python interpreter, a Selenium grid, a Power BI
                  desktop file and a cloud subscription cannot be honestly faked in a
                  browser tab, and a console that only pretends to run them would
                  teach the wrong thing.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {withoutLabs.map((course) => (
                    <Link
                      key={course.slug}
                      href={`/courses/${course.slug}`}
                      className="rounded-full border border-ink-200 px-3 py-1.5 text-xs font-medium text-navy-900 transition-colors hover:border-navy-300 hover:bg-ink-50"
                    >
                      {course.title}
                    </Link>
                  ))}
                </div>
              </div>
            </Reveal>
          ) : null}
        </Container>
      </Section>

      <JsonLd data={breadcrumbSchema([{ name: "Playground", href: "/playground" }])} />
    </>
  );
}

function Metric({ value, label }: { value: number; label: string }) {
  return (
    <div className="border-l border-ink-200 pl-3 first:border-l-0 first:pl-0">
      <dt className="text-xs text-ink-500">{label}</dt>
      <dd className="mt-1 font-mono text-2xl font-semibold text-navy-900 tabular-nums">
        {value}
      </dd>
    </div>
  );
}

function kindLabel(kind: string): string {
  const map: Record<string, string> = {
    query: "Query lab",
    "etl-pipeline": "Simulator",
    validation: "Test lab",
    scd: "Simulator",
    schema: "Visualiser",
    challenges: "Graded",
    interview: "Interview",
  };
  return map[kind] ?? kind;
}
