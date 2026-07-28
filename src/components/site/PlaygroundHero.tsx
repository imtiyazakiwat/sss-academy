import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";

import { ArrowIcon, ButtonLink } from "@/components/ui/Button";

/**
 * Playground hero, composed against the artwork itself.
 *
 * The source render is 1536×1024 with an empty band at the top; the shipped
 * asset is cropped to 1536×914 so the scene sits tighter under the header. Two
 * areas are kept deliberately clear: a cream panel on the left (usable down to
 * y≈456 before the stack of books starts) and desk space on the right.
 *
 * From `xl` up, the image stays in normal flow and therefore *defines* the stage
 * height — no aspect-ratio guess, no `object-cover` crop — while the copy is
 * pinned over it at percentages measured off the render. Type is sized in `em`
 * against a stage root of `100cqw / 96`, so one em is 16px at the design width
 * and the composition scales with the image rather than drifting across it.
 *
 * Below `xl` the same nodes reflow into a stacked layout with an absolute type
 * scale, which keeps the copy readable on a phone. Positions ride on CSS
 * variables so the breakpoint switch stays in the class list and each piece of
 * copy exists in the DOM exactly once.
 */

const stage = { width: 1536, height: 914 };

/** Left, top and width in stage percentages, read off the render. */
type Pin = CSSProperties & { "--l": string; "--t": string; "--w": string };

const pos: Record<"headline" | "blurb" | "card", Pin> = {
  headline: { "--l": "6.4%", "--t": "8.6%", "--w": "30%" },
  blurb: { "--l": "6.4%", "--t": "41.8%", "--w": "28%" },
  card: { "--l": "63%", "--t": "38.9%", "--w": "28.8%" },
};

/** Applied at xl only, so the same node is static in the stacked layout. */
const pinned =
  "xl:absolute xl:left-[var(--l)] xl:top-[var(--t)] xl:w-[var(--w)] xl:mt-0 xl:px-0 xl:pt-0";

const column = "mx-auto w-full max-w-6xl px-5 sm:px-8 xl:max-w-none xl:px-0";

type Metric = { value: number; label: string; icon: keyof typeof icons };

export function PlaygroundHero({
  metrics,
  primary,
  secondary,
}: {
  metrics: [Metric, Metric, Metric, Metric];
  primary: { label: string; href: string };
  secondary: { label: string; href: string };
}) {
  return (
    <section className="relative isolate overflow-hidden border-b border-navy-900/10 bg-[#f2efe6]">
      <div className="relative flex flex-col pb-12 xl:block xl:pb-0 xl:text-[calc(100cqw/96)] xl:[container-type:inline-size]">
        {/* In flow at every width, so the stage height is always the image's. */}
        <div className="order-3 mt-8 xl:order-none xl:mt-0">
          <Image
            src="/img/playground-bg.webp"
            alt="An illustrated desk with a laptop running a SQL query against a customer table, a SQLite jar, a schema notebook and a stack of SQL reference books"
            width={stage.width}
            height={stage.height}
            priority
            sizes="100vw"
            className="w-full"
          />
        </div>

        <div
          className={`order-1 pt-10 ${column} ${pinned}`}
          style={pos.headline}
        >
          <p className="inline-flex items-center rounded-full border border-navy-900/15 bg-[#fffdf8]/70 px-[1.05em] py-[0.6em] text-xs font-semibold tracking-[0.14em] text-navy-800 uppercase backdrop-blur-[2px] xl:text-[0.83em]">
            Practice lab
          </p>

          <h1 className="mt-5 text-[clamp(2.5rem,5.6vw,3.75rem)] leading-[1.03] font-bold tracking-[-0.045em] text-navy-900 xl:mt-[0.42em] xl:text-[4.5em] xl:leading-[1.02]">
            Stop reading about SQL. <span className="text-navy-600">Run it.</span>
          </h1>
        </div>

        <p
          className={`order-2 mt-6 max-w-2xl text-base leading-7 font-medium text-navy-800 ${column} ${pinned} xl:max-w-none xl:text-[0.95em] xl:leading-[1.5]`}
          style={pos.blurb}
        >
          A real SQLite database, seeded with a warehouse and a deliberately
          dirty ETL feed, running entirely in your browser. Write a query and see
          real rows.
        </p>

        <div
          className={`order-4 mt-8 text-[0.95rem] ${column} ${pinned} xl:text-[1em]`}
          style={pos.card}
        >
          <MetricCard
            metrics={metrics}
            primary={primary}
            secondary={secondary}
          />
        </div>
      </div>
    </section>
  );
}

function MetricCard({
  metrics,
  primary,
  secondary,
}: {
  metrics: Metric[];
  primary: { label: string; href: string };
  secondary: { label: string; href: string };
}) {
  return (
    <div className="rounded-[1.1em] border border-navy-900/12 bg-[#fffdf8] p-[1.5em] shadow-[0.5em_0.5em_0_0_#e7b94d]">
      <dl className="grid grid-cols-2 gap-x-[1.1em] gap-y-[1.15em]">
        {metrics.map((metric) => (
          <div key={metric.label} className="flex items-center gap-[0.65em]">
            <span
              aria-hidden="true"
              className="grid size-[2.3em] shrink-0 place-items-center rounded-[0.55em] bg-navy-100 text-navy-700"
            >
              {icons[metric.icon]}
            </span>
            <div className="min-w-0">
              <dt className="text-[0.8em] leading-tight font-medium text-ink-500">
                {metric.label}
              </dt>
              <dd className="text-[1.6em] leading-tight font-semibold tracking-[-0.03em] text-navy-900 tabular-nums">
                {metric.value}
              </dd>
            </div>
          </div>
        ))}
      </dl>

      <div className="mt-[1.35em] flex flex-col gap-[0.55em]">
        <ButtonLink
          href={primary.href}
          className="h-[2.9em] w-full px-[1.5em] text-[1em]"
        >
          {primary.label}
          <ArrowIcon />
        </ButtonLink>
        <Link
          href={secondary.href}
          className="inline-flex h-[2.9em] w-full items-center justify-center rounded-full border border-navy-900/20 px-[1.5em] text-[1em] font-medium text-navy-900 transition-colors hover:border-navy-900/45 hover:bg-navy-50"
        >
          {secondary.label}
        </Link>
      </div>

      <p className="mt-[1.15em] border-t border-ink-200 pt-[1.05em] text-[0.84em] leading-[1.5] text-ink-600">
        Nothing is installed and nothing is uploaded. The database is created in
        your browser and reset with one click.
      </p>
    </div>
  );
}

/** Small line icons, drawn at 1.3em so they scale with the card. */
const icons = {
  flask: (
    <svg viewBox="0 0 20 20" fill="none" className="size-[1.3em]">
      <path
        d="M8 2.5h4M8.5 2.5v4.2L5 14a2 2 0 0 0 1.8 3h6.4A2 2 0 0 0 15 14l-3.5-7.3V2.5"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  table: (
    <svg viewBox="0 0 20 20" fill="none" className="size-[1.3em]">
      <rect
        x="2.8"
        y="3.5"
        width="14.4"
        height="13"
        rx="1.6"
        stroke="currentColor"
        strokeWidth="1.4"
      />
      <path d="M2.8 8h14.4M8 8v8.5" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  ),
  trophy: (
    <svg viewBox="0 0 20 20" fill="none" className="size-[1.3em]">
      <path
        d="M6.5 3.5h7v3.2a3.5 3.5 0 0 1-7 0V3.5ZM6.5 4.6H4.3v1a2.4 2.4 0 0 0 2.2 2.3M13.5 4.6h2.2v1a2.4 2.4 0 0 1-2.2 2.3M10 10.2v3.3M7 16.5h6"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  chat: (
    <svg viewBox="0 0 20 20" fill="none" className="size-[1.3em]">
      <path
        d="M3.2 6.2A2.2 2.2 0 0 1 5.4 4h9.2a2.2 2.2 0 0 1 2.2 2.2v5.1a2.2 2.2 0 0 1-2.2 2.2H8.9L5 16.4v-2.9a2.2 2.2 0 0 1-1.8-2.2V6.2Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </svg>
  ),
} as const;
