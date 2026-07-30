"use client";

import { useActionState, useEffect, useId, useRef } from "react";

import {
  savePlacementAction,
  type PlacementState,
} from "@/app/admin/_actions/placements";
import { Field, FormMessage, inputClass } from "@/app/admin/_components/Field";
import { SubmitButton } from "@/app/admin/_components/SubmitButton";
import type { PlacementRecord } from "@/lib/cms/placements";
import { cn } from "@/lib/cn";

const initial: PlacementState = {};

/**
 * One editor, two jobs: a blank instance adds a story, an instance with
 * `placement` edits in place. The slug is derived from the name on create and
 * then frozen — it is the Firestore document ID, so changing it would orphan
 * the record rather than rename it.
 */
export function PlacementEditor({
  placement,
  onDone,
}: {
  placement?: PlacementRecord;
  onDone?: () => void;
}) {
  const uid = useId();
  const [state, formAction] = useActionState(savePlacementAction, initial);
  const formRef = useRef<HTMLFormElement>(null);
  const errorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!state.success) return;
    if (!placement) formRef.current?.reset();
    onDone?.();
  }, [onDone, placement, state.success]);

  useEffect(() => {
    if (state.error) errorRef.current?.focus();
  }, [state.error]);

  const fieldError = (key: string) => state.fieldErrors?.[key];

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-5">
      {placement ? <input type="hidden" name="id" value={placement.slug} /> : null}

      {state.error ? (
        <div ref={errorRef} tabIndex={-1} className="outline-none">
          <FormMessage tone="error">{state.error}</FormMessage>
        </div>
      ) : state.success ? (
        <FormMessage tone="success">{state.success}</FormMessage>
      ) : null}

      <div className="grid gap-5 sm:grid-cols-2">
        <Field
          id={`${uid}-name`}
          label="Student name"
          error={fieldError("name")}
          hint="As it should appear on the card"
        >
          <input
            id={`${uid}-name`}
            name="name"
            type="text"
            required
            maxLength={80}
            defaultValue={placement?.name ?? ""}
            aria-invalid={Boolean(fieldError("name"))}
            aria-describedby={cn(
              `${uid}-name-hint`,
              fieldError("name") && `${uid}-name-error`,
            )}
            className={inputClass(Boolean(fieldError("name")))}
            placeholder="Vinayak S"
          />
        </Field>

        <Field
          id={`${uid}-role`}
          label="Role hired for"
          error={fieldError("role")}
        >
          <input
            id={`${uid}-role`}
            name="role"
            type="text"
            required
            maxLength={80}
            defaultValue={placement?.role ?? ""}
            aria-invalid={Boolean(fieldError("role"))}
            aria-describedby={
              fieldError("role") ? `${uid}-role-error` : undefined
            }
            className={inputClass(Boolean(fieldError("role")))}
            placeholder="ETL Tester"
          />
        </Field>

        <Field
          id={`${uid}-packageLpa`}
          label="Package"
          error={fieldError("packageLpa")}
          hint="Lakhs per annum, e.g. 13.5"
        >
          <input
            id={`${uid}-packageLpa`}
            name="packageLpa"
            type="number"
            required
            min={0}
            max={200}
            step={0.1}
            inputMode="decimal"
            defaultValue={placement ? placement.packageLpa : ""}
            aria-invalid={Boolean(fieldError("packageLpa"))}
            aria-describedby={cn(
              `${uid}-packageLpa-hint`,
              fieldError("packageLpa") && `${uid}-packageLpa-error`,
            )}
            className={inputClass(Boolean(fieldError("packageLpa")))}
            placeholder="13.5"
          />
        </Field>

        <Field
          id={`${uid}-company`}
          label="Company"
          error={fieldError("company")}
          optional
        >
          <input
            id={`${uid}-company`}
            name="company"
            type="text"
            maxLength={80}
            defaultValue={placement?.company ?? ""}
            aria-invalid={Boolean(fieldError("company"))}
            aria-describedby={
              fieldError("company") ? `${uid}-company-error` : undefined
            }
            className={inputClass(Boolean(fieldError("company")))}
            placeholder="MNC"
          />
        </Field>

        <Field
          id={`${uid}-location`}
          label="City"
          error={fieldError("location")}
          optional
        >
          <input
            id={`${uid}-location`}
            name="location"
            type="text"
            maxLength={80}
            defaultValue={placement?.location ?? ""}
            aria-invalid={Boolean(fieldError("location"))}
            aria-describedby={
              fieldError("location") ? `${uid}-location-error` : undefined
            }
            className={inputClass(Boolean(fieldError("location")))}
            placeholder="Bengaluru"
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
            defaultValue={placement?.order ?? 0}
            aria-describedby={`${uid}-order-hint`}
            className={inputClass(Boolean(fieldError("order")))}
          />
        </Field>
      </div>

      <Field
        id={`${uid}-quote`}
        label="Their words"
        error={fieldError("quote")}
        hint="Up to 1200 characters"
      >
        <textarea
          id={`${uid}-quote`}
          name="quote"
          required
          rows={5}
          maxLength={1200}
          defaultValue={placement?.quote ?? ""}
          aria-invalid={Boolean(fieldError("quote"))}
          aria-describedby={cn(
            `${uid}-quote-hint`,
            fieldError("quote") && `${uid}-quote-error`,
          )}
          className={cn(
            inputClass(Boolean(fieldError("quote"))),
            "min-h-32 resize-y py-3 leading-7",
          )}
          placeholder="The training was well structured and focused on real-time industry requirements…"
        />
      </Field>

      <label className="flex items-start gap-3 rounded-lg border border-ink-200 bg-ink-50 px-4 py-3">
        <input
          name="published"
          type="checkbox"
          defaultChecked={placement?.published ?? true}
          className="mt-0.5 size-4 accent-navy-900"
        />
        <span className="text-sm">
          <span className="font-semibold text-navy-900">Show on the site</span>
          <span className="mt-0.5 block text-xs leading-5 text-ink-600">
            Saving publishes immediately to the placements page. Untick to keep
            the story out of view while you check the wording.
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
          {placement ? "Save changes" : "Add story"}
        </SubmitButton>
      </div>
    </form>
  );
}
