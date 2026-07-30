"use client";

import { useState } from "react";

import { PlacementEditor } from "@/app/admin/(dashboard)/placements/PlacementEditor";
import {
  deletePlacementAction,
  togglePlacementAction,
} from "@/app/admin/_actions/placements";
import { Pill } from "@/app/admin/_components/StatusPill";
import { SubmitButton } from "@/app/admin/_components/SubmitButton";
import { Timestamp } from "@/app/admin/_components/Timestamp";
import type { PlacementRecord } from "@/lib/cms/placements";

function packageLabel(value: number) {
  return `₹${Number.isInteger(value) ? value.toFixed(0) : value.toFixed(1)} LPA`;
}

/**
 * A story in the list, with inline edit and a two-step delete.
 *
 * The delete confirmation is rendered state rather than `window.confirm` so it
 * is styled, keyboard accessible and announced like the rest of the page.
 */
export function PlacementRow({ placement }: { placement: PlacementRecord }) {
  const [editing, setEditing] = useState(false);
  const [confirming, setConfirming] = useState(false);

  return (
    <li className="rounded-xl border border-ink-200 bg-[#fffdf8] p-4 shadow-subtle sm:p-5">
      {editing ? (
        <PlacementEditor
          placement={placement}
          onDone={() => setEditing(false)}
        />
      ) : (
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {placement.published ? (
              <Pill tone="good">Live</Pill>
            ) : (
              <Pill>Hidden</Pill>
            )}
            <span className="text-[0.6875rem] font-medium text-ink-400">
              order {placement.order}
            </span>
            <span className="flex-1" />
            <span className="text-[0.6875rem] font-medium text-ink-400">
              edited <Timestamp ms={placement.updatedAtMs} />
            </span>
          </div>

          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <p className="text-[0.9375rem] font-semibold text-navy-950">
              {placement.name}
            </p>
            <p className="text-sm text-ink-600">{placement.role}</p>
            <p className="text-sm font-semibold text-navy-800">
              {packageLabel(placement.packageLpa)}
            </p>
          </div>

          <p className="text-xs text-ink-500">
            {placement.company}
            {placement.location ? ` — ${placement.location}` : ""}
          </p>

          <p className="line-clamp-3 text-sm leading-6 text-ink-600">
            “{placement.quote}”
          </p>

          <div className="flex flex-wrap items-center gap-2 border-t border-ink-100 pt-3">
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="h-9 rounded-full border border-ink-200 px-4 text-sm font-medium text-navy-900 hover:border-navy-300 hover:bg-white"
            >
              Edit
            </button>

            <form action={togglePlacementAction}>
              <input type="hidden" name="id" value={placement.slug} />
              <SubmitButton
                variant="ghost"
                size="sm"
                pendingLabel={placement.published ? "Hiding…" : "Publishing…"}
              >
                {placement.published ? "Hide" : "Show on site"}
              </SubmitButton>
            </form>

            <span className="flex-1" />

            {confirming ? (
              <form
                action={deletePlacementAction}
                className="flex items-center gap-2"
              >
                <input type="hidden" name="id" value={placement.slug} />
                <span className="text-xs font-medium text-ember-800">
                  Delete permanently?
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
