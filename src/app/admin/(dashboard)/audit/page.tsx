import type { Metadata } from "next";

import { AdminPageHeader } from "@/app/admin/_components/Field";
import { Pill } from "@/app/admin/_components/StatusPill";
import { Timestamp } from "@/app/admin/_components/Timestamp";
import { requireAdmin } from "@/lib/admin/auth";
import { listAudit, type AuditAction } from "@/lib/admin/audit";

export const metadata: Metadata = { title: "Audit log" };
export const dynamic = "force-dynamic";

const TONE: Record<AuditAction, "good" | "neutral" | "bad"> = {
  create: "good",
  update: "neutral",
  delete: "bad",
};

/**
 * Read-only. Saving in the dashboard publishes immediately, so this is the
 * record that makes an edit-live workflow safe — every change, who made it, and
 * the document on both sides.
 */
export default async function AuditPage() {
  await requireAdmin();

  const entries = await listAudit(100);

  return (
    <>
      <AdminPageHeader
        title="Audit log"
        description="The last 100 changes. Editing publishes immediately, so this is how a bad edit gets found and undone."
      />

      {entries.length === 0 ? (
        <p className="rounded-xl border border-dashed border-ink-300 bg-[#fffdf8] px-5 py-10 text-center text-sm text-ink-500">
          Nothing logged yet.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {entries.map((entry) => (
            <li
              key={entry.id}
              className="rounded-xl border border-ink-200 bg-[#fffdf8] p-4 shadow-subtle"
            >
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <Pill tone={TONE[entry.action]}>{entry.action}</Pill>
                <span className="font-mono text-ink-700">{entry.entity}</span>
                <span className="font-mono text-ink-400 break-all">
                  {entry.entityId}
                </span>
                <span className="flex-1" />
                <span className="text-ink-500">{entry.actorEmail}</span>
                <span aria-hidden="true" className="text-ink-300">
                  ·
                </span>
                <span className="text-ink-500">
                  <Timestamp ms={entry.atMs} />
                </span>
              </div>

              {entry.before !== null || entry.after !== null ? (
                <details className="mt-3">
                  <summary className="cursor-pointer text-xs font-medium text-ink-500 hover:text-navy-900">
                    Before and after
                  </summary>
                  <div className="mt-2 grid gap-2 sm:grid-cols-2">
                    <Snapshot label="Before" value={entry.before} />
                    <Snapshot label="After" value={entry.after} />
                  </div>
                </details>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

function Snapshot({ label, value }: { label: string; value: unknown }) {
  return (
    <div>
      <p className="text-[0.625rem] font-semibold tracking-wide text-ink-400 uppercase">
        {label}
      </p>
      <pre className="mt-1 overflow-x-auto rounded-lg bg-ink-50 p-3 font-mono text-[0.6875rem] leading-5 text-ink-700">
        {value === null ? "—" : JSON.stringify(value, null, 2)}
      </pre>
    </div>
  );
}
