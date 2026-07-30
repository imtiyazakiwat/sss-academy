"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";

import { labsForCourse } from "@/content/labs";
import { writeAudit } from "@/lib/admin/audit";
import { requireAdmin } from "@/lib/admin/auth";
import { COURSES_TAG } from "@/lib/admin/tags";
import {
  courseSchema,
  createCourse,
  deleteCourse,
  getCourseRecord,
  parseTopics,
  seedCourses,
  updateCourse,
} from "@/lib/cms/courses";

/**
 * Course catalogue writes.
 *
 * The one thing here that is not boilerplate is the lab topic guard. Playground
 * labs pin themselves to course topic strings verbatim, and those labs live in
 * code — renaming or deleting a topic in the dashboard silently breaks the lab
 * that references it. So a save that drops a referenced topic is rejected once,
 * with the affected labs named, and only goes through if the admin confirms.
 */

export interface CourseState {
  error?: string;
  success?: string;
  fieldErrors?: Record<string, string>;
  /** Topics being removed that playground labs still reference. */
  topicWarning?: { topic: string; labs: string[] }[];
}

const idSchema = z.string().trim().min(1).max(200).refine(
  (v) => !v.includes("/"),
  "Invalid document ID",
);

function readNumber(value: FormDataEntryValue | null): number | undefined {
  const text = String(value ?? "").trim();
  if (!text) return undefined;
  const parsed = Number.parseInt(text, 10);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function readForm(formData: FormData) {
  return {
    title: formData.get("title"),
    short: formData.get("short") ?? "",
    durationMonths: readNumber(formData.get("durationMonths")),
    track: formData.get("track"),
    level: formData.get("level"),
    summary: formData.get("summary"),
    outcome: formData.get("outcome"),
    topics: parseTopics(String(formData.get("topics") ?? "")),
    featured: formData.get("featured") === "on",
    order: Number.parseInt(String(formData.get("order") ?? "0"), 10) || 0,
    published: formData.get("published") === "on",
  };
}

function toFieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

function published() {
  revalidateTag(COURSES_TAG);
  revalidatePath("/courses");
  revalidatePath("/");
  revalidatePath("/contact");
  revalidatePath("/admin/courses");
  revalidatePath("/admin");
}

/**
 * Labs reference topics as exact strings, so a rename reads as a deletion here.
 * That is the honest interpretation: the lab no longer matches anything.
 */
function brokenLabs(slug: string, before: string[], after: string[]) {
  const kept = new Set(after);
  const removed = before.filter((topic) => !kept.has(topic));
  if (removed.length === 0) return [];

  const labs = labsForCourse(slug);

  return removed
    .map((topic) => ({
      topic,
      labs: labs
        .filter((lab) => lab.topics.includes(topic))
        .map((lab) => lab.title),
    }))
    .filter((entry) => entry.labs.length > 0);
}

export async function saveCourseAction(
  _previous: CourseState,
  formData: FormData,
): Promise<CourseState> {
  const session = await requireAdmin({ checkRevoked: true });

  const rawId = formData.get("id");
  const id = typeof rawId === "string" && rawId
    ? idSchema.safeParse(rawId).success ? rawId.trim() : null
    : null;

  const parsed = courseSchema.safeParse(readForm(formData));
  if (!parsed.success) {
    return {
      error: "Please check the highlighted fields.",
      fieldErrors: toFieldErrors(parsed.error),
    };
  }

  if (id) {
    const before = await getCourseRecord(id);
    if (!before) return { error: "That course no longer exists." };

    const warning = brokenLabs(id, before.topics, parsed.data.topics);
    if (warning.length > 0 && formData.get("confirmTopics") !== "on") {
      return {
        error:
          "Some topics you removed are used by playground labs. Confirm below to save anyway.",
        topicWarning: warning,
      };
    }

    const ok = await updateCourse(id, parsed.data);
    if (!ok) return { error: "Could not save. Please try again." };

    await writeAudit({
      actor: session,
      entity: "courses",
      entityId: id,
      action: "update",
      before,
      after: parsed.data,
    });

    published();
    return { success: "Course saved." };
  }

  const newId = await createCourse(parsed.data);
  if (!newId) return { error: "Could not add the course. Please try again." };

  await writeAudit({
    actor: session,
    entity: "courses",
    entityId: newId,
    action: "create",
    after: parsed.data,
  });

  published();
  return {
    success: parsed.data.published
      ? `${parsed.data.title} is live at /courses/${newId} now.`
      : `${parsed.data.title} saved as hidden. Tick “Show on the site” to publish.`,
  };
}

export async function toggleCourseAction(formData: FormData): Promise<void> {
  const session = await requireAdmin({ checkRevoked: true });

  const parsed = idSchema.safeParse(formData.get("id"));
  if (!parsed.success) return;

  const before = await getCourseRecord(parsed.data);
  if (!before) return;

  const field = formData.get("field") === "featured" ? "featured" : "published";
  const next = !before[field];

  const ok = await updateCourse(parsed.data, {
    title: before.title,
    short: before.short,
    durationMonths: before.durationMonths,
    track: before.track,
    level: before.level,
    summary: before.summary,
    outcome: before.outcome,
    topics: before.topics,
    featured: field === "featured" ? next : before.featured,
    order: before.order,
    published: field === "published" ? next : before.published,
  });

  if (!ok) return;

  await writeAudit({
    actor: session,
    entity: "courses",
    entityId: parsed.data,
    action: "update",
    before: { [field]: before[field] },
    after: { [field]: next },
  });

  published();
}

export async function deleteCourseAction(formData: FormData): Promise<void> {
  const session = await requireAdmin({ checkRevoked: true });

  const parsed = idSchema.safeParse(formData.get("id"));
  if (!parsed.success) return;

  const before = await getCourseRecord(parsed.data);
  const ok = await deleteCourse(parsed.data);
  if (!ok) return;

  await writeAudit({
    actor: session,
    entity: "courses",
    entityId: parsed.data,
    action: "delete",
    before,
  });

  published();
}

/**
 * Copies the catalogue currently hardcoded in `content/courses.ts` into
 * Firestore. One-way and a no-op once the collection has anything in it.
 */
export async function seedCoursesAction(): Promise<void> {
  const session = await requireAdmin({ checkRevoked: true });

  const count = await seedCourses();
  if (count === null || count === 0) return;

  await writeAudit({
    actor: session,
    entity: "courses",
    entityId: "*",
    action: "create",
    after: { imported: count },
  });

  published();
}
