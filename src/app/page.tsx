import type { Metadata } from "next";

import { JsonLd } from "@/components/JsonLd";
import { Approach } from "@/components/home/Approach";
import { Hero } from "@/components/home/Hero";
import { Offering } from "@/components/home/Offering";
import { Problem } from "@/components/home/Problem";
import { Proof } from "@/components/home/Proof";
import { StatsStrip } from "@/components/home/StatsStrip";
import { TrustBand } from "@/components/home/TrustBand";
import { CtaBand } from "@/components/site/CtaBand";
import { Faq } from "@/components/site/Faq";
import { FounderBlock } from "@/components/site/FounderBlock";
import { faqSchema } from "@/lib/schema";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

/**
 * Homepage narrative:
 *   hero (promise + proof) → stats → trust/stack → problem → approach →
 *   offering → proof → founder → objections → close
 *
 * Each beat answers the question the previous one raises, so the CTAs land at
 * decision points rather than being sprinkled at fixed intervals.
 */
export default function HomePage() {
  return (
    <>
      <Hero />
      <StatsStrip />
      <TrustBand />
      <Problem />
      <Approach />
      <Offering />
      <Proof />
      <FounderBlock tone="light" />
      <Faq />
      <CtaBand />
      <JsonLd data={faqSchema} />
    </>
  );
}
