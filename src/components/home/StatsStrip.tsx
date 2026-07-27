import { CountUp } from "@/components/motion/CountUp";
import { Reveal } from "@/components/motion/Reveal";
import { courses } from "@/content/courses";
import { placements } from "@/content/placements";

/**
 * Overlapping stats card, lifted over the hero's lower edge.
 *
 * Every figure here is one the institute actually published: learner reach and
 * experience come from the legacy site, while course and story counts are
 * derived directly from the current content catalogue.
 */
const items = [
  {
    tint: "violet" as const,
    value: <CountUp value={1000} suffix="+" />,
    label: "Learners Supported",
    sub: "Across career journeys",
    icon: (
      <path
        d="M7 10a2.6 2.6 0 1 0 0-5.2A2.6 2.6 0 0 0 7 10Zm0 1.6c-2.6 0-4.6 1.3-4.6 2.9v1.1h9.2v-1.1c0-1.6-2-2.9-4.6-2.9ZM14.4 9.6a2.1 2.1 0 1 0 0-4.2M15 11.7c1.7.2 3 1.3 3 2.6v1.3h-3.2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    ),
  },
  {
    tint: "ember" as const,
    value: <CountUp value={courses.length} />,
    label: "Courses Offered",
    sub: "Across five tracks",
    icon: (
      <path
        d="M2.8 6.4h14.4v8.4a1 1 0 0 1-1 1H3.8a1 1 0 0 1-1-1V6.4Zm4.4 0V5a1 1 0 0 1 1-1h3.6a1 1 0 0 1 1 1v1.4M2.8 9.8h14.4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    ),
  },
  {
    tint: "mint" as const,
    highlight: true,
    value: <CountUp value={placements.length} />,
    label: "Learner Stories",
    sub: "Shared in their words",
    icon: (
      <path
        d="M4 4.5h12v8H9l-3.5 3v-3H4v-8Zm3 3h6M7 10h4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    ),
  },
  {
    tint: "violet" as const,
    value: <CountUp value={26} suffix="+" />,
    label: "Years Experience",
    sub: "Behind every session",
    icon: (
      <path
        d="M10 2.8l2.2 4.5 5 .7-3.6 3.5.9 5-4.5-2.4-4.5 2.4.9-5L2.8 8l5-.7L10 2.8Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    ),
  },
];

const tints = {
  violet: "bg-violet-100 text-violet-700",
  ember: "bg-ember-50 text-ember-600",
  mint: "bg-mint-100 text-mint-700",
};

export function StatsStrip() {
  return (
    <div className="relative z-10 -mt-4 px-5 sm:px-8 lg:-mt-10">
      <Reveal className="mx-auto max-w-7xl">
        <dl className="grid overflow-hidden rounded-2xl border border-ink-200 bg-white shadow-lift sm:grid-cols-2 lg:grid-cols-4">
          {items.map((item, i) => (
            <div
              key={item.label}
              className={[
                "flex items-center gap-4 px-6 py-6",
                i > 0 && "border-t border-ink-100 sm:border-t-0",
                i % 2 === 1 && "sm:border-l sm:border-ink-100",
                i >= 2 && "sm:border-t sm:border-ink-100",
                "lg:border-t-0 lg:border-l lg:first:border-l-0",
                item.highlight && "bg-mint-50/70",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              <span
                className={`flex size-12 shrink-0 items-center justify-center rounded-full ${tints[item.tint]}`}
              >
                <svg viewBox="0 0 20 20" aria-hidden="true" className="size-6">
                  {item.icon}
                </svg>
              </span>
              <span className="min-w-0">
                <dd
                  className={`text-2xl font-semibold tracking-[-0.03em] ${
                    item.highlight ? "text-mint-700" : "text-navy-950"
                  }`}
                >
                  {item.value}
                </dd>
                <dt className="mt-0.5 text-sm font-medium text-navy-900">
                  {item.label}
                </dt>
                <p className="text-xs text-ink-400">{item.sub}</p>
              </span>
            </div>
          ))}
        </dl>
      </Reveal>
    </div>
  );
}
