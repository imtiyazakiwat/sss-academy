import "server-only";

import { FieldValue } from "firebase-admin/firestore";
import { unstable_cache } from "next/cache";
import { z } from "zod";

import {
  placements as staticPlacements,
  type Placement,
} from "@/content/placements";
import { PLACEMENTS_TAG } from "@/lib/admin/tags";
import { getDb } from "@/lib/firebase";

/**
 * Placements — learner stories, editable from the dashboard.
 *
 * Unlike notices, this collection keeps the static array in
 * `src/content/placements.ts` as a fallback. Two reasons: the site renders
 * exactly as it does today with no Firebase config at all, and an empty
 * collection means "nobody has imported yet", not "we have no learners". The
 * fallback only disappears once there is at least one published record in
 * Firestore.
 *
 * Reads go through a tagged cache — one Firestore read per edit rather than one
 * per pageview — so every write path must call `revalidateTag(PLACEMENTS_TAG)`.
 */

export interface PlacementRecord extends Placement {
  /** Lowest first, within the admin list and the public page. */
  order: number;
  published: boolean;
  /** Millis, not a Timestamp — cached values must be plain JSON. */
  updatedAtMs: number | null;
}

const COLLECTION = "placements";

export const placementSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Enter the learner's name")
    .max(80, "That name is too long"),
  role: z
    .string()
    .trim()
    .min(2, "Enter the role they were hired for")
    .max(80, "Keep the role short"),
  packageLpa: z
    .number({ message: "Enter the package in lakhs, e.g. 13.5" })
    .min(0, "A package cannot be negative")
    .max(200, "That looks like a typo — the value is in lakhs per annum"),
  company: z
    .string()
    .trim()
    .max(80, "Keep the company name short")
    .optional()
    .default(""),
  location: z
    .string()
    .trim()
    .max(80, "Keep the city short")
    .optional()
    .default(""),
  quote: z
    .string()
    .trim()
    .min(20, "Add the learner's own words")
    .max(1200, "Keep the story under 1200 characters")
    .optional()
    .default(""),
  order: z.number().int().min(0).max(999).optional().default(0),
  published: z.boolean().optional().default(false),
});

export type PlacementInput = z.output<typeof placementSchema>;

/**
 * Doc IDs mirror the slugs already used by the static content, so records
 * imported from `content/placements.ts` keep their identity.
 */
export function toSlug(name: string): string {
  return (
    name
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "learner"
  );
}

function toRecord(id: string, data: Record<string, unknown>): PlacementRecord {
  const updatedAt = data.updatedAt as { toMillis?: () => number } | undefined;
  const location = data.location;
  return {
    slug: id,
    name: String(data.name ?? ""),
    role: typeof data.role === "string" ? data.role : "",
    packageLpa: typeof data.packageLpa === "number" ? data.packageLpa : 0,
    company: typeof data.company === "string" && data.company ? data.company : "MNC",
    location: typeof location === "string" && location ? location : null,
    quote: typeof data.quote === "string" ? data.quote : "",
    order: typeof data.order === "number" ? data.order : 0,
    published: data.published === true,
    updatedAtMs: updatedAt?.toMillis?.() ?? null,
  };
}

function toDocument(input: PlacementInput) {
  return {
    name: input.name,
    role: input.role,
    packageLpa: input.packageLpa,
    company: input.company || "MNC",
    location: input.location || null,
    quote: input.quote,
    order: input.order,
    published: input.published,
    updatedAt: FieldValue.serverTimestamp(),
  };
}

/* ------------------------------------------------------------------ *
 * Public read
 * ------------------------------------------------------------------ */

async function fetchPublishedPlacements(): Promise<PlacementRecord[]> {
  const db = getDb();
  if (!db) return [];

  try {
    const snapshot = await db
      .collection(COLLECTION)
      .where("published", "==", true)
      .limit(200)
      .get();

    return snapshot.docs
      .map((doc) => toRecord(doc.id, doc.data()))
      .filter((p) => p.name && p.quote);
  } catch (error) {
    console.error("[cms/placements] fetch failed", error);
    return [];
  }
}

const cachedPublishedPlacements = unstable_cache(
  fetchPublishedPlacements,
  ["cms:placements"],
  { tags: [PLACEMENTS_TAG] },
);

export interface PlacementsData {
  placements: Placement[];
  /** Sorted high-to-low — used where the package is the headline. */
  byPackage: Placement[];
  highestPackage: number;
  averagePackage: number;
  uniqueRoles: string[];
  /** Which side of the fallback the caller is looking at. */
  source: "firestore" | "static";
}

/**
 * The aggregates travel with the list rather than living as module constants,
 * because the list is now a runtime value. Ordering is applied here, not in the
 * Firestore query, so a missing `order` field can never drop a record.
 */
function derive(
  placements: Placement[],
  source: PlacementsData["source"],
): PlacementsData {
  const byPackage = [...placements].sort((a, b) => b.packageLpa - a.packageLpa);
  const total = placements.reduce((sum, p) => sum + p.packageLpa, 0);

  return {
    placements,
    byPackage,
    highestPackage: byPackage[0]?.packageLpa ?? 0,
    averagePackage: placements.length
      ? Math.round((total / placements.length) * 10) / 10
      : 0,
    uniqueRoles: Array.from(new Set(placements.map((p) => p.role))),
    source,
  };
}

export async function getPlacements(): Promise<PlacementsData> {
  const records = await cachedPublishedPlacements();

  if (records.length === 0) return derive(staticPlacements, "static");

  const ordered = [...records].sort(
    (a, b) => a.order - b.order || b.packageLpa - a.packageLpa,
  );

  return derive(
    ordered.map(({ slug, name, packageLpa, company, location, role, quote }) => ({
      slug,
      name,
      packageLpa,
      company,
      location,
      role,
      quote,
    })),
    "firestore",
  );
}

/* ------------------------------------------------------------------ *
 * Admin reads and writes
 * ------------------------------------------------------------------ */

/** Uncached — the dashboard must always show what is actually stored. */
export async function listAllPlacements(): Promise<PlacementRecord[] | null> {
  const db = getDb();
  if (!db) return null;

  try {
    const snapshot = await db.collection(COLLECTION).limit(300).get();
    return snapshot.docs
      .map((doc) => toRecord(doc.id, doc.data()))
      .sort(
        (a, b) =>
          a.order - b.order ||
          b.packageLpa - a.packageLpa ||
          a.name.localeCompare(b.name),
      );
  } catch (error) {
    console.error("[cms/placements] admin list failed", error);
    return null;
  }
}

export async function getPlacement(
  slug: string,
): Promise<PlacementRecord | null> {
  const db = getDb();
  if (!db) return null;

  try {
    const snap = await db.collection(COLLECTION).doc(slug).get();
    return snap.exists ? toRecord(snap.id, snap.data() ?? {}) : null;
  } catch (error) {
    console.error("[cms/placements] get failed", slug, error);
    return null;
  }
}

/**
 * Two learners can share a name, and the name is the only thing we can build a
 * slug from, so collisions get a numeric suffix rather than silently
 * overwriting an existing story.
 */
async function availableSlug(db: NonNullable<ReturnType<typeof getDb>>, base: string) {
  for (let attempt = 0; attempt < 25; attempt += 1) {
    const candidate = attempt === 0 ? base : `${base}-${attempt + 1}`;
    const snap = await db.collection(COLLECTION).doc(candidate).get();
    if (!snap.exists) return candidate;
  }
  return `${base}-${Date.now()}`;
}

export async function createPlacement(
  input: PlacementInput,
): Promise<string | null> {
  const db = getDb();
  if (!db) return null;

  try {
    const slug = await availableSlug(db, toSlug(input.name));
    await db
      .collection(COLLECTION)
      .doc(slug)
      .set({ ...toDocument(input), createdAt: FieldValue.serverTimestamp() });
    return slug;
  } catch (error) {
    console.error("[cms/placements] create failed", error);
    return null;
  }
}

export async function updatePlacement(
  slug: string,
  input: PlacementInput,
): Promise<boolean> {
  const db = getDb();
  if (!db) return false;

  try {
    await db
      .collection(COLLECTION)
      .doc(slug)
      .set(toDocument(input), { merge: true });
    return true;
  } catch (error) {
    console.error("[cms/placements] update failed", slug, error);
    return false;
  }
}

export async function deletePlacement(slug: string): Promise<boolean> {
  const db = getDb();
  if (!db) return false;

  try {
    await db.collection(COLLECTION).doc(slug).delete();
    return true;
  } catch (error) {
    console.error("[cms/placements] delete failed", slug, error);
    return false;
  }
}

/**
 * One-time import of the static stories so there is something to edit. Refuses
 * to run when the collection already holds records — re-running it would
 * silently revert every edit made since the first import.
 */
export async function seedPlacements(): Promise<number | null> {
  const db = getDb();
  if (!db) return null;

  try {
    const existing = await db.collection(COLLECTION).limit(1).get();
    if (!existing.empty) return 0;

    const batch = db.batch();
    staticPlacements.forEach((placement, index) => {
      batch.set(db.collection(COLLECTION).doc(placement.slug), {
        name: placement.name,
        role: placement.role,
        packageLpa: placement.packageLpa,
        company: placement.company,
        location: placement.location,
        quote: placement.quote,
        order: index,
        published: true,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
    });

    await batch.commit();
    return staticPlacements.length;
  } catch (error) {
    console.error("[cms/placements] seed failed", error);
    return null;
  }
}
