import type { Metadata } from "next";
import Link from "next/link";

import { AdminPageHeader, Card } from "@/app/admin/_components/Field";
import { STATUS_LABELS, StatusPill } from "@/app/admin/_components/StatusPill";
import { Timestamp } from "@/app/admin/_components/Timestamp";
import { getCourse } from "@/content/courses";
import { requireAdmin } from "@/lib/admin/auth";
import { getActiveBanners } from "@/lib/cms/banners";
import { listAllCourses } from "@/lib/cms/courses";
import { ENQUIRY_STATUSES, getEnquiryStats } from "@/lib/cms/enquiries";
import { getActiveNotices } from "@/lib/cms/notices";
import { listAllPlacements } from "@/lib/cms/placements";
import { listAllTeam } from "@/lib/cms/team";

export const metadata: Metadata = { title: "Overview" };
export const dynamic = "force-dynamic";

export default async function AdminOverviewPage() {
  const session = await requireAdmin();

  const [
    { counts, recent, unavailable },
    notices,
    banners,
    courses,
    placements,
    team,
  ] = await Promise.all([
    getEnquiryStats(),
    getActiveNotices(),
    getActiveBanners(),
    listAllCourses(),
    listAllPlacements(),
    listAllTeam(),
  ]);

  const firstName = session.name.split(" ")[0] || "there";

  const contentStats = [
    {
      label: "Students placed",
      value: placements?.length ?? null,
      href: "/admin/placements",
    },
    {
      label: "Courses",
      value: courses?.length ?? null,
      href: "/admin/courses",
    },
    {
      label: "Staff",
      value: team?.length ?? null,
      href: "/admin/team",
    },
  ];

  return (
    <>
      <AdminPageHeader
        title={`Hello, ${firstName}`}
        description={
          counts.new > 0
            ? `${counts.new} enquir${counts.new === 1 ? "y" : "ies"} nobody has picked up yet.`
            : "Nothing is waiting. Every enquiry has been picked up."
        }
      />

      {unavailable ? (
        <div className="border-l-4 border-ember-600 bg-ember-50 px-4 py-3 text-sm leading-6 text-ember-900">
          Firestore is unreachable, so these numbers are not available. The
          public site is unaffected.
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {ENQUIRY_STATUSES.map((status) => (
          <Link
            key={status}
            href={`/admin/enquiries?status=${status}`}
            className="rounded-xl border border-ink-200 bg-[#fffdf8] p-4 shadow-subtle transition-colors duration-150 hover:border-navy-300 hover:bg-white"
          >
            <p className="text-[0.6875rem] font-semibold tracking-wide text-ink-500 uppercase">
              {STATUS_LABELS[status]}
            </p>
            <p className="mt-1.5 text-3xl font-semibold tracking-[-0.03em] text-navy-950">
              {counts[status]}
            </p>
          </Link>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {contentStats.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="rounded-xl border border-ink-200 bg-[#fffdf8] p-4 shadow-subtle transition-colors duration-150 hover:border-navy-300 hover:bg-white"
          >
            <p className="text-[0.6875rem] font-semibold tracking-wide text-ink-500 uppercase">
              {stat.label}
            </p>
            <p className="mt-1.5 text-3xl font-semibold tracking-[-0.03em] text-navy-950">
              {stat.value ?? "—"}
            </p>
          </Link>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_16rem_16rem]">
        <Card>
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="text-title text-navy-950">Latest enquiries</h2>
            <Link
              href="/admin/enquiries"
              className="text-sm font-medium text-ink-500 underline decoration-ink-300 underline-offset-4 hover:text-navy-900"
            >
              See all
            </Link>
          </div>

          {recent.length === 0 ? (
            <p className="mt-4 text-sm text-ink-500">
              No enquiries captured yet.
            </p>
          ) : (
            <ul className="mt-4 flex flex-col divide-y divide-ink-100">
              {recent.map((enquiry) => {
                const course = enquiry.course ? getCourse(enquiry.course) : null;
                return (
                  <li key={enquiry.id} className="py-3 first:pt-0 last:pb-0">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <Link
                        href={`/admin/enquiries/${enquiry.id}`}
                        className="text-sm font-semibold text-navy-900 underline decoration-ink-300 underline-offset-4 hover:decoration-navy-700"
                      >
                        {enquiry.name || "(no name)"}
                      </Link>
                      <span className="flex items-center gap-2">
                        <StatusPill status={enquiry.status} />
                        <span className="text-xs text-ink-500">
                          <Timestamp ms={enquiry.createdAtMs} />
                        </span>
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-ink-500">
                      {course?.title ?? enquiry.course ?? "No course selected"} ·{" "}
                      {enquiry.phone}
                    </p>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        <Card>
          <h2 className="text-title text-navy-950">Notice bar</h2>
          <p className="mt-1.5 text-sm leading-6 text-ink-600">
            {notices.length === 0
              ? "Nothing is showing on the site."
              : `${notices.length} active notice${notices.length === 1 ? "" : "s"}. The site shows the first.`}
          </p>
          {notices.length > 0 ? (
            <p className="mt-3 rounded-lg bg-ink-50 px-3 py-2 text-xs leading-5 text-ink-700">
              {notices[0].message}
            </p>
          ) : null}
          <Link
            href="/admin/notices"
            className="mt-4 inline-block text-sm font-medium text-ember-700 underline decoration-ember-300 underline-offset-4"
          >
            Manage notices
          </Link>
        </Card>

        <Card>
          <h2 className="text-title text-navy-950">Homepage popup</h2>
          <p className="mt-1.5 text-sm leading-6 text-ink-600">
            {banners.length === 0
              ? "Nothing is popping up on the homepage."
              : `${banners.length} active banner${banners.length === 1 ? "" : "s"}. Visitors see it on every load.`}
          </p>
          {banners.length > 0 ? (
            <p className="mt-3 rounded-lg bg-ink-50 px-3 py-2 text-xs leading-5 text-ink-700">
              {banners[0].title}
            </p>
          ) : null}
          <Link
            href="/admin/banners"
            className="mt-4 inline-block text-sm font-medium text-ember-700 underline decoration-ember-300 underline-offset-4"
          >
            Manage banners
          </Link>
        </Card>
      </div>
    </>
  );
}
