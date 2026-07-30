"use client";

import { useState } from "react";

import {
  deleteNoticeAction,
  toggleNoticeAction,
} from "@/app/admin/_actions/notices";
import { NoticeEditor } from "@/app/admin/(dashboard)/notices/NoticeEditor";
import { Pill } from "@/app/admin/_components/StatusPill";
import { SubmitButton } from "@/app/admin/_components/SubmitButton";
import { formatDay } from "@/app/admin/_components/Timestamp";
import type { NoticeRecord } from "@/lib/cms/notices";

/**
 * A notice in the list, with inline edit and a two-step delete.
 *
 * The delete confirmation is rendered state rather than `window.confirm` so it
 * is styled, keyboard accessible and announced like the rest of the page.
 */
export function NoticeRow({ notice }: { notice: NoticeRecord }) {
  const [editing, setEditing] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const expired =
    notice.expiresAtMs !== null && notice.expiresAtMs <= Date.now();

  return (
    <li className="rounded-xl border border-ink-200 bg-[#fffdf8] p-4 shadow-subtle sm:p-5">
      {editing ? (
        <NoticeEditor notice={notice} onDone={() => setEditing(false)} />
      ) : (
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {notice.active && !expired ? (
              <Pill tone="good">Live</Pill>
            ) : expired ? (
              <Pill tone="warn">Expired</Pill>
            ) : (
              <Pill>Hidden</Pill>
            )}
            <span className="text-[0.6875rem] font-medium text-ink-400">
              order {notice.order}
            </span>
            {notice.expiresAtMs !== null ? (
              <span className="text-[0.6875rem] font-medium text-ink-400">
                until {formatDay(notice.expiresAtMs)}
              </span>
            ) : null}
          </div>

          <p className="text-[0.9375rem] leading-6 text-navy-950">
            {notice.message}
          </p>

          {notice.href ? (
            <p className="text-xs text-ink-500">
              Links to <span className="font-mono">{notice.href}</span>
              {notice.cta ? ` — “${notice.cta}”` : ""}
            </p>
          ) : null}

          <div className="flex flex-wrap items-center gap-2 border-t border-ink-100 pt-3">
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="h-9 rounded-full border border-ink-200 px-4 text-sm font-medium text-navy-900 hover:border-navy-300 hover:bg-white"
            >
              Edit
            </button>

            <form action={toggleNoticeAction}>
              <input type="hidden" name="id" value={notice.id} />
              <SubmitButton
                variant="ghost"
                size="sm"
                pendingLabel={notice.active ? "Hiding…" : "Publishing…"}
              >
                {notice.active ? "Hide" : "Show on site"}
              </SubmitButton>
            </form>

            <span className="flex-1" />

            {confirming ? (
              <form action={deleteNoticeAction} className="flex items-center gap-2">
                <input type="hidden" name="id" value={notice.id} />
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
