import type { Metadata } from "next";

import { JsonLd } from "@/components/JsonLd";
import { Approach } from "@/components/home/Approach";
import { Hero } from "@/components/home/Hero";
import { Problem } from "@/components/home/Problem";
import { Proof } from "@/components/home/Proof";
import { StatsStrip } from "@/components/home/StatsStrip";
import { Faq } from "@/components/site/Faq";
import { FounderBlock } from "@/components/site/FounderBlock";
import { faqSchema } from "@/lib/schema";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

export default function HomePage() {
  return (
    <>
      <Hero />
      <StatsStrip />
      <Problem />
      <Approach />
      <Proof />
      <FounderBlock tone="light" />
      <Faq />
      <JsonLd data={faqSchema} />
    </>
  );
}
