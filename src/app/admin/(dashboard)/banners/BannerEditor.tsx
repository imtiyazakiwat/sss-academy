"use client";

import { useActionState, useEffect, useId, useRef } from "react";

import {
  saveBannerAction,
  type BannerState,
} from "@/app/admin/_actions/banners";
import { Field, FormMessage, inputClass } from "@/app/admin/_components/Field";
import { SubmitButton } from "@/app/admin/_components/SubmitButton";
import type { BannerRecord } from "@/lib/cms/banners";
import { cn } from "@/lib/cn";

const initial: BannerState = {};

/**
 * One editor, two jobs: a blank instance creates, an instance with `banner`
 * edits in place. Saving publishes straight to the live homepage popup, so the
 * copy says so rather than pretending there is a review step.
 */
export function BannerEditor({
  banner,
  onDone,
}: {
  banner?: BannerRecord;
  onDone?: () => void;
}) {
  const uid = useId();
  const [state, formAction] = useActionState(saveBannerAction, initial);
  const formRef = useRef<HTMLFormElement>(null);
  const errorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!state.success) return;
    if (!banner) formRef.current?.reset();
    onDone?.();
  }, [banner, onDone, state.success]);

  useEffect(() => {
    if (state.error) errorRef.current?.focus();
  }, [state.error]);

  const fieldError = (key: string) => state.fieldErrors?.[key];

  /** Format ms timestamp as UTC YYYY-MM-DD for date inputs (matches storage). */
  const toDateInput = (ms: number) => new Date(ms).toISOString().slice(0, 10);

  const deadline = banner?.deadlineAtMs ? toDateInput(banner.deadlineAtMs) : "";
  const expiry = banner?.expiresAtMs ? toDateInput(banner.expiresAtMs) : "";

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-5">
      {banner ? <input type="hidden" name="id" value={banner.id} /> : null}

      {state.error ? (
        <div ref={errorRef} tabIndex={-1} className="outline-none">
          <FormMessage tone="error">{state.error}</FormMessage>
        </div>
      ) : state.success ? (
        <FormMessage tone="success">{state.success}</FormMessage>
      ) : null}

      <Field
        id={`${uid}-title`}
        label="Heading"
        error={fieldError("title")}
        hint="Shown big, under the eyebrow icon"
      >
        <input
          id={`${uid}-title`}
          name="title"
          type="text"
          required
          maxLength={80}
          defaultValue={banner?.title ?? ""}
          aria-invalid={Boolean(fieldError("title"))}
          className={inputClass(Boolean(fieldError("title")))}
          placeholder="Admissions Open for 2025"
        />
      </Field>

      <Field
        id={`${uid}-description`}
        label="Body copy"
        error={fieldError("description")}
        hint="One or two short sentences"
      >
        <textarea
          id={`${uid}-description`}
          name="description"
          required
          rows={3}
          maxLength={240}
          defaultValue={banner?.description ?? ""}
          aria-invalid={Boolean(fieldError("description"))}
          className={cn(inputClass(Boolean(fieldError("description"))), "h-auto py-2.5")}
          placeholder="Apply now to secure your spot for the upcoming academic year!"
        />
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field
          id={`${uid}-primaryLabel`}
          label="Main button label"
          error={fieldError("primaryLabel")}
        >
          <input
            id={`${uid}-primaryLabel`}
            name="primaryLabel"
            type="text"
            maxLength={40}
            defaultValue={banner?.primaryLabel ?? "Apply Now"}
            aria-invalid={Boolean(fieldError("primaryLabel"))}
            className={inputClass(Boolean(fieldError("primaryLabel")))}
            placeholder="Apply Now"
          />
        </Field>

        <Field
          id={`${uid}-primaryHref`}
          label="Main button link"
          error={fieldError("primaryHref")}
        >
          <input
            id={`${uid}-primaryHref`}
            name="primaryHref"
            type="text"
            maxLength={300}
            defaultValue={banner?.primaryHref ?? ""}
            aria-invalid={Boolean(fieldError("primaryHref"))}
            className={inputClass(Boolean(fieldError("primaryHref")))}
            placeholder="/contact"
          />
        </Field>

        <Field
          id={`${uid}-secondaryLabel`}
          label="Second button label"
          error={fieldError("secondaryLabel")}
          optional
        >
          <input
            id={`${uid}-secondaryLabel`}
            name="secondaryLabel"
            type="text"
            maxLength={40}
            defaultValue={banner?.secondaryLabel ?? ""}
            aria-invalid={Boolean(fieldError("secondaryLabel"))}
            className={inputClass(Boolean(fieldError("secondaryLabel")))}
            placeholder="Enquire More"
          />
        </Field>

        <Field
          id={`${uid}-secondaryHref`}
          label="Second button link"
          error={fieldError("secondaryHref")}
          optional
        >
          <input
            id={`${uid}-secondaryHref`}
            name="secondaryHref"
            type="text"
            maxLength={300}
            defaultValue={banner?.secondaryHref ?? ""}
            aria-invalid={Boolean(fieldError("secondaryHref"))}
            className={inputClass(Boolean(fieldError("secondaryHref")))}
            placeholder="/contact"
          />
        </Field>

        <Field
          id={`${uid}-deadlineLabel`}
          label="Footer label"
          error={fieldError("deadlineLabel")}
          optional
          hint="e.g. Last date to apply"
        >
          <input
            id={`${uid}-deadlineLabel`}
            name="deadlineLabel"
            type="text"
            maxLength={60}
            defaultValue={banner?.deadlineLabel ?? "Last date to apply"}
            aria-invalid={Boolean(fieldError("deadlineLabel"))}
            className={inputClass(Boolean(fieldError("deadlineLabel")))}
            placeholder="Last date to apply"
          />
        </Field>

        <Field
          id={`${uid}-deadlineAt`}
          label="Footer date"
          error={fieldError("deadlineAt")}
          optional
        >
          <input
            id={`${uid}-deadlineAt`}
            name="deadlineAt"
            type="date"
            defaultValue={deadline}
            aria-invalid={Boolean(fieldError("deadlineAt"))}
            className={inputClass(Boolean(fieldError("deadlineAt")))}
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
            defaultValue={banner?.order ?? 0}
            className={inputClass(Boolean(fieldError("order")))}
          />
        </Field>
      </div>

      <label className="flex items-start gap-3 rounded-lg border border-ink-200 bg-ink-50 px-4 py-3">
        <input
          name="active"
          type="checkbox"
          defaultChecked={banner?.active ?? false}
          className="mt-0.5 size-4 accent-navy-900"
        />
        <span className="text-sm">
          <span className="font-semibold text-navy-900">Show on the site</span>
          <span className="mt-0.5 block text-xs leading-5 text-ink-600">
            Saving publishes immediately. Only active, unexpired banners appear
            in the homepage popup, lowest order first.
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
          {banner ? "Save changes" : "Create banner"}
        </SubmitButton>
      </div>
    </form>
  );
}
