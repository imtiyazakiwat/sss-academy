import type { Metadata } from "next";

import { JsonLd } from "@/components/JsonLd";
import { PlacementStories } from "@/components/site/PlacementStories";
import { PlacementsHero } from "@/components/site/PlacementsHero";
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
      <PlacementsHero
        eyebrow="Learner outcomes"
        breadcrumbLabel="Placements"
        themes={learnerThemes}
        footnote={`${placements.length} learner reflections, shared in their own words.`}
      />

      <Section className="py-16 sm:py-24">
        <Container>
          <PlacementStories stories={placements} />
        </Container>
      </Section>

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
