"use client";

import { useState } from "react";

import { TeamEditor } from "@/app/admin/(dashboard)/team/TeamEditor";
import { deleteTeamAction, toggleTeamAction } from "@/app/admin/_actions/team";
import { Pill } from "@/app/admin/_components/StatusPill";
import { SubmitButton } from "@/app/admin/_components/SubmitButton";
import { Timestamp } from "@/app/admin/_components/Timestamp";
import type { TeamMember } from "@/lib/cms/team";

export function TeamRow({ member }: { member: TeamMember }) {
  const [editing, setEditing] = useState(false);
  const [confirming, setConfirming] = useState(false);

  return (
    <li className="rounded-xl border border-ink-200 bg-[#fffdf8] p-4 shadow-subtle sm:p-5">
      {editing ? (
        <TeamEditor member={member} onDone={() => setEditing(false)} />
      ) : (
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {member.published ? (
              <Pill tone="good">Live</Pill>
            ) : (
              <Pill>Hidden</Pill>
            )}
            {member.isFounder ? <Pill tone="warn">Founder</Pill> : null}
            <span className="text-[0.6875rem] font-medium text-ink-400">
              order {member.order}
            </span>
            <span className="flex-1" />
            <span className="text-[0.6875rem] font-medium text-ink-400">
              edited <Timestamp ms={member.updatedAtMs} />
            </span>
          </div>

          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <p className="text-[0.9375rem] font-semibold text-navy-950">
              {member.name}
            </p>
            <p className="text-sm text-ink-600">{member.role}</p>
          </div>

          {member.bio ? (
            <p className="line-clamp-2 text-sm leading-6 text-ink-600">
              {member.bio}
            </p>
          ) : null}

          {member.expertise.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {member.expertise.map((skill) => (
                <span
                  key={skill}
                  className="rounded-full border border-ink-200 bg-white px-2.5 py-0.5 text-[0.6875rem] font-medium text-navy-800"
                >
                  {skill}
                </span>
              ))}
            </div>
          ) : null}

          <div className="flex flex-wrap items-center gap-2 border-t border-ink-100 pt-3">
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="h-9 rounded-full border border-ink-200 px-4 text-sm font-medium text-navy-900 hover:border-navy-300 hover:bg-white"
            >
              Edit
            </button>

            <form action={toggleTeamAction}>
              <input type="hidden" name="id" value={member.id} />
              <SubmitButton
                variant="ghost"
                size="sm"
                pendingLabel={member.published ? "Hiding…" : "Publishing…"}
              >
                {member.published ? "Hide" : "Show on site"}
              </SubmitButton>
            </form>

            <span className="flex-1" />

            {confirming ? (
              <form
                action={deleteTeamAction}
                className="flex items-center gap-2"
              >
                <input type="hidden" name="id" value={member.id} />
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
