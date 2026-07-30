"use client";

import { useState } from "react";

import { CourseEditor } from "@/app/admin/(dashboard)/courses/CourseEditor";
import {
  deleteCourseAction,
  toggleCourseAction,
} from "@/app/admin/_actions/courses";
import { Pill } from "@/app/admin/_components/StatusPill";
import { SubmitButton } from "@/app/admin/_components/SubmitButton";
import { Timestamp } from "@/app/admin/_components/Timestamp";
import { durationLabel, trackLabels } from "@/content/courses";
import type { CourseRecord } from "@/lib/cms/courses";

/**
 * A course in the list, with inline edit and a two-step delete.
 *
 * `labCount` comes from the server — playground labs are pinned to this course
 * in code, so deleting it is worth spelling out rather than discovering later.
 */
export function CourseRow({
  course,
  labCount,
}: {
  course: CourseRecord;
  labCount: number;
}) {
  const [editing, setEditing] = useState(false);
  const [confirming, setConfirming] = useState(false);

  return (
    <li className="rounded-xl border border-ink-200 bg-[#fffdf8] p-4 shadow-subtle sm:p-5">
      {editing ? (
        <CourseEditor course={course} onDone={() => setEditing(false)} />
      ) : (
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {course.published ? <Pill tone="good">Live</Pill> : <Pill>Hidden</Pill>}
            {course.featured ? <Pill tone="warn">Featured</Pill> : null}
            <span className="text-[0.6875rem] font-medium text-ink-400">
              order {course.order}
            </span>
            <span className="flex-1" />
            <span className="text-[0.6875rem] font-medium text-ink-400">
              edited <Timestamp ms={course.updatedAtMs} />
            </span>
          </div>

          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <p className="text-[0.9375rem] font-semibold text-navy-950">
              {course.title}
            </p>
            <p className="text-sm text-ink-600">{trackLabels[course.track]}</p>
            <p className="text-sm text-ink-500">
              {durationLabel(course.durationMonths)} · {course.level}
            </p>
          </div>

          <p className="text-sm leading-6 text-ink-600">{course.outcome}</p>

          <p className="text-xs text-ink-500">
            <span className="font-mono">/courses/{course.slug}</span> ·{" "}
            {course.topics.length}{" "}
            {course.topics.length === 1 ? "topic" : "topics"}
            {labCount > 0
              ? ` · ${labCount} playground ${labCount === 1 ? "lab" : "labs"}`
              : ""}
          </p>

          <div className="flex flex-wrap items-center gap-2 border-t border-ink-100 pt-3">
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="h-9 rounded-full border border-ink-200 px-4 text-sm font-medium text-navy-900 hover:border-navy-300 hover:bg-white"
            >
              Edit
            </button>

            <form action={toggleCourseAction}>
              <input type="hidden" name="id" value={course.slug} />
              <input type="hidden" name="field" value="published" />
              <SubmitButton
                variant="ghost"
                size="sm"
                pendingLabel={course.published ? "Hiding…" : "Publishing…"}
              >
                {course.published ? "Hide" : "Show on site"}
              </SubmitButton>
            </form>

            <form action={toggleCourseAction}>
              <input type="hidden" name="id" value={course.slug} />
              <input type="hidden" name="field" value="featured" />
              <SubmitButton variant="ghost" size="sm" pendingLabel="Saving…">
                {course.featured ? "Unfeature" : "Feature"}
              </SubmitButton>
            </form>

            <span className="flex-1" />

            {confirming ? (
              <form
                action={deleteCourseAction}
                className="flex flex-wrap items-center gap-2"
              >
                <input type="hidden" name="id" value={course.slug} />
                <span className="text-xs font-medium text-ember-800">
                  {labCount > 0
                    ? `Delete permanently? ${labCount} playground ${labCount === 1 ? "lab is" : "labs are"} attached to this course.`
                    : "Delete permanently?"}
                </span>
                <SubmitButton
                  variant="secondary"
                  size="sm"
                  pendingLabel="Deleting…"
                >
                  Yes, delete
                </SubmitButton>
                <button
                  type="button"
                  onClick={() => setConfirming(false)}
                  className="h-9 rounded-full px-3 text-sm font-medium text-ink-600 hover:text-navy-900"
                >
                  Cancel
                </button>
              </form>
            ) : (
              <button
                type="button"
                onClick={() => setConfirming(true)}
                className="h-9 rounded-full px-3 text-sm font-medium text-ink-500 hover:text-ember-700"
              >
                Delete
              </button>
            )}
          </div>
        </div>
      )}
    </li>
  );
}
