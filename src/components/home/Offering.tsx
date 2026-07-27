import { Reveal } from "@/components/motion/Reveal";
import { CourseCard } from "@/components/site/CourseCard";
import { ArrowIcon, ButtonLink } from "@/components/ui/Button";
import { Container, Section, SectionHeader } from "@/components/ui/Section";
import { courses, featuredCourses } from "@/content/courses";

export function Offering() {
  return (
    <Section id="courses">
      <Container>
        <Reveal className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
          <SectionHeader
            eyebrow="What we teach"
            title="Six core tracks, and five more to specialise with"
            description="Every track runs one to three months, ends in real-time project work, and includes interview preparation."
          />
          <ButtonLink href="/courses" variant="ghost" className="shrink-0">
            All {courses.length} courses
            <ArrowIcon />
          </ButtonLink>
        </Reveal>

        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {featuredCourses.map((course, i) => (
            <Reveal key={course.slug} delay={(i % 3) * 80} scale={0.98}>
              <CourseCard course={course} className="h-full" />
            </Reveal>
          ))}
        </div>
      </Container>
    </Section>
  );
}
