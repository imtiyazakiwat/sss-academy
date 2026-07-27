import type { Metadata } from "next";

import { JsonLd } from "@/components/JsonLd";
import { CtaBand } from "@/components/site/CtaBand";
import { PageHero } from "@/components/site/PageHero";
import { PlacementStories } from "@/components/site/PlacementStories";
import { Container, Section } from "@/components/ui/Section";
import { placements } from "@/content/placements";
import { site } from "@/content/site";
import { breadcrumbSchema } from "@/lib/schema";

export const metadata: Metadata = {
  title: "Placement stories — learner journeys at SSS Academy",
  description:
    "Read learner stories about practical IT training, interview preparation, mentorship and career progress at SSS Academy.",
  alternates: { canonical: "/placements" },
};

const learnerThemes = [
  {
    title: "Practical learning",
    body: "SQL, ETL and testing concepts connected to real working scenarios.",
  },
  {
    title: "Interview confidence",
    body: "Mock interviews and preparation that made the next step feel possible.",
  },
  {
    title: "Support that stayed",
    body: "Patient guidance through learning, questions and career decisions.",
  },
];

export default function PlacementsPage() {
  return (
    <>
      <PageHero
        variant="proof"
        eyebrow="Learner outcomes"
        title="Careers built through practice."
        description="These learners arrived with different backgrounds and goals. What connects their stories is practical work, consistent guidance and the confidence to take a meaningful next step."
        breadcrumb={[{ name: "Placements", href: "/placements" }]}
        aside={
          <article className="border border-navy-900/15 bg-[#fffdf8] shadow-[8px_8px_0_0_#d95d39]">
            <header className="border-b border-ink-200 px-5 py-4 sm:px-6">
              <p className="text-[0.6875rem] font-semibold tracking-[0.14em] text-ember-700 uppercase">
                What learners mention most
              </p>
            </header>
            <ol className="divide-y divide-ink-200 px-5 sm:px-6">
              {learnerThemes.map((theme, index) => (
                <li key={theme.title} className="grid grid-cols-[2rem_1fr] gap-3 py-4">
                  <span className="font-mono text-xs font-semibold text-navy-400">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-navy-950">
                      {theme.title}
                    </p>
                    <p className="mt-1 text-xs leading-5 text-ink-500">
                      {theme.body}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
            <footer className="border-t border-ink-200 bg-[#f8f3e9] px-5 py-3 text-xs text-ink-500 sm:px-6">
              {placements.length} learner reflections, shared in their own words.
            </footer>
          </article>
        }
      />

      <Section className="py-16 sm:py-24">
        <Container>
          <PlacementStories stories={placements} />
        </Container>
      </Section>

      <CtaBand
        eyebrow="Your next step"
        title="Let's find the right place to begin"
        body="Tell us what you already know and the kind of work you want to move toward. We'll suggest a practical learning path without pressure."
        primaryLabel="Talk to a counsellor"
      />

      <JsonLd
        data={breadcrumbSchema([{ name: "Placements", href: "/placements" }])}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: `Learner stories at ${site.name}`,
          numberOfItems: placements.length,
          itemListElement: placements.map((placement, index) => ({
            "@type": "ListItem",
            position: index + 1,
            item: {
              "@type": "Review",
              author: { "@type": "Person", name: placement.name },
              reviewBody: placement.quote,
              itemReviewed: { "@id": `${site.url}/#organization` },
            },
          })),
        }}
      />
    </>
  );
}
