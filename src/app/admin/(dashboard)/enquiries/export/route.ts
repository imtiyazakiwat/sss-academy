import { getSession } from "@/lib/admin/auth";
import { exportEnquiries } from "@/lib/cms/enquiries";

/**
 * CSV export of the enquiry inbox.
 *
 * A route handler rather than a server action because the response is a file
 * download. It sits under `/admin` so middleware covers it, but middleware only
 * checks that a cookie exists — the `getSession()` call below is the actual
 * gate. It returns 403 instead of redirecting, since a redirect to an HTML login
 * page is a confusing thing to hand a download.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** RFC 4180: quote everything, double any embedded quote. Neutralize formula injection. */
function csvCell(value: string | number | null): string {
  let text = value === null ? "" : String(value);
  // Neutralize CSV/spreadsheet formula injection
  if (/^[=+\-@\t\r]/.test(text)) {
    text = `'${text}`;
  }
  return `"${text.replace(/"/g, '""')}"`;
}

const HEADERS = [
  "id",
  "received",
  "name",
  "phone",
  "email",
  "course",
  "status",
  "source",
  "message",
] as const;

export async function GET(): Promise<Response> {
  const session = await getSession({ checkRevoked: true });
  if (!session) {
    return new Response("Forbidden", { status: 403 });
  }

  const enquiries = await exportEnquiries();
  if (!enquiries) {
    return new Response("Enquiries are unavailable right now.", { status: 503 });
  }

  const rows = enquiries.map((enquiry) =>
    [
      enquiry.id,
      enquiry.createdAtMs ? new Date(enquiry.createdAtMs).toISOString() : "",
      enquiry.name,
      // Excel eats a leading-zero or +91 phone number as a formula/number.
      // A tab prefix is the conventional way to force a text column.
      `\t${enquiry.phone}`,
      enquiry.email,
      enquiry.course,
      enquiry.status,
      enquiry.source,
      enquiry.message,
    ]
      .map(csvCell)
      .join(","),
  );

  // BOM so Excel opens it as UTF-8 rather than mangling any non-ASCII name.
  const csv = `\uFEFF${[HEADERS.join(","), ...rows].join("\r\n")}\r\n`;
  const stamp = new Date().toISOString().slice(0, 10);

  return new Response(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="sss-enquiries-${stamp}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
