"use client";

import { useActionState, useEffect, useId, useRef, useState } from "react";

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
  email: "Sends an email directly to the student.",
  whatsapp: "Log what was sent on WhatsApp.",
  call: "Log what was discussed on phone.",
  note: "Internal note only — nothing sent.",
};

export function ReplyForm({ id }: { id: string }) {
  const uid = useId();
  const [state, formAction] = useActionState(addReplyAction, initial);
  const [selectedChannel, setSelectedChannel] = useState<ReplyChannel>("email");
  const formRef = useRef<HTMLFormElement>(null);
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  // Clear composer on success
  useEffect(() => {
    if (state.success) formRef.current?.reset();
    if (state.error) bodyRef.current?.focus();
  }, [state.error, state.success]);

  const bodyHint =
    selectedChannel === "email"
      ? "This message will be emailed to the student and saved in the enquiry history."
      : "Logged internally for the academy team.";

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="id" value={id} />

      {state.success ? (
        <FormMessage tone="success">{state.success}</FormMessage>
      ) : null}

      <Field id={`${uid}-channel`} label="Kind of entry">
        <select
          id={`${uid}-channel`}
          name="channel"
          value={selectedChannel}
          onChange={(e) => setSelectedChannel(e.target.value as ReplyChannel)}
          className={cn(inputClass(), "appearance-none pr-9 sm:max-w-md")}
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
        label={selectedChannel === "email" ? "Email Message" : "Details / Notes"}
        error={state.error}
        hint={bodyHint}
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
          placeholder={
            selectedChannel === "email"
              ? "Hello, thank you for reaching out to SSS Academy! Regarding the SQL batch timings..."
              : "Called student and explained course details. Scheduled follow-up."
          }
        />
      </Field>

      <div className="flex items-center justify-between border-t border-ink-100 pt-3">
        <p className="text-xs text-ink-500">
          {selectedChannel === "email"
            ? "📬 Delivered via SMTP"
            : "📝 Saved to internal log"}
        </p>
        <SubmitButton pendingLabel={selectedChannel === "email" ? "Sending email…" : "Saving…"}>
          {selectedChannel === "email" ? "Send Email Reply" : "Add to Thread"}
        </SubmitButton>
      </div>
    </form>
  );
}
