import { CountUp } from "@/components/motion/CountUp";
import { Reveal } from "@/components/motion/Reveal";
import { PlacementCard } from "@/components/site/PlacementCard";
import { ArrowIcon, ButtonLink } from "@/components/ui/Button";
import { Container, Section, SectionHeader } from "@/components/ui/Section";
import { stats } from "@/content/about";
import {
  averagePackage,
  highestPackage,
  placementsByPackage,
} from "@/content/placements";

/**
 * The "proof" beat — the heaviest lifting on the page.
 *
 * Numbers first (cheap to scan, hard to argue with), then named students with
 * their actual packages, then a route to all 23 stories. Company names stay as
 * "MNC" because that is how they were published on the original site.
 */
export function Proof() {
  const featured = placementsByPackage.slice(0, 6);

  return (
    <Section tone="dark" className="overflow-hidden">
      <div
        aria-hidden="true"
        className="grid-lines-dark pointer-events-none absolute inset-0 opacity-70"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-1/4 -left-40 size-[30rem] rounded-full bg-navy-500/20 blur-[120px]"
      />

      <Container className="relative">
        <Reveal>
          <SectionHeader
            tone="dark"
            eyebrow="Proof"
            title="1000+ students placed. Here is what that looks like."
            description="Packages from ₹5.5 LPA to ₹20 LPA, mostly into ETL and automation testing roles at multinationals in Bengaluru and Pune."
          />
        </Reveal>

        <dl className="mt-14 grid gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 sm:grid-cols-3">
          {stats.map((stat, i) => (
            <Reveal
              key={stat.label}
              delay={i * 100}
              className="bg-navy-950/80 px-7 py-8 backdrop-blur"
            >
              <dt className="text-eyebrow uppercase text-navy-400">
                {stat.label}
              </dt>
              <dd className="mt-3 text-4xl font-semibold tracking-[-0.04em] text-white sm:text-5xl">
                <CountUp value={stat.value} suffix={stat.suffix} />
              </dd>
            </Reveal>
          ))}
        </dl>

        <Reveal
          delay={120}
          className="mt-4 grid gap-4 sm:grid-cols-2"
        >
          <Highlight
            value={`₹${highestPackage.toFixed(2)} LPA`}
            label="Highest package on record"
          />
          <Highlight
            value={`₹${averagePackage.toFixed(2)} LPA`}
            label="Average across published placements"
          />
        </Reveal>

        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((placement, i) => (
            <Reveal key={placement.slug} delay={(i % 3) * 80} scale={0.98}>
              <PlacementCard placement={placement} compact />
            </Reveal>
          ))}
        </div>

        <Reveal delay={100} className="mt-10 flex justify-center">
          <ButtonLink href="/placements" variant="onDark" size="lg">
            Read all {placementsByPackage.length} placement stories
            <ArrowIcon />
          </ButtonLink>
        </Reveal>
      </Container>
    </Section>
  );
}

function Highlight({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 rounded-2xl border border-ember-400/25 bg-ember-500/10 px-7 py-5">
      <span className="text-2xl font-semibold tracking-[-0.03em] text-white">
        {value}
      </span>
      <span className="text-right text-xs text-ember-200">{label}</span>
    </div>
  );
}
