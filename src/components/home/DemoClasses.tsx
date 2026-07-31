import { Reveal } from "@/components/motion/Reveal";
import { ArrowIcon, ButtonLink } from "@/components/ui/Button";
import { Container, Section, SectionHeader } from "@/components/ui/Section";
import type { Video } from "@/lib/cms/videos";

/**
 * "Watch Our Demo Classes" — YouTube embeds managed from the admin panel.
 * Nothing renders when there are no active videos, so the homepage stays clean
 * until staff adds content.
 */
export function DemoClasses({ videos }: { videos: Video[] }) {
  if (videos.length === 0) return null;

  const youtube = "https://www.youtube.com/@sssacademy-g6s";

  return (
    <Section tone="muted">
      <Container>
        <Reveal>
          <SectionHeader
            align="center"
            title="Watch Our Demo Classes"
            description="Get a glimpse of our teaching methodology and expert faculty through these comprehensive demo lectures."
          />
        </Reveal>

        <div className="mx-auto mt-12 grid max-w-4xl gap-8 sm:grid-cols-2">
          {videos.map((video, i) => (
            <Reveal key={video.id} delay={i * 100} direction="up">
              <div className="overflow-hidden rounded-2xl border border-ink-200 bg-white shadow-subtle transition-shadow duration-300 hover:shadow-lift">
                <div className="relative aspect-video w-full">
                  <iframe
                    src={`https://www.youtube.com/embed/${video.youtubeId}`}
                    title={video.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    loading="lazy"
                    className="absolute inset-0 h-full w-full"
                  />
                </div>
                <div className="p-4">
                  <h3 className="text-sm font-semibold text-navy-950 sm:text-[0.9375rem]">
                    {video.title}
                  </h3>
                  {video.description ? (
                    <p className="mt-1.5 text-xs leading-relaxed text-ink-600 sm:text-sm">
                      {video.description}
                    </p>
                  ) : null}
                </div>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal delay={videos.length * 100 + 100} className="mt-10 text-center">
          <ButtonLink
            href={youtube}
            variant="ghost"
            size="lg"
          >
            <svg viewBox="0 0 16 16" aria-hidden="true" className="size-4">
              <path d="M5.5 3.5 12 8l-6.5 4.5V3.5Z" fill="currentColor" />
            </svg>
            Watch More Demo Classes
            <ArrowIcon />
          </ButtonLink>
        </Reveal>
      </Container>
    </Section>
  );
}
