import type { Metadata } from "next";

import { NoticeEditor } from "@/app/admin/(dashboard)/notices/NoticeEditor";
import { NoticeRow } from "@/app/admin/(dashboard)/notices/NoticeRow";
import { AdminPageHeader, Card } from "@/app/admin/_components/Field";
import { requireAdmin } from "@/lib/admin/auth";
import { listAllNotices } from "@/lib/cms/notices";

export const metadata: Metadata = { title: "Notices" };
export const dynamic = "force-dynamic";

/**
 * The announcement bar, editable. This collection has existed since launch but
 * has only ever been editable from the Firebase console — this page is the
 * whole point of the dashboard for day-to-day use.
 */
export default async function NoticesPage() {
  await requireAdmin();

  const notices = await listAllNotices();

  return (
    <>
      <AdminPageHeader
        title="Notices"
        description="The bar across the top of every public page. Nothing shows unless a notice is active, so the site never carries urgency somebody did not publish."
      />

      {notices === null ? (
        <div className="border-l-4 border-ember-600 bg-ember-50 px-4 py-3 text-sm leading-6 text-ember-900">
          Firestore is unreachable, so notices cannot be loaded or edited. The
          public site simply shows no notice bar.
        </div>
      ) : (
        <>
          <Card>
            <h2 className="text-title text-navy-950">New notice</h2>
            <p className="mt-1 text-sm leading-6 text-ink-600">
              Saving publishes straight to the live site. There is no draft step —
              the audit log is the safety net.
            </p>
            <div className="mt-5">
              <NoticeEditor />
            </div>
          </Card>

          <section className="flex flex-col gap-4">
            <h2 className="text-title text-navy-950">
              All notices{" "}
              <span className="text-base font-normal text-ink-500">
                ({notices.length})
              </span>
            </h2>

            {notices.length === 0 ? (
              <p className="rounded-xl border border-dashed border-ink-300 bg-[#fffdf8] px-5 py-10 text-center text-sm text-ink-500">
                No notices yet.
              </p>
            ) : (
              <ul className="flex flex-col gap-3">
                {notices.map((notice) => (
                  <NoticeRow key={notice.id} notice={notice} />
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </>
  );
}
