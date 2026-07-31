"use client";

import { useActionState, useEffect, useId, useRef } from "react";

import {
  saveVideoAction,
  type VideoState,
} from "@/app/admin/_actions/videos";
import { Field, FormMessage, inputClass } from "@/app/admin/_components/Field";
import { SubmitButton } from "@/app/admin/_components/SubmitButton";
import type { VideoRecord } from "@/lib/cms/videos";
import { cn } from "@/lib/cn";

const initial: VideoState = {};

/**
 * Editor for YouTube demo videos. Staff paste a YouTube URL along with a title
 * and optional description. The video appears on the homepage in the "Watch Our
 * Demo Classes" section.
 */
export function VideoEditor({
  video,
  onDone,
}: {
  video?: VideoRecord;
  onDone?: () => void;
}) {
  const uid = useId();
  const [state, formAction] = useActionState(saveVideoAction, initial);
  const formRef = useRef<HTMLFormElement>(null);
  const errorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!state.success) return;
    if (!video) formRef.current?.reset();
    onDone?.();
  }, [video, onDone, state.success]);

  useEffect(() => {
    if (state.error) errorRef.current?.focus();
  }, [state.error]);

  const fieldError = (key: string) => state.fieldErrors?.[key];

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-5">
      {video ? <input type="hidden" name="id" value={video.id} /> : null}

      {state.error ? (
        <div ref={errorRef} tabIndex={-1} className="outline-none">
          <FormMessage tone="error">{state.error}</FormMessage>
        </div>
      ) : state.success ? (
        <FormMessage tone="success">{state.success}</FormMessage>
      ) : null}

      <Field
        id={`${uid}-title`}
        label="Video title"
        error={fieldError("title")}
        hint="Shown below the video thumbnail"
      >
        <input
          id={`${uid}-title`}
          name="title"
          type="text"
          required
          maxLength={120}
          defaultValue={video?.title ?? ""}
          aria-invalid={Boolean(fieldError("title"))}
          className={inputClass(Boolean(fieldError("title")))}
          placeholder="Demo Lecture: UPSC Preparation Strategy"
        />
      </Field>

      <Field
        id={`${uid}-youtubeUrl`}
        label="YouTube URL"
        error={fieldError("youtubeUrl")}
        hint="Paste the full link from YouTube"
      >
        <input
          id={`${uid}-youtubeUrl`}
          name="youtubeUrl"
          type="url"
          required
          maxLength={500}
          defaultValue={video?.youtubeUrl ?? ""}
          aria-invalid={Boolean(fieldError("youtubeUrl"))}
          className={inputClass(Boolean(fieldError("youtubeUrl")))}
          placeholder="https://www.youtube.com/watch?v=..."
        />
      </Field>

      <Field
        id={`${uid}-description`}
        label="Description"
        error={fieldError("description")}
        optional
        hint="One short sentence about the video"
      >
        <textarea
          id={`${uid}-description`}
          name="description"
          rows={2}
          maxLength={240}
          defaultValue={video?.description ?? ""}
          aria-invalid={Boolean(fieldError("description"))}
          className={cn(inputClass(Boolean(fieldError("description"))), "h-auto py-2.5")}
          placeholder="Learn about effective strategies and methodologies for UPSC preparation."
        />
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
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
            defaultValue={video?.order ?? 0}
            className={inputClass(Boolean(fieldError("order")))}
          />
        </Field>
      </div>

      <label className="flex items-start gap-3 rounded-lg border border-ink-200 bg-ink-50 px-4 py-3">
        <input
          name="active"
          type="checkbox"
          defaultChecked={video?.active ?? true}
          className="mt-0.5 size-4 accent-navy-900"
        />
        <span className="text-sm">
          <span className="font-semibold text-navy-900">Show on the site</span>
          <span className="mt-0.5 block text-xs leading-5 text-ink-600">
            Active videos appear in the &ldquo;Watch Our Demo Classes&rdquo; section
            on the homepage.
          </span>
        </span>
      </label>

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
        <SubmitButton pendingLabel="Saving…">
          {video ? "Save changes" : "Add video"}
        </SubmitButton>
      </div>
    </form>
  );
}
