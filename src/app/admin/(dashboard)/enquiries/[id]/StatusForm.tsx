"use client";

import { useActionState, useId } from "react";

import {
  updateStatusAction,
  type ActionState,
} from "@/app/admin/_actions/enquiries";
import { inputClass } from "@/app/admin/_components/Field";
import { STATUS_LABELS } from "@/app/admin/_components/StatusPill";
import { SubmitButton } from "@/app/admin/_components/SubmitButton";
import {
  ENQUIRY_STATUSES,
  type EnquiryStatus,
} from "@/lib/cms/enquiry-schema";
import { cn } from "@/lib/cn";

const initial: ActionState = {};

/**
 * Explicit save rather than change-on-select. A dropdown that writes on change
 * is one stray keypress away from silently reclassifying someone's enquiry.
 */
export function StatusForm({
  id,
  status,
}: {
  id: string;
  status: EnquiryStatus;
}) {
  const uid = useId();
  const [state, formAction] = useActionState(updateStatusAction, initial);

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <input type="hidden" name="id" value={id} />

      <div className="flex flex-wrap items-end gap-2">
        <div className="flex flex-col gap-2">
          <label
            htmlFor={`${uid}-status`}
            className="text-sm font-semibold text-navy-900"
          >
            Status
          </label>
          <select
            id={`${uid}-status`}
            name="status"
            defaultValue={status}
            className={cn(inputClass(), "w-44 appearance-none pr-9")}
          >
            {ENQUIRY_STATUSES.map((value) => (
              <option key={value} value={value}>
                {STATUS_LABELS[value]}
              </option>
            ))}
          </select>
        </div>
        <SubmitButton variant="ghost" pendingLabel="Saving…">
          Save
        </SubmitButton>
      </div>

      {state.error ? (
        <p role="alert" className="text-xs font-medium text-ember-700">
          {state.error}
        </p>
      ) : state.success ? (
        <p role="status" className="text-xs font-medium text-mint-700">
          {state.success}
        </p>
      ) : null}
    </form>
  );
}
