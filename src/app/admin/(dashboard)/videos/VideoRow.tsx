"use client";

import Image from "next/image";
import { useState } from "react";

import {
  deleteVideoAction,
  toggleVideoAction,
} from "@/app/admin/_actions/videos";
import { VideoEditor } from "@/app/admin/(dashboard)/videos/VideoEditor";
import { Pill } from "@/app/admin/_components/StatusPill";
import { SubmitButton } from "@/app/admin/_components/SubmitButton";
import type { VideoRecord } from "@/lib/cms/videos";

/**
 * A video in the admin list, with inline edit and two-step delete.
 */
export function VideoRow({ video }: { video: VideoRecord }) {
  const [editing, setEditing] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const thumbnailUrl = video.youtubeId
    ? `https://img.youtube.com/vi/${video.youtubeId}/mqdefault.jpg`
    : null;

  return (
    <li className="rounded-xl border border-ink-200 bg-[#fffdf8] p-4 shadow-subtle sm:p-5">
      {editing ? (
        <VideoEditor video={video} onDone={() => setEditing(false)} />
      ) : (
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {video.active ? (
              <Pill tone="good">Live</Pill>
            ) : (
              <Pill>Hidden</Pill>
            )}
            <span className="text-[0.6875rem] font-medium text-ink-400">
              order {video.order}
            </span>
          </div>

          <div className="flex gap-4">
            {thumbnailUrl ? (
              <Image
                src={thumbnailUrl}
                alt=""
                width={320}
                height={180}
                unoptimized
                className="h-20 w-36 shrink-0 rounded-lg object-cover"
              />
            ) : null}
            <div className="flex-1">
              <p className="text-[0.9375rem] font-semibold text-navy-950">
                {video.title}
              </p>
              {video.description ? (
                <p className="mt-1 text-sm leading-6 text-ink-700">
                  {video.description}
                </p>
              ) : null}
              <p className="mt-1 text-xs text-ink-500 break-all">
                {video.youtubeUrl}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 border-t border-ink-100 pt-3">
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="h-9 rounded-full border border-ink-200 px-4 text-sm font-medium text-navy-900 hover:border-navy-300 hover:bg-white"
            >
              Edit
            </button>

            <form action={toggleVideoAction}>
              <input type="hidden" name="id" value={video.id} />
              <SubmitButton
                variant="ghost"
                size="sm"
                pendingLabel={video.active ? "Hiding…" : "Publishing…"}
              >
                {video.active ? "Hide" : "Show on site"}
              </SubmitButton>
            </form>

            <span className="flex-1" />

            {confirming ? (
              <form action={deleteVideoAction} className="flex items-center gap-2">
                <input type="hidden" name="id" value={video.id} />
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
