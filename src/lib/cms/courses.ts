import "server-only";

import { FieldValue } from "firebase-admin/firestore";
import { unstable_cache } from "next/cache";
import { z } from "zod";

import {
  courses as staticCourses,
  type Course,
  type CourseTrack,
} from "@/content/courses";
import { COURSES_TAG } from "@/lib/admin/tags";
import { getDb } from "@/lib/firebase";

/**
 * Course catalogue — the syllabus, editable from the dashboard.
 *
 * Same shape as placements: a tagged cache in front of Firestore, with the
 * static array in `src/content/courses.ts` as the fallback until somebody
 * imports it. That fallback is what makes this safe to deploy — with no
 * Firebase config the site renders exactly as it did before.
 *
 * Note what does *not* move: `trackLabels` and `durationLabel()` are pure
 * helpers with no data dependency, so client components keep importing them
 * from `@/content/courses`. The playground also stays on the static catalogue,
 * because labs live in code and are pinned to course topics by
 * `assertLabTopics()`.
 */

export interface CourseRecord extends Course {
  /** Lowest first, across the catalogue and the nav. */
  order: number;
  published: boolean;
  /** Millis, not a Timestamp — cached values must be plain JSON. */
  updatedAtMs: number | null;
}

const COLLECTION = "courses";

export const TRACKS: CourseTrack[] = [
  "data",
  "testing",
  "cloud",
  "programming",
  "bi",
];

export const LEVELS: Course["level"][] = [
  "Beginner",
  "Beginner to Advanced",
  "Intermediate",
];

/** Topics arrive from a textarea, one per line — order is the display order. */
export function parseTopics(raw: string): string[] {
  return raw
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 30);
}

export const courseSchema = z.object({
  title: z
    .string()
    .trim()
    .min(2, "Enter the course title")
    .max(80, "That title is too long"),
  short: z
    .string()
    .trim()
    .max(24, "Keep the short label under 24 characters")
    .optional()
    .default(""),
  durationMonths: z
    .number({ message: "Enter the duration in months" })
    .int("Whole months only")
    .min(1, "At least one month")
    .max(24, "That looks like a typo"),
  track: z.enum(["data", "testing", "cloud", "programming", "bi"], {
    message: "Pick a track",
  }),
  level: z.enum(["Beginner", "Beginner to Advanced", "Intermediate"], {
    message: "Pick a level",
  }),
  summary: z
    .string()
    .trim()
    .min(20, "Write the syllabus summary")
    .max(600, "Keep the summary under 600 characters"),
  outcome: z
    .string()
    .trim()
    .min(10, "One line on what the learner walks away with")
    .max(200, "Keep the outcome to one line"),
  topics: z
    .array(z.string().trim().min(2).max(160))
    .min(1, "Add at least one topic")
    .max(30, "Thirty topics is the limit"),
  featured: z.boolean().optional().default(false),
  order: z.number().int().min(0).max(999).optional().default(0),
  published: z.boolean().optional().default(false),
});

export type CourseInput = z.output<typeof courseSchema>;

export function toSlug(title: string): string {
  return (
    title
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "course"
  );
}

function toRecord(id: string, data: Record<string, unknown>): CourseRecord {
  const updatedAt = data.updatedAt as { toMillis?: () => number } | undefined;
  const track = data.track as CourseTrack;
  const level = data.level as Course["level"];
  const title = String(data.title ?? "");

  return {
    slug: id,
    title,
    short: typeof data.short === "string" && data.short ? data.short : title,
    durationMonths:
      typeof data.durationMonths === "number" ? data.durationMonths : 1,
    track: TRACKS.includes(track) ? track : "data",
    level: LEVELS.includes(level) ? level : "Beginner to Advanced",
    summary: typeof data.summary === "string" ? data.summary : "",
    outcome: typeof data.outcome === "string" ? data.outcome : "",
    topics: Array.isArray(data.topics)
      ? data.topics.filter((t): t is string => typeof t === "string")
      : [],
    featured: data.featured === true,
    order: typeof data.order === "number" ? data.order : 0,
    published: data.published === true,
    updatedAtMs: updatedAt?.toMillis?.() ?? null,
  };
}

function toDocument(input: CourseInput) {
  return {
    title: input.title,
    short: input.short || input.title,
    durationMonths: input.durationMonths,
    track: input.track,
    level: input.level,
    summary: input.summary,
    outcome: input.outcome,
    topics: input.topics,
    featured: input.featured,
    order: input.order,
    published: input.published,
    updatedAt: FieldValue.serverTimestamp(),
  };
}

/* ------------------------------------------------------------------ *
 * Public read
 * ------------------------------------------------------------------ */

async function fetchPublishedCourses(): Promise<CourseRecord[]> {
  const db = getDb();
  if (!db) return [];

  try {
    const snapshot = await db
      .collection(COLLECTION)
      .where("published", "==", true)
      .limit(100)
      .get();

    return snapshot.docs
      .map((doc) => toRecord(doc.id, doc.data()))
      .filter((c) => c.title && c.summary);
  } catch (error) {
    console.error("[cms/courses] fetch failed", error);
    return [];
  }
}

const cachedPublishedCourses = unstable_cache(
  fetchPublishedCourses,
  ["cms:courses"],
  { tags: [COURSES_TAG] },
);

export interface CoursesData {
  courses: Course[];
  featured: Course[];
  /** Which side of the fallback the caller is looking at. */
  source: "firestore" | "static";
}

function strip(record: CourseRecord): Course {
  const {
    slug,
    title,
    short,
    durationMonths,
    track,
    level,
    summary,
    outcome,
    topics,
    featured,
  } = record;
  return {
    slug,
    title,
    short,
    durationMonths,
    track,
    level,
    summary,
    outcome,
    topics,
    featured,
  };
}

export async function getCourses(): Promise<CoursesData> {
  const records = await cachedPublishedCourses();

  if (records.length === 0) {
    return {
      courses: staticCourses,
      featured: staticCourses.filter((c) => c.featured),
      source: "static",
    };
  }

  const courses = [...records]
    .sort((a, b) => a.order - b.order || a.title.localeCompare(b.title))
    .map(strip);

  return {
    courses,
    featured: courses.filter((c) => c.featured),
    source: "firestore",
  };
}

/* ------------------------------------------------------------------ *
 * Derived values — functions over a loaded list, not module constants
 * ------------------------------------------------------------------ */

export function findCourse(
  courses: Course[],
  slug: string,
): Course | undefined {
  return courses.find((c) => c.slug === slug);
}

/** Same-track first, then anything else, so the rail is never empty. */
export function relatedFrom(
  courses: Course[],
  slug: string,
  limit = 3,
): Course[] {
  const current = findCourse(courses, slug);
  if (!current) return courses.slice(0, limit);

  const sameTrack = courses.filter(
    (c) => c.slug !== slug && c.track === current.track,
  );
  const rest = courses.filter(
    (c) => c.slug !== slug && c.track !== current.track,
  );
  return [...sameTrack, ...rest].slice(0, limit);
}

/* ------------------------------------------------------------------ *
 * Admin reads and writes
 * ------------------------------------------------------------------ */

/** Uncached — the dashboard must always show what is actually stored. */
export async function listAllCourses(): Promise<CourseRecord[] | null> {
  const db = getDb();
  if (!db) return null;

  try {
    const snapshot = await db.collection(COLLECTION).limit(200).get();
    return snapshot.docs
      .map((doc) => toRecord(doc.id, doc.data()))
      .sort((a, b) => a.order - b.order || a.title.localeCompare(b.title));
  } catch (error) {
    console.error("[cms/courses] admin list failed", error);
    return null;
  }
}

export async function getCourseRecord(
  slug: string,
): Promise<CourseRecord | null> {
  const db = getDb();
  if (!db) return null;

  try {
    const snap = await db.collection(COLLECTION).doc(slug).get();
    return snap.exists ? toRecord(snap.id, snap.data() ?? {}) : null;
  } catch (error) {
    console.error("[cms/courses] get failed", slug, error);
    return null;
  }
}

async function availableSlug(
  db: NonNullable<ReturnType<typeof getDb>>,
  base: string,
) {
  for (let attempt = 0; attempt < 25; attempt += 1) {
    const candidate = attempt === 0 ? base : `${base}-${attempt + 1}`;
    const snap = await db.collection(COLLECTION).doc(candidate).get();
    if (!snap.exists) return candidate;
  }
  return `${base}-${Date.now()}`;
}

export async function createCourse(
  input: CourseInput,
): Promise<string | null> {
  const db = getDb();
  if (!db) return null;

  try {
    const slug = await availableSlug(db, toSlug(input.title));
    await db
      .collection(COLLECTION)
      .doc(slug)
      .set({ ...toDocument(input), createdAt: FieldValue.serverTimestamp() });
    return slug;
  } catch (error) {
    console.error("[cms/courses] create failed", error);
    return null;
  }
}

export async function updateCourse(
  slug: string,
  input: CourseInput,
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
    console.error("[cms/courses] update failed", slug, error);
    return false;
  }
}

export async function deleteCourse(slug: string): Promise<boolean> {
  const db = getDb();
  if (!db) return false;

  try {
    await db.collection(COLLECTION).doc(slug).delete();
    return true;
  } catch (error) {
    console.error("[cms/courses] delete failed", slug, error);
    return false;
  }
}

/**
 * One-time import of the coded catalogue. Refuses to run once the collection
 * holds anything — re-running would revert every edit since the first import.
 */
export async function seedCourses(): Promise<number | null> {
  const db = getDb();
  if (!db) return null;

  try {
    const existing = await db.collection(COLLECTION).limit(1).get();
    if (!existing.empty) return 0;

    const batch = db.batch();
    staticCourses.forEach((course, index) => {
      batch.set(db.collection(COLLECTION).doc(course.slug), {
        title: course.title,
        short: course.short,
        durationMonths: course.durationMonths,
        track: course.track,
        level: course.level,
        summary: course.summary,
        outcome: course.outcome,
        topics: course.topics,
        featured: course.featured,
        order: index,
        published: true,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
    });

    await batch.commit();
    return staticCourses.length;
  } catch (error) {
    console.error("[cms/courses] seed failed", error);
    return null;
  }
}
