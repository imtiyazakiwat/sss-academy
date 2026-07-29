import "server-only";

import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { unstable_cache } from "next/cache";
import { z } from "zod";

import { NOTICES_TAG } from "@/lib/admin/tags";
import { getDb } from "@/lib/firebase";

/**
 * Notices — the announcement bar above every page.
 *
 * The only genuinely time-sensitive element on the site (batch starts,
 * admission deadlines), so it has always lived in Firestore. It now reads
 * through a tagged cache: one Firestore read per edit rather than one per
 * pageview. `revalidateTag(NOTICES_TAG)` in the admin actions is what makes a
 * change appear.
 *
 * There is no static fallback and there should not be one. When Firestore is
 * unreachable the bar renders nothing, which is correct — we never manufacture
 * urgency the staff did not publish.
 */

export interface Notice {
  id: string;
  message: string;
  href?: string;
  cta?: string;
}

export interface NoticeRecord {
  id: string;
  message: string;
  href: string;
  cta: string;
  active: boolean;
  order: number;
  /** Millis, not a Timestamp — cached values must be plain JSON. */
  expiresAtMs: number | null;
}

export const noticeSchema = z.object({
  message: z
    .string()
    .trim()
    .min(4, "Write the notice text")
    .max(160, "Keep it under 160 characters — it has to fit on one line"),
  href: z
    .string()
    .trim()
    .max(300)
    .refine(
      (v) => v === "" || v.startsWith("/") || /^https?:\/\//.test(v),
      "Use a path like /courses or a full https:// URL",
    )
    .optional()
    .default(""),
  cta: z.string().trim().max(40, "Keep the link label short").optional().default(""),
  active: z.boolean().optional().default(false),
  order: z.number().int().min(0).max(999).optional().default(0),
  /** `yyyy-mm-dd` from a date input, or empty for no expiry. */
  expiresAt: z
    .string()
    .trim()
    .refine((v) => v === "" || !Number.isNaN(Date.parse(v)), "Not a valid date")
    .optional()
    .default(""),
});

export type NoticeInput = z.output<typeof noticeSchema>;

function toRecord(id: string, data: Record<string, unknown>): NoticeRecord {
  const expiresAt = data.expiresAt as { toMillis?: () => number } | undefined;
  return {
    id,
    message: String(data.message ?? ""),
    href: typeof data.href === "string" ? data.href : "",
    cta: typeof data.cta === "string" ? data.cta : "",
    active: data.active === true,
    order: typeof data.order === "number" ? data.order : 0,
    expiresAtMs: expiresAt?.toMillis?.() ?? null,
  };
}

/* ------------------------------------------------------------------ *
 * Public read
 * ------------------------------------------------------------------ */

async function fetchActiveNotices(): Promise<NoticeRecord[]> {
  const db = getDb();
  if (!db) return [];

  try {
    const snapshot = await db
      .collection("notices")
      .where("active", "==", true)
      .limit(10)
      .get();

    return snapshot.docs
      .map((doc) => toRecord(doc.id, doc.data()))
      .filter((n) => n.message)
      .sort((a, b) => a.order - b.order);
  } catch (error) {
    console.error("[cms/notices] fetch failed", error);
    return [];
  }
}

const cachedActiveNotices = unstable_cache(fetchActiveNotices, ["cms:notices"], {
  tags: [NOTICES_TAG],
});

/**
 * Expiry is applied *after* the cache, not inside it. Caching the comparison
 * would freeze "not expired yet" into the cached value and keep showing a
 * notice past its date until someone happened to edit something.
 */
export async function getActiveNotices(): Promise<Notice[]> {
  const notices = await cachedActiveNotices();
  const now = Date.now();

  return notices
    .filter((n) => n.expiresAtMs === null || n.expiresAtMs > now)
    .map(({ id, message, href, cta }) => ({
      id,
      message,
      href: href || undefined,
      cta: cta || undefined,
    }));
}

/* ------------------------------------------------------------------ *
 * Admin reads and writes
 * ------------------------------------------------------------------ */

/** Uncached — the dashboard must always show what is actually stored. */
export async function listAllNotices(): Promise<NoticeRecord[] | null> {
  const db = getDb();
  if (!db) return null;

  try {
    const snapshot = await db.collection("notices").limit(100).get();
    return snapshot.docs
      .map((doc) => toRecord(doc.id, doc.data()))
      .sort((a, b) => a.order - b.order || a.message.localeCompare(b.message));
  } catch (error) {
    console.error("[cms/notices] admin list failed", error);
    return null;
  }
}

export async function getNotice(id: string): Promise<NoticeRecord | null> {
  const db = getDb();
  if (!db) return null;

  try {
    const snap = await db.collection("notices").doc(id).get();
    return snap.exists ? toRecord(snap.id, snap.data() ?? {}) : null;
  } catch (error) {
    console.error("[cms/notices] get failed", id, error);
    return null;
  }
}

function toDocument(input: NoticeInput) {
  return {
    message: input.message,
    href: input.href || null,
    cta: input.cta || null,
    active: input.active,
    order: input.order,
    expiresAt: input.expiresAt
      ? Timestamp.fromDate(new Date(input.expiresAt))
      : null,
    updatedAt: FieldValue.serverTimestamp(),
  };
}

export async function createNotice(input: NoticeInput): Promise<string | null> {
  const db = getDb();
  if (!db) return null;

  try {
    const doc = await db.collection("notices").add({
      ...toDocument(input),
      createdAt: FieldValue.serverTimestamp(),
    });
    return doc.id;
  } catch (error) {
    console.error("[cms/notices] create failed", error);
    return null;
  }
}

export async function updateNotice(
  id: string,
  input: NoticeInput,
): Promise<boolean> {
  const db = getDb();
  if (!db) return false;

  try {
    await db.collection("notices").doc(id).set(toDocument(input), { merge: true });
    return true;
  } catch (error) {
    console.error("[cms/notices] update failed", id, error);
    return false;
  }
}

export async function deleteNotice(id: string): Promise<boolean> {
  const db = getDb();
  if (!db) return false;

  try {
    await db.collection("notices").doc(id).delete();
    return true;
  } catch (error) {
    console.error("[cms/notices] delete failed", id, error);
    return false;
  }
}
