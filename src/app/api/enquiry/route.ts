import { FieldValue } from "firebase-admin/firestore";
import { NextResponse } from "next/server";

import { contact } from "@/content/site";
import { getCourses } from "@/lib/cms/courses";
import { enquiryNotificationTemplate } from "@/lib/email-templates";
import { enquirySchema, type EnquiryResponse } from "@/lib/enquiry";
import { getDb } from "@/lib/firebase";
import { isMailConfigured, sendMail } from "@/lib/mail";

/**
 * Enquiry capture. Replaces the legacy PHP mail handler.
 *
 * Runs on the Node.js runtime because firebase-admin needs it. Writes are
 * server-side only, so no Firestore credentials or rules are exposed to the
 * client and the collection can stay locked down entirely.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Naive per-instance rate limit. Blunts casual abuse; real protection belongs at the edge. */
const RATE_WINDOW_MS = 60_000;
const RATE_MAX = 5;
const hits = new Map<string, number[]>();

function rateLimited(key: string): boolean {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < RATE_WINDOW_MS);
  recent.push(now);
  hits.set(key, recent);

  // Keep the map from growing unbounded on a long-lived instance.
  if (hits.size > 500) {
    for (const [k, v] of hits) {
      if (v.every((t) => now - t >= RATE_WINDOW_MS)) hits.delete(k);
    }
  }

  return recent.length > RATE_MAX;
}

export async function POST(request: Request): Promise<NextResponse<EnquiryResponse>> {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

  if (rateLimited(ip)) {
    return NextResponse.json(
      { ok: false, error: "Too many enquiries. Please try again in a minute." },
      { status: 429 },
    );
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid request body." },
      { status: 400 },
    );
  }

  // Honeypot: a hidden field only a bot would fill in.
  if (
    typeof payload === "object" &&
    payload !== null &&
    "company" in payload &&
    String((payload as Record<string, unknown>).company ?? "") !== ""
  ) {
    // Look successful so the bot doesn't retry with a different shape.
    return NextResponse.json({ ok: true, queued: false });
  }

  const parsed = enquirySchema.safeParse(payload);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "form");
      if (!fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return NextResponse.json(
      { ok: false, error: "Please check the highlighted fields.", fieldErrors },
      { status: 422 },
    );
  }

  // The shared schema only checks the shape of `course` — it is imported by the
  // client form and cannot reach the catalogue. An unknown slug is dropped
  // rather than rejected: the course is optional, and a stale bookmark should
  // not cost us the enquiry.
  const { courses } = await getCourses();
  const course = courses.some((c) => c.slug === parsed.data.course)
    ? parsed.data.course
    : "";

  const db = getDb();

  if (!db) {
    // Not configured yet. Log a non-PII marker so the event is visible in
    // Vercel logs without exposing personal data.
    console.warn("[enquiry] Firestore not configured; enquiry not persisted", {
      hasName: Boolean(parsed.data.name),
      hasContact: Boolean(parsed.data.phone || parsed.data.email),
      course,
    });
    return NextResponse.json(
      {
        ok: false,
        error:
          "We could not submit the form just now. Please call us on +91 6360304019 and we will help you directly.",
      },
      { status: 503 },
    );
  }

  try {
    const docRef = await db.collection("enquiries").add({
      ...parsed.data,
      course,
      source: "website",
      status: "new",
      userAgent: request.headers.get("user-agent") ?? null,
      createdAt: FieldValue.serverTimestamp(),
    });

    // Attempt email notification — awaited so errors show in terminal logs.
    const mailConfigured = isMailConfigured();
    console.info("[enquiry] mail configured?", mailConfigured, {
      smtpUser: process.env.SMTP_USER ? "set" : "missing",
      smtpPass: process.env.SMTP_PASS ? "set" : "missing",
    });

    if (mailConfigured) {
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
      const recipient =
        process.env.NOTIFICATION_EMAIL ||
        process.env.SMTP_USER ||
        contact.email;

      console.info("[enquiry] sending notification to:", recipient);

      const template = enquiryNotificationTemplate({
        id: docRef.id,
        name: parsed.data.name,
        email: parsed.data.email,
        phone: parsed.data.phone,
        course,
        message: parsed.data.message,
        dashboardUrl: `${siteUrl}/admin/enquiries/${docRef.id}`,
      });

      try {
        const result = await sendMail({
          to: recipient,
          subject: template.subject,
          body: template.text,
          html: template.html,
          replyTo: parsed.data.email,
        });
        console.info("[enquiry] notification email result:", result);
      } catch (err) {
        console.error("[enquiry] notification email threw:", err);
      }
    }

    return NextResponse.json({ ok: true, queued: true });
  } catch (error) {
    console.error("[enquiry] write failed", error);
    return NextResponse.json(
      {
        ok: false,
        error:
          "Something went wrong on our side. Please call us on +91 6360304019.",
      },
      { status: 500 },
    );
  }
}
