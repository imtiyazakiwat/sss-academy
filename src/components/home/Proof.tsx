import { Reveal } from "@/components/motion/Reveal";
import { PlacementCard } from "@/components/site/PlacementCard";
import { ArrowIcon, ButtonLink } from "@/components/ui/Button";
import { Container, Section, SectionHeader } from "@/components/ui/Section";
import { placementsByPackage } from "@/content/placements";

/**
 * The "proof" beat — the heaviest lifting on the page.
 *
 * Numbers first (cheap to scan, hard to argue with), then named students with
 * their actual packages scrolling in an infinite marquee, then a route to all
 * stories. Company names stay as "MNC" — published that way on the original site.
 */
export function Proof() {
  // Split placements into two rows; pad each to at least 6 cards
  const all = placementsByPackage;
  const half = Math.ceil(all.length / 2);
  const row1 = all.slice(0, half);
  const row2 = all.slice(half);

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
            title="1,000+ students placed"
            description="₹5.5 LPA to ₹20 LPA packages. ETL and automation testing roles at top companies in Bengaluru and Pune."
            align="center"
          />
        </Reveal>


      </Container>

      {/* Marquee — intentionally full-bleed, overflows Container */}
      <div className="relative mt-14 mask-edges" aria-label="Student placement testimonials">
        {/* Row 1 — scrolls left */}
        <MarqueeRow items={row1} direction="left" />
        {/* Row 2 — scrolls right for a dynamic opposing feel */}
        <MarqueeRow items={row2} direction="right" className="mt-4" />
      </div>

      <Container className="relative">
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

/** One infinite-scroll row of placement cards. */
function MarqueeRow({
  items,
  direction,
  className,
}: {
  items: (typeof placementsByPackage)[number][];
  direction: "left" | "right";
  className?: string;
}) {
  // Duplicate for seamless loop
  const doubled = [...items, ...items];

  return (
    <div
      className={`flex w-max gap-4 ${className ?? ""}`}
      style={{
        animation: `marquee ${direction === "right" ? "50s" : "40s"} linear infinite ${direction === "right" ? "reverse" : ""}`,
      }}
    >
      {doubled.map((placement, i) => (
        <div key={`${placement.slug}-${i}`} className="w-[320px] shrink-0">
          <PlacementCard placement={placement} compact />
        </div>
      ))}
    </div>
  );
}

