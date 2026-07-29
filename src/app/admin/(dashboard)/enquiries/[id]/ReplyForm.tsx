"use client";

import { useActionState, useEffect, useId, useRef } from "react";

import {
  addReplyAction,
  type ActionState,
} from "@/app/admin/_actions/enquiries";
import { Field, FormMessage, inputClass } from "@/app/admin/_components/Field";
import { SubmitButton } from "@/app/admin/_components/SubmitButton";
import {
  CHANNEL_LABELS,
  REPLY_CHANNELS,
  type ReplyChannel,
} from "@/lib/cms/enquiry-schema";
import { cn } from "@/lib/cn";

const initial: ActionState = {};

const CHANNEL_HINTS: Record<ReplyChannel, string> = {
  note: "Only visible here. Nothing is sent.",
  call: "Log what was discussed after calling.",
  whatsapp: "Log what you sent on WhatsApp.",
  email: "Sending is not wired up yet — this records the reply.",
};

export function ReplyForm({ id }: { id: string }) {
  const uid = useId();
  const [state, formAction] = useActionState(addReplyAction, initial);
  const formRef = useRef<HTMLFormElement>(null);
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  // Clear the composer once the entry is saved, and put the caret back for the
  // next one. On failure, keep what was typed and focus it.
  useEffect(() => {
    if (state.success) formRef.current?.reset();
    if (state.error) bodyRef.current?.focus();
  }, [state.error, state.success]);

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="id" value={id} />

      {/* Success only. Errors render against the field they belong to, so they
          are announced with the control rather than in two places at once. */}
      {state.success ? (
        <FormMessage tone="success">{state.success}</FormMessage>
      ) : null}

      <Field id={`${uid}-channel`} label="Kind of entry">
        <select
          id={`${uid}-channel`}
          name="channel"
          defaultValue="note"
          className={cn(inputClass(), "appearance-none pr-9 sm:max-w-xs")}
        >
          {REPLY_CHANNELS.map((channel) => (
            <option key={channel} value={channel}>
              {CHANNEL_LABELS[channel]} — {CHANNEL_HINTS[channel]}
            </option>
          ))}
        </select>
      </Field>

      <Field
        id={`${uid}-body`}
        label="What happened"
        error={state.error}
        hint="Anything logged here stays internal."
      >
        <textarea
          ref={bodyRef}
          id={`${uid}-body`}
          name="body"
          required
          rows={4}
          maxLength={4000}
          aria-invalid={Boolean(state.error)}
          aria-describedby={`${uid}-body-hint${state.error ? ` ${uid}-body-error` : ""}`}
          className={cn(inputClass(Boolean(state.error)), "min-h-28 resize-y py-3")}
          placeholder="Called and explained the SQL batch timings. Following up on Monday."
        />
      </Field>

      <div className="flex justify-end">
        <SubmitButton pendingLabel="Saving…">Add to thread</SubmitButton>
      </div>
    </form>
  );
}
