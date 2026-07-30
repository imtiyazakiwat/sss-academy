import type { Metadata } from "next";
import Link from "next/link";

import { AdminPageHeader, inputClass } from "@/app/admin/_components/Field";
import { STATUS_LABELS, StatusPill } from "@/app/admin/_components/StatusPill";
import { Timestamp } from "@/app/admin/_components/Timestamp";
import { Button, ButtonLink } from "@/components/ui/Button";
import { getCourse } from "@/content/courses";
import { requireAdmin } from "@/lib/admin/auth";
import {
  ENQUIRY_STATUSES,
  listEnquiries,
  type EnquiryStatus,
} from "@/lib/cms/enquiries";
import { cn } from "@/lib/cn";

export const metadata: Metadata = { title: "Enquiries" };
export const dynamic = "force-dynamic";

const TABS: Array<{ key: EnquiryStatus | "all"; label: string }> = [
  { key: "all", label: "All" },
  ...ENQUIRY_STATUSES.map((s) => ({ key: s, label: STATUS_LABELS[s] })),
];

function first(value: string | string[] | undefined): string {
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

export default async function EnquiriesPage(
  props: PageProps<"/admin/enquiries">,
) {
  await requireAdmin();

  const params = await props.searchParams;
  const search = first(params.q).slice(0, 100);
  const statusParam = first(params.status);
  const status = ENQUIRY_STATUSES.includes(statusParam as EnquiryStatus)
    ? (statusParam as EnquiryStatus)
    : undefined;
  const page = Math.max(1, Number.parseInt(first(params.page), 10) || 1);

  const result = await listEnquiries({ status, search, page });

  /** Preserve the current filter when only one dimension changes. */
  const hrefWith = (next: Record<string, string | undefined>) => {
    const query = new URLSearchParams();
    const merged = { q: search, status: status ?? "", page: "", ...next };
    for (const [key, value] of Object.entries(merged)) {
      if (value) query.set(key, value);
    }
    const qs = query.toString();
    return qs ? `/admin/enquiries?${qs}` : "/admin/enquiries";
  };

  return (
    <>
      <AdminPageHeader
        title="Enquiries"
        description="Everything the contact form has captured. Statuses and notes are internal — nothing here is visible on the website."
        actions={
          // A plain anchor, not next/link: the target is a route handler that
          // returns a file. Client-side navigation cannot handle that, and
          // prefetching it would generate the CSV on hover.
          <a
            href="/admin/enquiries/export"
            download
            className="inline-flex h-9 items-center rounded-full border border-ink-200 bg-[#fffdf8] px-4 text-sm font-medium text-navy-900 transition-colors duration-150 hover:border-navy-300 hover:bg-white"
          >
            Export CSV
          </a>
        }
      />

      {result.unavailable ? (
        <div className="border-l-4 border-ember-600 bg-ember-50 px-4 py-3 text-sm leading-6 text-ember-900">
          Firestore is unreachable, so the inbox cannot be loaded. The public
          site is unaffected — it serves static content.
        </div>
      ) : null}

      {/* Filter tabs. Counts are computed over the current search, so the
          numbers always agree with what the table would show. */}
      <div className="flex flex-wrap items-center gap-2">
        {TABS.map((tab) => {
          const active = (status ?? "all") === tab.key;
          return (
            <Link
              key={tab.key}
              href={hrefWith({ status: tab.key === "all" ? "" : tab.key })}
              aria-current={active ? "page" : undefined}
              className={cn(
                "inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors duration-150",
                active
                  ? "border-navy-900 bg-navy-900 text-white"
                  : "border-ink-200 bg-[#fffdf8] text-ink-700 hover:border-navy-300 hover:text-navy-900",
              )}
            >
              {tab.label}
              <span
                className={cn(
                  "text-[0.6875rem] font-semibold",
                  active ? "text-white/70" : "text-ink-500",
                )}
              >
                {result.counts[tab.key]}
              </span>
            </Link>
          );
        })}
      </div>

      <form method="get" action="/admin/enquiries" className="flex gap-2">
        {status ? <input type="hidden" name="status" value={status} /> : null}
        <label htmlFor="enquiry-search" className="sr-only">
          Search enquiries by name, phone, email or message
        </label>
        <input
          id="enquiry-search"
          type="search"
          name="q"
          defaultValue={search}
          placeholder="Search name, phone, email or message…"
          maxLength={100}
          className={cn(inputClass(), "max-w-md")}
        />
        <Button type="submit" variant="ghost">
          Search
        </Button>
        {search ? (
          <ButtonLink href={hrefWith({ q: "" })} variant="ghost">
            Clear
          </ButtonLink>
        ) : null}
      </form>

      {result.items.length === 0 ? (
        <p className="rounded-xl border border-dashed border-ink-300 bg-[#fffdf8] px-5 py-10 text-center text-sm text-ink-500">
          {result.unavailable
            ? "Nothing to show."
            : search || status
              ? "No enquiries match that filter."
              : "No enquiries yet. They will appear here the moment someone submits the contact form."}
        </p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-ink-200 bg-[#fffdf8] shadow-subtle">
          <table className="w-full border-collapse text-left text-sm">
            <caption className="sr-only">
              Enquiries, newest first. {result.total} matching.
            </caption>
            <thead className="border-b border-ink-200 bg-ink-50">
              <tr className="text-[0.6875rem] font-semibold tracking-wide text-ink-500 uppercase">
                <th scope="col" className="px-4 py-3">
                  Name
                </th>
                <th scope="col" className="hidden px-4 py-3 sm:table-cell">
                  Contact
                </th>
                <th scope="col" className="hidden px-4 py-3 md:table-cell">
                  Course
                </th>
                <th scope="col" className="px-4 py-3">
                  Status
                </th>
                <th scope="col" className="px-4 py-3 text-right">
                  Received
                </th>
              </tr>
            </thead>
            <tbody>
              {result.items.map((enquiry) => {
                const course = enquiry.course ? getCourse(enquiry.course) : null;
                return (
                  <tr
                    key={enquiry.id}
                    className="border-b border-ink-100 last:border-0 hover:bg-ink-50/60"
                  >
                    <td className="px-4 py-3 align-top">
                      <Link
                        href={`/admin/enquiries/${enquiry.id}`}
                        className="font-semibold text-navy-900 underline decoration-ink-300 underline-offset-4 hover:decoration-navy-700"
                      >
                        {enquiry.name || "(no name)"}
                      </Link>
                      <p className="mt-1 line-clamp-1 max-w-md text-xs text-ink-500 sm:hidden">
                        {enquiry.phone}
                      </p>
                      <p className="mt-1 line-clamp-2 max-w-md text-xs leading-5 text-ink-500">
                        {enquiry.message}
                      </p>
                    </td>
                    <td className="hidden px-4 py-3 align-top sm:table-cell">
                      <a
                        href={`tel:+91${enquiry.phone}`}
                        className="block font-medium text-ink-700 hover:text-ember-700"
                      >
                        {enquiry.phone}
                      </a>
                      <a
                        href={`mailto:${enquiry.email}`}
                        className="mt-0.5 block max-w-[14rem] truncate text-xs text-ink-500 hover:text-ember-700"
                      >
                        {enquiry.email}
                      </a>
                    </td>
                    <td className="hidden px-4 py-3 align-top text-ink-600 md:table-cell">
                      {course?.title ?? (enquiry.course || "—")}
                    </td>
                    <td className="px-4 py-3 align-top">
                      <StatusPill status={enquiry.status} />
                    </td>
                    <td className="px-4 py-3 text-right align-top whitespace-nowrap text-ink-500">
                      <Timestamp ms={enquiry.createdAtMs} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {result.pageCount > 1 ? (
        <nav
          aria-label="Pagination"
          className="flex items-center justify-between gap-3 text-sm"
        >
          <span className="text-ink-500">
            Page {result.page} of {result.pageCount} · {result.total} enquir
            {result.total === 1 ? "y" : "ies"}
          </span>
          <span className="flex gap-2">
            {result.page > 1 ? (
              <ButtonLink
                href={hrefWith({ page: String(result.page - 1) })}
                variant="ghost"
                size="sm"
              >
                Previous
              </ButtonLink>
            ) : null}
            {result.page < result.pageCount ? (
              <ButtonLink
                href={hrefWith({ page: String(result.page + 1) })}
                variant="ghost"
                size="sm"
              >
                Next
              </ButtonLink>
            ) : null}
          </span>
        </nav>
      ) : null}

      {result.windowCapped ? (
        <p className="text-xs leading-5 text-ink-500">
          Showing the most recent 500 enquiries. Filtering and search run over
          that window, so anything older is not included — worth revisiting if
          the inbox grows past it.
        </p>
      ) : null}
    </>
  );
}
