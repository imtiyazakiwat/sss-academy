import "server-only";

import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { unstable_cache } from "next/cache";
import { z } from "zod";

import { BANNERS_TAG } from "@/lib/admin/tags";
import { getDb } from "@/lib/firebase";

/**
 * Banners — the homepage announcement popup.
 *
 * Same shape as notices (Firestore, tagged cache, no static fallback) but
 * heavier: a modal with a heading, body copy, two calls to action and an
 * optional deadline line, shown once per browser session rather than pinned
 * across every page. Nothing shows unless staff mark it active, and expiry is
 * checked after the cache read so a passed deadline hides itself without
 * anyone needing to remember to switch it off.
 */

export interface Banner {
  id: string;
  title: string;
  description: string;
  primaryLabel: string;
  primaryHref: string;
  secondaryLabel?: string;
  secondaryHref?: string;
  deadlineLabel?: string;
  deadlineAtMs?: number;
}

export interface BannerRecord {
  id: string;
  title: string;
  description: string;
  primaryLabel: string;
  primaryHref: string;
  secondaryLabel: string;
  secondaryHref: string;
  deadlineLabel: string;
  active: boolean;
  order: number;
  /** Millis, not a Timestamp — cached values must be plain JSON. */
  deadlineAtMs: number | null;
  expiresAtMs: number | null;
}

const hrefField = z
  .string()
  .trim()
  .max(300)
  .refine(
    (v) => v === "" || v.startsWith("/") || /^https?:\/\//.test(v),
    "Use a path like /contact or a full https:// URL",
  );

export const bannerSchema = z.object({
  title: z
    .string()
    .trim()
    .min(4, "Write a heading")
    .max(80, "Keep the heading under 80 characters"),
  description: z
    .string()
    .trim()
    .min(4, "Write the popup copy")
    .max(240, "Keep it under 240 characters"),
  primaryLabel: z
    .string()
    .trim()
    .min(1, "The main button needs a label")
    .max(40, "Keep the label short")
    .default("Apply Now"),
  primaryHref: hrefField.refine((v) => v !== "", "The main button needs a link"),
  secondaryLabel: z
    .string()
    .trim()
    .max(40, "Keep the label short")
    .optional()
    .default(""),
  secondaryHref: hrefField.optional().default(""),
  deadlineLabel: z
    .string()
    .trim()
    .max(60, "Keep it short")
    .optional()
    .default("Last date to apply"),
  /** `yyyy-mm-dd` from a date input, or empty for no deadline line. */
  deadlineAt: z
    .string()
    .trim()
    .refine((v) => v === "" || !Number.isNaN(Date.parse(v)), "Not a valid date")
    .optional()
    .default(""),
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

export type BannerInput = z.output<typeof bannerSchema>;

function toRecord(id: string, data: Record<string, unknown>): BannerRecord {
  const deadlineAt = data.deadlineAt as { toMillis?: () => number } | undefined;
  const expiresAt = data.expiresAt as { toMillis?: () => number } | undefined;
  return {
    id,
    title: String(data.title ?? ""),
    description: String(data.description ?? ""),
    primaryLabel: typeof data.primaryLabel === "string" ? data.primaryLabel : "Apply Now",
    primaryHref: typeof data.primaryHref === "string" ? data.primaryHref : "",
    secondaryLabel: typeof data.secondaryLabel === "string" ? data.secondaryLabel : "",
    secondaryHref: typeof data.secondaryHref === "string" ? data.secondaryHref : "",
    deadlineLabel:
      typeof data.deadlineLabel === "string" && data.deadlineLabel
        ? data.deadlineLabel
        : "Last date to apply",
    active: data.active === true,
    order: typeof data.order === "number" ? data.order : 0,
    deadlineAtMs: deadlineAt?.toMillis?.() ?? null,
    expiresAtMs: expiresAt?.toMillis?.() ?? null,
  };
}

/* ------------------------------------------------------------------ *
 * Public read
 * ------------------------------------------------------------------ */

async function fetchActiveBanners(): Promise<BannerRecord[]> {
  const db = getDb();
  if (!db) return [];

  try {
    const snapshot = await db
      .collection("banners")
      .where("active", "==", true)
      .limit(10)
      .get();

    return snapshot.docs
      .map((doc) => toRecord(doc.id, doc.data()))
      .filter((b) => b.title && b.description)
      .sort((a, b) => a.order - b.order);
  } catch (error) {
    console.error("[cms/banners] fetch failed", error);
    return [];
  }
}

const cachedActiveBanners = unstable_cache(fetchActiveBanners, ["cms:banners"], {
  tags: [BANNERS_TAG],
});

/**
 * Expiry is applied *after* the cache, exactly as for notices — caching the
 * comparison would freeze "not expired yet" into the cached value.
 */
export async function getActiveBanners(): Promise<Banner[]> {
  const banners = await cachedActiveBanners();
  const now = Date.now();

  return banners
    .filter((b) => b.expiresAtMs === null || b.expiresAtMs > now)
    .map(
      ({
        id,
        title,
        description,
        primaryLabel,
        primaryHref,
        secondaryLabel,
        secondaryHref,
        deadlineLabel,
        deadlineAtMs,
      }) => ({
        id,
        title,
        description,
        primaryLabel,
        primaryHref,
        secondaryLabel: secondaryLabel || undefined,
        secondaryHref: secondaryHref || undefined,
        deadlineLabel: deadlineLabel || undefined,
        deadlineAtMs: deadlineAtMs ?? undefined,
      }),
    );
}

/* ------------------------------------------------------------------ *
 * Admin reads and writes
 * ------------------------------------------------------------------ */

/** Uncached — the dashboard must always show what is actually stored. */
export async function listAllBanners(): Promise<BannerRecord[] | null> {
  const db = getDb();
  if (!db) return null;

  try {
    const snapshot = await db.collection("banners").limit(100).get();
    return snapshot.docs
      .map((doc) => toRecord(doc.id, doc.data()))
      .sort((a, b) => a.order - b.order || a.title.localeCompare(b.title));
  } catch (error) {
    console.error("[cms/banners] admin list failed", error);
    return null;
  }
}

export async function getBanner(id: string): Promise<BannerRecord | null> {
  const db = getDb();
  if (!db) return null;

  try {
    const snap = await db.collection("banners").doc(id).get();
    return snap.exists ? toRecord(snap.id, snap.data() ?? {}) : null;
  } catch (error) {
    console.error("[cms/banners] get failed", id, error);
    return null;
  }
}

function toDocument(input: BannerInput) {
  return {
    title: input.title,
    description: input.description,
    primaryLabel: input.primaryLabel,
    primaryHref: input.primaryHref,
    secondaryLabel: input.secondaryLabel || null,
    secondaryHref: input.secondaryHref || null,
    deadlineLabel: input.deadlineLabel || null,
    deadlineAt: input.deadlineAt
      ? Timestamp.fromDate(new Date(input.deadlineAt))
      : null,
    active: input.active,
    order: input.order,
    expiresAt: input.expiresAt
      ? Timestamp.fromDate(new Date(input.expiresAt))
      : null,
    updatedAt: FieldValue.serverTimestamp(),
  };
}

export async function createBanner(input: BannerInput): Promise<string | null> {
  const db = getDb();
  if (!db) return null;

  try {
    const doc = await db.collection("banners").add({
      ...toDocument(input),
      createdAt: FieldValue.serverTimestamp(),
    });
    return doc.id;
  } catch (error) {
    console.error("[cms/banners] create failed", error);
    return null;
  }
}

export async function updateBanner(
  id: string,
  input: BannerInput,
): Promise<boolean> {
  const db = getDb();
  if (!db) return false;

  try {
    await db.collection("banners").doc(id).set(toDocument(input), { merge: true });
    return true;
  } catch (error) {
    console.error("[cms/banners] update failed", id, error);
    return false;
  }
}

export async function deleteBanner(id: string): Promise<boolean> {
  const db = getDb();
  if (!db) return false;

  try {
    await db.collection("banners").doc(id).delete();
    return true;
  } catch (error) {
    console.error("[cms/banners] delete failed", id, error);
    return false;
  }
}
