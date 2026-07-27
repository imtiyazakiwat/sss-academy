import { Reveal } from "@/components/motion/Reveal";
import { Container } from "@/components/ui/Section";

/**
 * The trust band sits where a hiring-partner logo wall normally goes.
 *
 * We don't have one: the legacy site published every placement's employer as
 * "MNC", so putting real company logos here would be a claim the institute has
 * never made. Instead the band carries the technology stack students are
 * trained on — verifiable from the course catalogue, and the same keywords
 * prospects actually search for.
 */
const stack = [
  "SQL",
  "Python",
  "ETL Testing",
  "PySpark",
  "Power BI",
  "Snowflake",
  "Databricks",
  "Azure Data Factory",
  "Automation Testing",
  "Data Warehousing",
  "NumPy",
];

const features = [
  {
    title: "Expert Mentors",
    body: "Learn from a 26-year industry practitioner",
    tint: "bg-violet-100 text-violet-700",
    icon: "M10 9.6a2.9 2.9 0 1 0 0-5.8 2.9 2.9 0 0 0 0 5.8Zm-5.4 6.6v-.8c0-2 2.4-3.6 5.4-3.6s5.4 1.6 5.4 3.6v.8",
  },
  {
    title: "Hands-on Projects",
    body: "Real-time scenarios in every track",
    tint: "bg-mint-100 text-mint-700",
    icon: "M7.4 6.6 4 10l3.4 3.4M12.6 6.6 16 10l-3.4 3.4M11.2 5.2 8.8 14.8",
  },
  {
    title: "Placement Support",
    body: "Resume guidance and job-search help",
    tint: "bg-ember-50 text-ember-600",
    icon: "M3.4 15.6h13.2M5.2 15.6V9.4M9.4 15.6V5.8M13.6 15.6v-4.4M16.4 4.8 13 8.2l-2.6-2L5.8 9.8",
  },
  {
    title: "Interview Prep",
    body: "Mock interviews until it feels routine",
    tint: "bg-violet-100 text-violet-700",
    icon: "M4 4.8h12a1 1 0 0 1 1 1v6.4a1 1 0 0 1-1 1H8.8L5.6 16v-2.8H4a1 1 0 0 1-1-1V5.8a1 1 0 0 1 1-1Z",
  },
  {
    title: "One to Three Months",
    body: "Short, focused tracks by design",
    tint: "bg-navy-100 text-navy-700",
    icon: "M10 5.4v4.9l3.2 2M10 17a7 7 0 1 0 0-14 7 7 0 0 0 0 14Z",
  },
];

export function TrustBand() {
  return (
    <section className="py-16 sm:py-20">
      <Container className="max-w-7xl">
        <Reveal>
          <p className="text-center text-[0.9375rem] font-semibold text-navy-950">
            Trusted by students. Trained on the tools employers hire for.
          </p>
        </Reveal>

        <Reveal delay={80} className="mt-7">
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {stack.slice(0, 6).map((tech) => (
              <li
                key={tech}
                className="flex h-16 items-center justify-center rounded-xl border border-ink-200 bg-white px-3 text-center text-sm font-semibold tracking-tight text-navy-800 shadow-subtle transition-[transform,border-color] duration-300 ease-[var(--ease-out-expo)] hover:-translate-y-0.5 hover:border-violet-300"
              >
                {tech}
              </li>
            ))}
          </ul>
        </Reveal>

        <Reveal delay={140} className="mt-3">
          <ul className="flex flex-wrap justify-center gap-2">
            {stack.slice(6).map((tech) => (
              <li
                key={tech}
                className="rounded-full border border-ink-200 bg-ink-50 px-3.5 py-1.5 text-xs font-medium text-ink-600"
              >
                {tech}
              </li>
            ))}
          </ul>
        </Reveal>

        <Reveal delay={200} className="mt-12">
          <ul className="grid gap-y-8 border-t border-ink-200 pt-10 sm:grid-cols-2 lg:grid-cols-5 lg:gap-x-6">
            {features.map((feature) => (
              <li
                key={feature.title}
                className="flex gap-3.5 lg:border-l lg:border-ink-100 lg:pl-5 lg:first:border-l-0 lg:first:pl-0"
              >
                <span
                  className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${feature.tint}`}
                >
                  <svg
                    viewBox="0 0 20 20"
                    aria-hidden="true"
                    className="size-5"
                    fill="none"
                  >
                    <path
                      d={feature.icon}
                      stroke="currentColor"
                      strokeWidth="1.4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
                <span>
                  <span className="block text-sm font-semibold text-navy-950">
                    {feature.title}
                  </span>
                  <span className="mt-0.5 block text-xs leading-relaxed text-ink-500">
                    {feature.body}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </Reveal>
      </Container>
    </section>
  );
}
