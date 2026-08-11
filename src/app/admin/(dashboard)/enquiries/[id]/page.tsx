import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ReplyForm } from "@/app/admin/(dashboard)/enquiries/[id]/ReplyForm";
import { StatusForm } from "@/app/admin/(dashboard)/enquiries/[id]/StatusForm";
import { Card } from "@/app/admin/_components/Field";
import { Pill, StatusPill } from "@/app/admin/_components/StatusPill";
import { Timestamp, formatAbsolute } from "@/app/admin/_components/Timestamp";
import { getCourse } from "@/content/courses";
import { site } from "@/content/site";
import { requireAdmin } from "@/lib/admin/auth";
import {
  getEnquiry,
  listReplies,
  type DeliveryStatus,
  type ReplyChannel,
} from "@/lib/cms/enquiries";

export const metadata: Metadata = { title: "Enquiry" };
export const dynamic = "force-dynamic";

/** Terser than the composer's labels — these sit inside a dense pill. */
const THREAD_LABELS: Record<ReplyChannel, string> = {
  note: "Note",
  call: "Call",
  whatsapp: "WhatsApp",
  email: "Email",
};

const DELIVERY_TONE: Record<DeliveryStatus, "neutral" | "good" | "warn" | "bad"> =
  {
    "not-sent": "neutral",
    pending: "warn",
    sent: "good",
    failed: "bad",
  };

export default async function EnquiryDetailPage(
  props: PageProps<"/admin/enquiries/[id]">,
) {
  await requireAdmin();

  const { id } = await props.params;
  const [enquiry, replies] = await Promise.all([
    getEnquiry(id),
    listReplies(id),
  ]);

  if (!enquiry) notFound();

  const course = enquiry.course ? getCourse(enquiry.course) : null;

  // Deep links are built from the enquirer's own number, not the academy's.
  // Phones are stored as ten digits by the form's schema.
  const telHref = `tel:+91${enquiry.phone}`;
  const whatsappText = encodeURIComponent(
    `Hello ${enquiry.name}, this is ${site.name} replying to your enquiry${
      course ? ` about our ${course.title} course` : ""
    }.`,
  );
  const whatsappHref = `https://wa.me/91${enquiry.phone}?text=${whatsappText}`;
  const mailHref = `mailto:${enquiry.email}?subject=${encodeURIComponent(
    `Re: your enquiry to ${site.name}`,
  )}`;

  return (
    <>
      <div>
        <Link
          href="/admin/enquiries"
          className="text-sm font-medium text-ink-500 underline decoration-ink-300 underline-offset-4 hover:text-navy-900"
        >
          ← All enquiries
        </Link>
      </div>

      <header className="flex flex-wrap items-start justify-between gap-4 border-b border-ink-200 pb-5">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-headline text-navy-950">
              {enquiry.name || "(no name)"}
            </h1>
            <StatusPill status={enquiry.status} />
          </div>
          <p className="mt-1.5 text-sm text-ink-600">
            Received <Timestamp ms={enquiry.createdAtMs} /> ·{" "}
            {enquiry.createdAtMs
              ? formatAbsolute(enquiry.createdAtMs)
              : "no timestamp"}
          </p>
        </div>
        <StatusForm id={enquiry.id} status={enquiry.status} />
      </header>

      <div className="grid gap-6 lg:grid-cols-[1fr_18rem]">
        <div className="flex min-w-0 flex-col gap-6">
          <Card>
            <h2 className="text-[0.6875rem] font-semibold tracking-wide text-ink-500 uppercase">
              Their message
            </h2>
            <p className="mt-3 text-[0.9375rem] leading-7 whitespace-pre-wrap text-ink-800">
              {enquiry.message || "(no message)"}
            </p>
          </Card>

          <section className="flex flex-col gap-4">
            <h2 className="text-title text-navy-950">Thread</h2>

            {replies.length === 0 ? (
              <p className="rounded-xl border border-dashed border-ink-300 bg-[#fffdf8] px-5 py-8 text-center text-sm text-ink-500">
                Nothing logged yet. Record calls and notes here so whoever picks
                this up next knows where it stands.
              </p>
            ) : (
              <ol className="flex flex-col gap-3">
                {replies.map((reply) => (
                  <li
                    key={reply.id}
                    className="rounded-xl border border-ink-200 bg-[#fffdf8] p-4 shadow-subtle"
                  >
                    <div className="flex flex-wrap items-center gap-2 text-xs text-ink-500">
                      <Pill tone={reply.channel === "note" ? "neutral" : "good"}>
                        {THREAD_LABELS[reply.channel]}
                      </Pill>
                      <span className="font-medium text-ink-700">
                        {reply.authorName}
                      </span>
                      <span aria-hidden="true">·</span>
                      <Timestamp ms={reply.createdAtMs} />
                      {reply.channel === "email" ? (
                        <Pill tone={DELIVERY_TONE[reply.deliveryStatus]}>
                          {reply.deliveryStatus}
                        </Pill>
                      ) : null}
                    </div>
                    <p className="mt-2.5 text-sm leading-6 whitespace-pre-wrap text-ink-800">
                      {reply.body}
                    </p>
                  </li>
                ))}
              </ol>
            )}

            <Card>
              <h3 className="text-[0.6875rem] font-semibold tracking-wide text-ink-500 uppercase">
                Add to thread
              </h3>
              <div className="mt-4">
                <ReplyForm id={enquiry.id} />
              </div>
            </Card>
          </section>
        </div>

        <aside className="flex flex-col gap-4">
          <Card>
            <h2 className="text-[0.6875rem] font-semibold tracking-wide text-ink-500 uppercase">
              Reach them
            </h2>
            <div className="mt-3 flex flex-col gap-2">
              <ContactAction
                href={telHref}
                label="Call"
                value={enquiry.phone}
                icon={
                  <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                }
              />
              <ContactAction
                href={whatsappHref}
                label="WhatsApp"
                value={enquiry.phone}
                external
                icon={
                  <svg className="size-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.197 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.572-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884" />
                  </svg>
                }
              />
              <ContactAction
                href={mailHref}
                label="Email"
                value={enquiry.email}
                icon={
                  <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                }
              />
            </div>
          </Card>

          <Card>
            <h2 className="text-[0.6875rem] font-semibold tracking-wide text-ink-500 uppercase">
              Details
            </h2>
            <dl className="mt-3 flex flex-col gap-3 text-sm">
              <Detail label="Course of interest">
                {course?.title ?? (enquiry.course || "Not specified")}
              </Detail>
              <Detail label="Source">{enquiry.source}</Detail>
              <Detail label="Last updated">
                <Timestamp ms={enquiry.updatedAtMs} />
              </Detail>
              <Detail label="Reference">
                <span className="font-mono text-xs break-all">{enquiry.id}</span>
              </Detail>
              {enquiry.userAgent ? (
                <Detail label="Device">
                  <span className="text-xs break-words text-ink-500">
                    {enquiry.userAgent}
                  </span>
                </Detail>
              ) : null}
            </dl>
          </Card>
        </aside>
      </div>
    </>
  );
}

function ContactAction({
  href,
  label,
  value,
  icon,
  external = false,
}: {
  href: string;
  label: string;
  value: string;
  icon?: React.ReactNode;
  external?: boolean;
}) {
  return (
    <a
      href={href}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      className="group flex items-center justify-between gap-3 rounded-lg border border-ink-200 bg-[#fffdf8] px-3.5 py-2.5 transition-all duration-200 hover:border-navy-400 hover:bg-white hover:shadow-subtle"
    >
      <div className="flex items-center gap-2.5 min-w-0">
        {icon && <span className="text-ink-400 group-hover:text-navy-700 transition-colors">{icon}</span>}
        <span className="text-sm font-semibold text-navy-900 group-hover:text-navy-950">{label}</span>
      </div>
      <span className="min-w-0 truncate text-xs font-mono text-ink-500 group-hover:text-ink-700 transition-colors">{value}</span>
    </a>
  );
}

function Detail({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <dt className="text-xs font-medium text-ink-500">{label}</dt>
      <dd className="mt-0.5 text-ink-800">{children}</dd>
    </div>
  );
}
