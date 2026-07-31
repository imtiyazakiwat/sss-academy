"use client";

import { useActionState, useEffect, useId, useRef } from "react";

import {
  saveNoticeAction,
  type NoticeState,
} from "@/app/admin/_actions/notices";
import { Field, FormMessage, inputClass } from "@/app/admin/_components/Field";
import { SubmitButton } from "@/app/admin/_components/SubmitButton";
import type { NoticeRecord } from "@/lib/cms/notices";
import { cn } from "@/lib/cn";

const initial: NoticeState = {};

/**
 * One editor, two jobs: a blank instance creates, an instance with `notice`
 * edits in place. Saving publishes straight to the live site, so the copy says
 * so rather than pretending there is a review step.
 */
export function NoticeEditor({
  notice,
  onDone,
}: {
  notice?: NoticeRecord;
  onDone?: () => void;
}) {
  const uid = useId();
  const [state, formAction] = useActionState(saveNoticeAction, initial);
  const formRef = useRef<HTMLFormElement>(null);
  const errorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!state.success) return;
    if (!notice) formRef.current?.reset();
    onDone?.();
  }, [notice, onDone, state.success]);

  useEffect(() => {
    if (state.error) errorRef.current?.focus();
  }, [state.error]);

  const fieldError = (key: string) => state.fieldErrors?.[key];

  /** Format ms timestamp as UTC YYYY-MM-DD for date inputs (matches storage). */
  const toDateInput = (ms: number) => new Date(ms).toISOString().slice(0, 10);
  const expiry = notice?.expiresAtMs ? toDateInput(notice.expiresAtMs) : "";

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-5">
      {notice ? <input type="hidden" name="id" value={notice.id} /> : null}

      {state.error ? (
        <div ref={errorRef} tabIndex={-1} className="outline-none">
          <FormMessage tone="error">{state.error}</FormMessage>
        </div>
      ) : state.success ? (
        <FormMessage tone="success">{state.success}</FormMessage>
      ) : null}

      <Field
        id={`${uid}-message`}
        label="Notice text"
        error={fieldError("message")}
        hint="One line, 160 characters"
      >
        <input
          id={`${uid}-message`}
          name="message"
          type="text"
          required
          maxLength={160}
          defaultValue={notice?.message ?? ""}
          aria-invalid={Boolean(fieldError("message"))}
          aria-describedby={cn(
            `${uid}-message-hint`,
            fieldError("message") && `${uid}-message-error`,
          )}
          className={inputClass(Boolean(fieldError("message")))}
          placeholder="New SQL batch starts 4 August. Limited seats."
        />
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field
          id={`${uid}-href`}
          label="Link"
          error={fieldError("href")}
          optional
        >
          <input
            id={`${uid}-href`}
            name="href"
            type="text"
            maxLength={300}
            defaultValue={notice?.href ?? ""}
            aria-invalid={Boolean(fieldError("href"))}
            aria-describedby={
              fieldError("href") ? `${uid}-href-error` : undefined
            }
            className={inputClass(Boolean(fieldError("href")))}
            placeholder="/courses/sql"
          />
        </Field>

        <Field
          id={`${uid}-cta`}
          label="Link label"
          error={fieldError("cta")}
          optional
        >
          <input
            id={`${uid}-cta`}
            name="cta"
            type="text"
            maxLength={40}
            defaultValue={notice?.cta ?? ""}
            aria-invalid={Boolean(fieldError("cta"))}
            aria-describedby={fieldError("cta") ? `${uid}-cta-error` : undefined}
            className={inputClass(Boolean(fieldError("cta")))}
            placeholder="See the syllabus"
          />
        </Field>

        <Field
          id={`${uid}-expiresAt`}
          label="Stop showing after"
          error={fieldError("expiresAt")}
          optional
        >
          <input
            id={`${uid}-expiresAt`}
            name="expiresAt"
            type="date"
            defaultValue={expiry}
            aria-invalid={Boolean(fieldError("expiresAt"))}
            aria-describedby={
              fieldError("expiresAt") ? `${uid}-expiresAt-error` : undefined
            }
            className={inputClass(Boolean(fieldError("expiresAt")))}
          />
        </Field>

        <Field
          id={`${uid}-order`}
          label="Order"
          error={fieldError("order")}
          hint="Lowest wins when several are active"
        >
          <input
            id={`${uid}-order`}
            name="order"
            type="number"
            min={0}
            max={999}
            defaultValue={notice?.order ?? 0}
            aria-describedby={`${uid}-order-hint`}
            className={inputClass(Boolean(fieldError("order")))}
          />
        </Field>
      </div>

      <label className="flex items-start gap-3 rounded-lg border border-ink-200 bg-ink-50 px-4 py-3">
        <input
          name="active"
          type="checkbox"
          defaultChecked={notice?.active ?? false}
          className="mt-0.5 size-4 accent-navy-900"
        />
        <span className="text-sm">
          <span className="font-semibold text-navy-900">Show on the site</span>
          <span className="mt-0.5 block text-xs leading-5 text-ink-600">
            Saving publishes immediately. Only the lowest-ordered active notice
            appears in the bar.
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
        <SubmitButton pendingLabel="Publishing…">
          {notice ? "Save changes" : "Create notice"}
        </SubmitButton>
      </div>
    </form>
  );
}
