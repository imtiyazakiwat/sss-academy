"use client";

import { useActionState, useEffect, useId, useRef } from "react";

import {
  saveCourseAction,
  type CourseState,
} from "@/app/admin/_actions/courses";
import { Field, FormMessage, inputClass } from "@/app/admin/_components/Field";
import { SubmitButton } from "@/app/admin/_components/SubmitButton";
import { trackLabels } from "@/content/courses";
import type { CourseRecord } from "@/lib/cms/courses";
import { cn } from "@/lib/cn";

const initial: CourseState = {};

const TRACKS = ["data", "testing", "cloud", "programming", "bi"] as const;
const LEVELS = ["Beginner", "Beginner to Advanced", "Intermediate"] as const;

/**
 * One editor, two jobs: a blank instance adds a course, an instance with
 * `course` edits in place. The slug comes from the title on create and is then
 * frozen — it is the Firestore document ID and the public URL, so changing it
 * would orphan the record and break every inbound link.
 *
 * Topics are one per line. A textarea keeps reordering as cheap as moving a
 * line, which is what editing a syllabus actually involves.
 */
export function CourseEditor({
  course,
  onDone,
}: {
  course?: CourseRecord;
  onDone?: () => void;
}) {
  const uid = useId();
  const [state, formAction] = useActionState(saveCourseAction, initial);
  const formRef = useRef<HTMLFormElement>(null);
  const errorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!state.success) return;
    if (!course) formRef.current?.reset();
    onDone?.();
  }, [course, onDone, state.success]);

  useEffect(() => {
    if (state.error) errorRef.current?.focus();
  }, [state.error]);

  const fieldError = (key: string) => state.fieldErrors?.[key];

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-5">
      {course ? <input type="hidden" name="id" value={course.slug} /> : null}

      {state.error ? (
        <div ref={errorRef} tabIndex={-1} className="outline-none">
          <FormMessage tone="error">{state.error}</FormMessage>
        </div>
      ) : state.success ? (
        <FormMessage tone="success">{state.success}</FormMessage>
      ) : null}

      {state.topicWarning?.length ? (
        <div className="rounded-lg border border-ember-300 bg-ember-50 px-4 py-3 text-sm text-ember-900">
          <p className="font-semibold">
            Playground labs reference topics you removed
          </p>
          <ul className="mt-2 flex flex-col gap-1.5">
            {state.topicWarning.map((entry) => (
              <li key={entry.topic} className="leading-6">
                <span className="font-mono text-xs">{entry.topic}</span>
                <span className="block text-xs text-ember-800">
                  {entry.labs.length}{" "}
                  {entry.labs.length === 1 ? "lab" : "labs"}:{" "}
                  {entry.labs.join(", ")}
                </span>
              </li>
            ))}
          </ul>
          <label className="mt-3 flex items-start gap-2.5 border-t border-ember-200 pt-3">
            <input
              name="confirmTopics"
              type="checkbox"
              className="mt-0.5 size-4 accent-ember-700"
            />
            <span className="text-xs leading-5">
              Save anyway. Those labs will no longer match a topic on this
              course, and the topic list in the playground sidebar will look
              wrong until the lab is updated in code.
            </span>
          </label>
        </div>
      ) : null}

      <div className="grid gap-5 sm:grid-cols-2">
        <Field
          id={`${uid}-title`}
          label="Course title"
          error={fieldError("title")}
          hint={course ? `/courses/${course.slug}` : "Sets the URL"}
        >
          <input
            id={`${uid}-title`}
            name="title"
            type="text"
            required
            maxLength={80}
            defaultValue={course?.title ?? ""}
            aria-invalid={Boolean(fieldError("title"))}
            aria-describedby={cn(
              `${uid}-title-hint`,
              fieldError("title") && `${uid}-title-error`,
            )}
            className={inputClass(Boolean(fieldError("title")))}
            placeholder="Azure Data Factory"
          />
        </Field>

        <Field
          id={`${uid}-short`}
          label="Short label"
          error={fieldError("short")}
          optional
        >
          <input
            id={`${uid}-short`}
            name="short"
            type="text"
            maxLength={24}
            defaultValue={course?.short ?? ""}
            aria-invalid={Boolean(fieldError("short"))}
            aria-describedby={
              fieldError("short") ? `${uid}-short-error` : undefined
            }
            className={inputClass(Boolean(fieldError("short")))}
            placeholder="ADF"
          />
        </Field>

        <Field
          id={`${uid}-track`}
          label="Track"
          error={fieldError("track")}
          hint="Groups the course in the nav"
        >
          <select
            id={`${uid}-track`}
            name="track"
            required
            defaultValue={course?.track ?? "data"}
            aria-invalid={Boolean(fieldError("track"))}
            aria-describedby={`${uid}-track-hint`}
            className={cn(
              inputClass(Boolean(fieldError("track"))),
              "appearance-none pr-9",
            )}
          >
            {TRACKS.map((track) => (
              <option key={track} value={track}>
                {trackLabels[track]}
              </option>
            ))}
          </select>
        </Field>

        <Field id={`${uid}-level`} label="Level" error={fieldError("level")}>
          <select
            id={`${uid}-level`}
            name="level"
            required
            defaultValue={course?.level ?? "Beginner to Advanced"}
            aria-invalid={Boolean(fieldError("level"))}
            aria-describedby={
              fieldError("level") ? `${uid}-level-error` : undefined
            }
            className={cn(
              inputClass(Boolean(fieldError("level"))),
              "appearance-none pr-9",
            )}
          >
            {LEVELS.map((level) => (
              <option key={level} value={level}>
                {level}
              </option>
            ))}
          </select>
        </Field>

        <Field
          id={`${uid}-durationMonths`}
          label="Duration"
          error={fieldError("durationMonths")}
          hint="In months"
        >
          <input
            id={`${uid}-durationMonths`}
            name="durationMonths"
            type="number"
            required
            min={1}
            max={24}
            step={1}
            defaultValue={course?.durationMonths ?? 1}
            aria-invalid={Boolean(fieldError("durationMonths"))}
            aria-describedby={cn(
              `${uid}-durationMonths-hint`,
              fieldError("durationMonths") && `${uid}-durationMonths-error`,
            )}
            className={inputClass(Boolean(fieldError("durationMonths")))}
          />
        </Field>

        <Field
          id={`${uid}-order`}
          label="Order"
          error={fieldError("order")}
          hint="Lowest shows first"
        >
          <input
            id={`${uid}-order`}
            name="order"
            type="number"
            min={0}
            max={999}
            defaultValue={course?.order ?? 0}
            aria-describedby={`${uid}-order-hint`}
            className={inputClass(Boolean(fieldError("order")))}
          />
        </Field>
      </div>

      <Field
        id={`${uid}-outcome`}
        label="Outcome"
        error={fieldError("outcome")}
        hint="One line, on the card"
      >
        <input
          id={`${uid}-outcome`}
          name="outcome"
          type="text"
          required
          maxLength={200}
          defaultValue={course?.outcome ?? ""}
          aria-invalid={Boolean(fieldError("outcome"))}
          aria-describedby={cn(
            `${uid}-outcome-hint`,
            fieldError("outcome") && `${uid}-outcome-error`,
          )}
          className={inputClass(Boolean(fieldError("outcome")))}
          placeholder="Orchestrate cloud ETL end to end on Azure."
        />
      </Field>

      <Field
        id={`${uid}-summary`}
        label="Summary"
        error={fieldError("summary")}
        hint="Up to 600 characters"
      >
        <textarea
          id={`${uid}-summary`}
          name="summary"
          required
          rows={3}
          maxLength={600}
          defaultValue={course?.summary ?? ""}
          aria-invalid={Boolean(fieldError("summary"))}
          aria-describedby={cn(
            `${uid}-summary-hint`,
            fieldError("summary") && `${uid}-summary-error`,
          )}
          className={cn(
            inputClass(Boolean(fieldError("summary"))),
            "min-h-24 resize-y py-3 leading-7",
          )}
          placeholder="Learn Azure Data Factory pipelines, data integration, cloud ETL processes…"
        />
      </Field>

      <Field
        id={`${uid}-topics`}
        label="Topics"
        error={fieldError("topics")}
        hint="One per line, in order"
      >
        <textarea
          id={`${uid}-topics`}
          name="topics"
          required
          rows={8}
          defaultValue={course?.topics.join("\n") ?? ""}
          aria-invalid={Boolean(fieldError("topics"))}
          aria-describedby={cn(
            `${uid}-topics-hint`,
            fieldError("topics") && `${uid}-topics-error`,
          )}
          className={cn(
            inputClass(Boolean(fieldError("topics"))),
            "min-h-44 resize-y py-3 font-mono text-sm leading-7",
          )}
          placeholder={"ADF pipelines and activities\nData integration\nTriggers and scheduling"}
        />
      </Field>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex items-start gap-3 rounded-lg border border-ink-200 bg-ink-50 px-4 py-3">
          <input
            name="published"
            type="checkbox"
            defaultChecked={course?.published ?? true}
            className="mt-0.5 size-4 accent-navy-900"
          />
          <span className="text-sm">
            <span className="font-semibold text-navy-900">Show on the site</span>
            <span className="mt-0.5 block text-xs leading-5 text-ink-600">
              Publishes to /courses and the nav immediately.
            </span>
          </span>
        </label>

        <label className="flex items-start gap-3 rounded-lg border border-ink-200 bg-ink-50 px-4 py-3">
          <input
            name="featured"
            type="checkbox"
            defaultChecked={course?.featured ?? false}
            className="mt-0.5 size-4 accent-navy-900"
          />
          <span className="text-sm">
            <span className="font-semibold text-navy-900">Feature on home</span>
            <span className="mt-0.5 block text-xs leading-5 text-ink-600">
              Adds it to the homepage course grid.
            </span>
          </span>
        </label>
      </div>

      <div className="flex justify-end gap-2">
        {onDone ? (
          <button
            type="button"
            onClick={onDone}
            className="rounded-full border border-ink-200 px-4 text-sm font-medium text-ink-700 hover:border-navy-300 hover:text-navy-900"
          >
            Cancel
          </button>
        ) : null}
        <SubmitButton pendingLabel="Publishing…">
          {course ? "Save changes" : "Add course"}
        </SubmitButton>
      </div>
    </form>
  );
}
