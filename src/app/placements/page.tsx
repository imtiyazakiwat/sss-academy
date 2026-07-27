import type { Metadata } from "next";

import { JsonLd } from "@/components/JsonLd";
import { CountUp } from "@/components/motion/CountUp";
import { Reveal } from "@/components/motion/Reveal";
import { CtaBand } from "@/components/site/CtaBand";
import { PageHero } from "@/components/site/PageHero";
import { PlacementCard } from "@/components/site/PlacementCard";
import { Container, Section } from "@/components/ui/Section";
import {
  averagePackage,
  highestPackage,
  placements,
  placementsByPackage,
} from "@/content/placements";
import { breadcrumbSchema } from "@/lib/schema";
import { site } from "@/content/site";

export const metadata: Metadata = {
  title: "Placements & student success stories",
  description:
    "Real placement records from SSS Academy: 23 published student stories with packages from ₹5.50 LPA to ₹20.00 LPA in ETL testing, automation testing and big data roles.",
  alternates: { canonical: "/placements" },
};

const roleCounts = placements.reduce<Record<string, number>>((acc, p) => {
  acc[p.role] = (acc[p.role] ?? 0) + 1;
  return acc;
}, {});

const locations = Array.from(
  new Set(placements.map((p) => p.location).filter(Boolean)),
) as string[];

/**
 * Aggregate rating is built from the published testimonials themselves. Every
 * one of the 23 records on the legacy site was a positive review, so the count
 * is real even though the source never captured numeric scores — we therefore
 * publish the count and packages, and deliberately do not fabricate a star rating.
 */
export default function PlacementsPage() {
  return (
    <>
      <PageHero
        eyebrow="Placements"
        title="1000+ placed. 23 stories in their own words."
        description="Every quote below is exactly as the student gave it. Companies are listed as 'MNC' because that is how they were published — we would rather under-claim than invent a logo wall."
        breadcrumb={[{ name: "Placements", href: "/placements" }]}
        aside={
          <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10">
            <Fact
              value={`₹${highestPackage.toFixed(2)}`}
              unit="LPA"
              label="Highest package"
            />
            <Fact
              value={`₹${averagePackage.toFixed(2)}`}
              unit="LPA"
              label="Published average"
            />
            <Fact value={`${placements.length}`} label="Stories published" />
            <Fact value="1000+" label="Total placed" />
          </dl>
        }
      />

      <Section className="py-14 sm:py-16">
        <Container>
          <Reveal>
            <dl className="grid gap-px overflow-hidden rounded-2xl border border-ink-200 bg-ink-200 sm:grid-cols-3">
              <Stat label="Students placed to date">
                <CountUp value={1000} suffix="+" />
              </Stat>
              <Stat label="Roles represented below">
                <CountUp value={Object.keys(roleCounts).length} />
              </Stat>
              <Stat label="Cities named in stories">
                <CountUp value={locations.length} />
              </Stat>
            </dl>
          </Reveal>

          <Reveal delay={80} className="mt-6">
            <p className="text-sm text-ink-500">
              Roles:{" "}
              {Object.entries(roleCounts)
                .sort((a, b) => b[1] - a[1])
                .map(([role, count]) => `${role} (${count})`)
                .join(" · ")}
              {locations.length ? ` · Locations: ${locations.join(", ")}` : ""}
            </p>
          </Reveal>
        </Container>
      </Section>

      <Section tone="muted" className="pt-4 pb-20 sm:pb-24">
        <Container>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {placementsByPackage.map((placement, i) => (
              <Reveal
                key={placement.slug}
                delay={(i % 3) * 70}
                scale={0.98}
                threshold={0.05}
              >
                <PlacementCard placement={placement} className="h-full" />
              </Reveal>
            ))}
          </div>
        </Container>
      </Section>

      <CtaBand
        eyebrow="Your turn"
        title="These were all beginners once"
        body="Most of the students above started with SQL and no IT job. Book a free counselling call and we'll map the same path for your background."
      />

      <JsonLd
        data={breadcrumbSchema([{ name: "Placements", href: "/placements" }])}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: `Student placements at ${site.name}`,
          numberOfItems: placements.length,
          itemListElement: placementsByPackage.map((p, index) => ({
            "@type": "ListItem",
            position: index + 1,
            item: {
              "@type": "Review",
              author: { "@type": "Person", name: p.name },
              reviewBody: p.quote,
              itemReviewed: { "@id": `${site.url}/#organization` },
            },
          })),
        }}
      />
    </>
  );
}

function Fact({
  value,
  unit,
  label,
}: {
  value: string;
  unit?: string;
  label: string;
}) {
  return (
    <div className="bg-navy-950/70 px-5 py-4 backdrop-blur">
      <dt className="text-eyebrow uppercase text-navy-400">{label}</dt>
      <dd className="mt-1.5 text-2xl font-semibold tracking-[-0.03em] text-white">
        {value}
        {unit ? (
          <span className="ml-1 text-xs font-medium text-navy-300">{unit}</span>
        ) : null}
      </dd>
    </div>
  );
}

function Stat({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white px-7 py-7">
      <dt className="text-eyebrow uppercase text-ink-400">{label}</dt>
      <dd className="mt-2.5 text-4xl font-semibold tracking-[-0.04em] text-navy-950">
        {children}
      </dd>
    </div>
  );
}
