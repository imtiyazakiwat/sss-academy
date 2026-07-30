import type { Metadata } from "next";

import { JsonLd } from "@/components/JsonLd";
import { Approach } from "@/components/home/Approach";
import { DemoClasses } from "@/components/home/DemoClasses";
import { Hero } from "@/components/home/Hero";
import { Problem } from "@/components/home/Problem";
import { Proof } from "@/components/home/Proof";
import { StatsStrip } from "@/components/home/StatsStrip";
import { AnnouncementPopup } from "@/components/site/AnnouncementPopup";
import { Faq } from "@/components/site/Faq";
import { FounderBlock } from "@/components/site/FounderBlock";
import { getActiveBanners } from "@/lib/cms/banners";
import { getCourses } from "@/lib/cms/courses";
import { getPlacements } from "@/lib/cms/placements";
import { getTeam } from "@/lib/cms/team";
import { getActiveVideos } from "@/lib/cms/videos";
import { faqSchema } from "@/lib/schema";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

/**
 * Both catalogues are loaded once here and passed down. The sections below are
 * presentational — keeping the reads in one place means one cache hit per
 * render rather than four.
 */
export default async function HomePage() {
  const [{ courses }, { placements, byPackage }, { founder }, banners, videos] =
    await Promise.all([
      getCourses(),
      getPlacements(),
      getTeam(),
      getActiveBanners(),
      getActiveVideos(),
    ]);

  return (
    <>
      <AnnouncementPopup banners={banners} />
      <Hero placements={placements} />
      <StatsStrip courseCount={courses.length} storyCount={placements.length} />
      <Problem />
      <Approach />
      <DemoClasses videos={videos} />
      <Proof placements={byPackage} />
      {founder ? <FounderBlock founder={founder} tone="light" /> : null}
      <Faq />
      <JsonLd data={faqSchema} />
    </>
  );
}
