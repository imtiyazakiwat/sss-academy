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
              <ContactAction href={telHref} label="Call" value={enquiry.phone} />
              <ContactAction
                href={whatsappHref}
                label="WhatsApp"
                value={enquiry.phone}
                external
              />
              <ContactAction
                href={mailHref}
                label="Email"
                value={enquiry.email}
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
  external = false,
}: {
  href: string;
  label: string;
  value: string;
  external?: boolean;
}) {
  return (
    <a
      href={href}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      className="flex items-baseline justify-between gap-3 rounded-lg border border-ink-200 px-3 py-2 transition-colors duration-150 hover:border-navy-300 hover:bg-white"
    >
      <span className="text-sm font-semibold text-navy-900">{label}</span>
      <span className="min-w-0 truncate text-xs text-ink-500">{value}</span>
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
