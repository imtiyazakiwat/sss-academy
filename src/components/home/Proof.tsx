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
        <MarqueeRow items={row1} direction="left" duration="64s" />
        {/* Row 2 — scrolls right for a dynamic opposing feel */}
        <MarqueeRow items={row2} direction="right" duration="78s" className="mt-2" />
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

/**
 * One infinite-scroll row of placement cards.
 *
 * The track holds two identical groups and translates by exactly -50%, so the
 * loop restarts on a frame that is pixel-identical to the first one. Spacing
 * lives on the cards (px-2) rather than on a flex `gap`, otherwise the trailing
 * gap is not part of the duplicated set and the row visibly jumps every cycle.
 */
function MarqueeRow({
  items,
  direction,
  duration,
  className,
}: {
  items: (typeof placementsByPackage)[number][];
  direction: "left" | "right";
  duration: string;
  className?: string;
}) {
  return (
    <div className={`overflow-hidden ${className ?? ""}`}>
      <div
        className="flex w-max will-change-transform hover:[animation-play-state:paused] motion-reduce:[animation-play-state:paused]"
        style={{
          animationName: "marquee",
          animationDuration: duration,
          animationTimingFunction: "linear",
          animationIterationCount: "infinite",
          animationDirection: direction === "right" ? "reverse" : "normal",
        }}
      >
        <MarqueeGroup items={items} />
        <MarqueeGroup items={items} clone />
      </div>
    </div>
  );
}

/** Half of a marquee track. The clone is hidden from assistive tech. */
function MarqueeGroup({
  items,
  clone = false,
}: {
  items: (typeof placementsByPackage)[number][];
  clone?: boolean;
}) {
  return (
    <div className="flex shrink-0 items-stretch" aria-hidden={clone || undefined}>
      {items.map((placement) => (
        <div
          key={placement.slug}
          className="w-[19rem] shrink-0 px-2 sm:w-[21rem]"
        >
          <PlacementCard placement={placement} compact />
        </div>
      ))}
    </div>
  );
}

