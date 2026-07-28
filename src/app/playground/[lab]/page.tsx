import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { LabRenderer } from "@/components/playground/LabRenderer";
import { PlaygroundShell } from "@/components/playground/PlaygroundShell";
import { getCourse } from "@/content/courses";
import { getLab, labs } from "@/content/labs";

/** Every lab is known at build time. */
export function generateStaticParams() {
  return labs.map((lab) => ({ lab: lab.slug }));
}

export async function generateMetadata(
  props: PageProps<"/playground/[lab]">,
): Promise<Metadata> {
  const { lab: slug } = await props.params;
  const lab = getLab(slug);
  if (!lab) return { title: "Lab not found" };

  const course = getCourse(lab.courseSlug);

  return {
    title: lab.title,
    description: lab.summary,
    alternates: { canonical: `/playground/${lab.slug}` },
    openGraph: {
      title: `${lab.title} — interactive lab${course ? ` for ${course.title}` : ""}`,
      description: lab.summary,
      url: `/playground/${lab.slug}`,
    },
  };
}

export default async function LabPage(props: PageProps<"/playground/[lab]">) {
  const { lab: slug } = await props.params;
  const lab = getLab(slug);
  if (!lab) notFound();

  return (
    <PlaygroundShell lab={lab}>
      <LabRenderer lab={lab} />
    </PlaygroundShell>
  );
}
