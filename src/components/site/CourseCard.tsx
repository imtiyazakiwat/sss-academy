import Link from "next/link";

import { ArrowIcon } from "@/components/ui/Button";
import {
  durationLabel,
  trackLabels,
  type Course,
} from "@/content/courses";
import { cn } from "@/lib/cn";

export function CourseCard({
  course,
  className,
}: {
  course: Course;
  className?: string;
}) {
  return (
    <Link
      href={`/courses/${course.slug}`}
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-2xl border border-ink-200 bg-white p-6 shadow-subtle transition-[transform,box-shadow,border-color] duration-300 ease-[var(--ease-out-expo)] hover:-translate-y-1 hover:border-violet-200 hover:shadow-lift",
        className,
      )}
    >
      {/* Hover wash — establishes depth without a heavy image */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 -top-24 h-40 bg-gradient-to-b from-violet-50 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
      />

      <div className="relative flex items-start justify-between gap-4">
        <span className="text-eyebrow rounded-full bg-ink-100 px-2.5 py-1 uppercase text-ink-500">
          {trackLabels[course.track]}
        </span>
        <span className="font-mono text-xs text-ink-400">
          {durationLabel(course.durationMonths)}
        </span>
      </div>

      <h3 className="text-title relative mt-5 text-navy-950">{course.title}</h3>

      <p className="relative mt-2 text-sm font-medium text-violet-700">
        {course.outcome}
      </p>

      <p className="relative mt-3 line-clamp-3 text-sm leading-relaxed text-ink-600">
        {course.summary}
      </p>

      <div className="relative mt-auto flex items-center justify-between pt-6">
        <span className="text-xs text-ink-400">{course.level}</span>
        <span className="inline-flex items-center gap-1.5 text-sm font-medium text-navy-900">
          Syllabus
          <ArrowIcon />
        </span>
      </div>
    </Link>
  );
}
