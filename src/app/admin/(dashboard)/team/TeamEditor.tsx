"use client";

import { useActionState, useEffect, useId, useRef } from "react";

import { saveTeamAction, type TeamState } from "@/app/admin/_actions/team";
import { Field, FormMessage, inputClass } from "@/app/admin/_components/Field";
import { SubmitButton } from "@/app/admin/_components/SubmitButton";
import type { TeamMember } from "@/lib/cms/team";
import { cn } from "@/lib/cn";

const initial: TeamState = {};

/**
 * Staff member editor. Tags and expertise are entered one per line.
 * The `isFounder` checkbox designates which member renders in the FounderBlock.
 */
export function TeamEditor({
  member,
  onDone,
}: {
  member?: TeamMember;
  onDone?: () => void;
}) {
  const uid = useId();
  const [state, formAction] = useActionState(saveTeamAction, initial);
  const formRef = useRef<HTMLFormElement>(null);
  const errorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!state.success) return;
    if (!member) formRef.current?.reset();
    onDone?.();
  }, [member, onDone, state.success]);

  useEffect(() => {
    if (state.error) errorRef.current?.focus();
  }, [state.error]);

  const fieldError = (key: string) => state.fieldErrors?.[key];

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-5">
      {member ? <input type="hidden" name="id" value={member.id} /> : null}

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
          label="Name"
          error={fieldError("name")}
        >
          <input
            id={`${uid}-name`}
            name="name"
            type="text"
            required
            maxLength={80}
            defaultValue={member?.name ?? ""}
            aria-invalid={Boolean(fieldError("name"))}
            aria-describedby={
              fieldError("name") ? `${uid}-name-error` : undefined
            }
            className={inputClass(Boolean(fieldError("name")))}
            placeholder="Sangamesh A.K"
          />
        </Field>

        <Field
          id={`${uid}-role`}
          label="Role / designation"
          error={fieldError("role")}
        >
          <input
            id={`${uid}-role`}
            name="role"
            type="text"
            required
            maxLength={100}
            defaultValue={member?.role ?? ""}
            aria-invalid={Boolean(fieldError("role"))}
            aria-describedby={
              fieldError("role") ? `${uid}-role-error` : undefined
            }
            className={inputClass(Boolean(fieldError("role")))}
            placeholder="Founder & Director"
          />
        </Field>

        <Field
          id={`${uid}-photo`}
          label="Photo path"
          error={fieldError("photo")}
          optional
          hint="e.g. /img/founder.webp"
        >
          <input
            id={`${uid}-photo`}
            name="photo"
            type="text"
            maxLength={300}
            defaultValue={member?.photo ?? ""}
            aria-invalid={Boolean(fieldError("photo"))}
            aria-describedby={cn(
              `${uid}-photo-hint`,
              fieldError("photo") && `${uid}-photo-error`,
            )}
            className={inputClass(Boolean(fieldError("photo")))}
            placeholder="/img/founder.webp"
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
            defaultValue={member?.order ?? 0}
            aria-describedby={`${uid}-order-hint`}
            className={inputClass(Boolean(fieldError("order")))}
          />
        </Field>
      </div>

      <Field
        id={`${uid}-bio`}
        label="Bio"
        error={fieldError("bio")}
        optional
        hint="Up to 1200 characters"
      >
        <textarea
          id={`${uid}-bio`}
          name="bio"
          rows={4}
          maxLength={1200}
          defaultValue={member?.bio ?? ""}
          aria-invalid={Boolean(fieldError("bio"))}
          aria-describedby={cn(
            `${uid}-bio-hint`,
            fieldError("bio") && `${uid}-bio-error`,
          )}
          className={cn(
            inputClass(Boolean(fieldError("bio"))),
            "min-h-28 resize-y py-3 leading-7",
          )}
          placeholder="Background, years of experience, specialisations…"
        />
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field
          id={`${uid}-expertise`}
          label="Expertise"
          error={fieldError("expertise")}
          optional
          hint="One per line"
        >
          <textarea
            id={`${uid}-expertise`}
            name="expertise"
            rows={4}
            defaultValue={member?.expertise.join("\n") ?? ""}
            aria-invalid={Boolean(fieldError("expertise"))}
            aria-describedby={cn(
              `${uid}-expertise-hint`,
              fieldError("expertise") && `${uid}-expertise-error`,
            )}
            className={cn(
              inputClass(Boolean(fieldError("expertise"))),
              "min-h-24 resize-y py-3 font-mono text-sm leading-7",
            )}
            placeholder={"SQL\nOracle Database\nAutomation Testing"}
          />
        </Field>

        <Field
          id={`${uid}-tags`}
          label="Tags"
          error={fieldError("tags")}
          optional
          hint="One per line"
        >
          <textarea
            id={`${uid}-tags`}
            name="tags"
            rows={4}
            defaultValue={member?.tags.join("\n") ?? ""}
            aria-invalid={Boolean(fieldError("tags"))}
            aria-describedby={cn(
              `${uid}-tags-hint`,
              fieldError("tags") && `${uid}-tags-error`,
            )}
            className={cn(
              inputClass(Boolean(fieldError("tags"))),
              "min-h-24 resize-y py-3 font-mono text-sm leading-7",
            )}
            placeholder={"Mentor\nTrainer\nCareer Guide"}
          />
        </Field>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex items-start gap-3 rounded-lg border border-ink-200 bg-ink-50 px-4 py-3">
          <input
            name="published"
            type="checkbox"
            defaultChecked={member?.published ?? true}
            className="mt-0.5 size-4 accent-navy-900"
          />
          <span className="text-sm">
            <span className="font-semibold text-navy-900">Show on the site</span>
            <span className="mt-0.5 block text-xs leading-5 text-ink-600">
              Publishes to the about page immediately.
            </span>
          </span>
        </label>

        <label className="flex items-start gap-3 rounded-lg border border-ink-200 bg-ink-50 px-4 py-3">
          <input
            name="isFounder"
            type="checkbox"
            defaultChecked={member?.isFounder ?? false}
            className="mt-0.5 size-4 accent-navy-900"
          />
          <span className="text-sm">
            <span className="font-semibold text-navy-900">Founder</span>
            <span className="mt-0.5 block text-xs leading-5 text-ink-600">
              The first founder renders in the large FounderBlock on the homepage
              and about page.
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
        <SubmitButton pendingLabel="Saving…">
          {member ? "Save changes" : "Add member"}
        </SubmitButton>
      </div>
    </form>
  );
}
