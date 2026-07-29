"use client";

import { useState } from "react";

import {
  deleteBannerAction,
  toggleBannerAction,
} from "@/app/admin/_actions/banners";
import { BannerEditor } from "@/app/admin/(dashboard)/banners/BannerEditor";
import { Pill } from "@/app/admin/_components/StatusPill";
import { SubmitButton } from "@/app/admin/_components/SubmitButton";
import { formatDay } from "@/app/admin/_components/Timestamp";
import type { BannerRecord } from "@/lib/cms/banners";

/**
 * A banner in the list, with inline edit and a two-step delete. Mirrors
 * NoticeRow — same interaction pattern, different entity.
 */
export function BannerRow({ banner }: { banner: BannerRecord }) {
  const [editing, setEditing] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const expired =
    banner.expiresAtMs !== null && banner.expiresAtMs <= Date.now();

  return (
    <li className="rounded-xl border border-ink-200 bg-[#fffdf8] p-4 shadow-subtle sm:p-5">
      {editing ? (
        <BannerEditor banner={banner} onDone={() => setEditing(false)} />
      ) : (
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {banner.active && !expired ? (
              <Pill tone="good">Live</Pill>
            ) : expired ? (
              <Pill tone="warn">Expired</Pill>
            ) : (
              <Pill>Hidden</Pill>
            )}
            <span className="text-[0.6875rem] font-medium text-ink-400">
              order {banner.order}
            </span>
            {banner.expiresAtMs !== null ? (
              <span className="text-[0.6875rem] font-medium text-ink-400">
                until {formatDay(banner.expiresAtMs)}
              </span>
            ) : null}
          </div>

          <p className="text-[0.9375rem] font-semibold text-navy-950">
            {banner.title}
          </p>
          <p className="text-sm leading-6 text-ink-700">{banner.description}</p>

          <p className="text-xs text-ink-500">
            <span className="font-mono">{banner.primaryHref}</span>
            {banner.primaryLabel ? ` — “${banner.primaryLabel}”` : ""}
            {banner.secondaryHref ? (
              <>
                {" · "}
                <span className="font-mono">{banner.secondaryHref}</span>
                {banner.secondaryLabel ? ` — “${banner.secondaryLabel}”` : ""}
              </>
            ) : null}
          </p>

          {banner.deadlineAtMs ? (
            <p className="text-xs text-ink-500">
              {banner.deadlineLabel || "Last date to apply"}:{" "}
              {formatDay(banner.deadlineAtMs)}
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

            <form action={toggleBannerAction}>
              <input type="hidden" name="id" value={banner.id} />
              <SubmitButton
                variant="ghost"
                size="sm"
                pendingLabel={banner.active ? "Hiding…" : "Publishing…"}
              >
                {banner.active ? "Hide" : "Show on site"}
              </SubmitButton>
            </form>

            <span className="flex-1" />

            {confirming ? (
              <form action={deleteBannerAction} className="flex items-center gap-2">
                <input type="hidden" name="id" value={banner.id} />
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
