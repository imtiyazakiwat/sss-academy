import "server-only";

import { FieldValue } from "firebase-admin/firestore";
import { unstable_cache } from "next/cache";
import { z } from "zod";

import { founder as staticFounder } from "@/content/about";
import { TEAM_TAG } from "@/lib/admin/tags";
import { getDb } from "@/lib/firebase";

/**
 * Team / staff — the people behind the institute, editable from the dashboard.
 *
 * The existing `founder` constant in `content/about.ts` is a single record; this
 * module generalises it into a collection. The first `isFounder` record renders
 * through `FounderBlock.tsx` on the homepage and about page. The rest appear in
 * a team grid on the about page.
 *
 * Static fallback: until someone imports, `getTeam()` returns the existing
 * founder constant as the only member.
 */

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  /** Path to the photo — no upload; the admin pastes a public path. */
  photo: string;
  bio: string;
  tags: string[];
  expertise: string[];
  order: number;
  isFounder: boolean;
  published: boolean;
  /** Millis — cached values must be plain JSON. */
  updatedAtMs: number | null;
}

const COLLECTION = "team";

/** Tags and expertise arrive from a textarea, one per line. */
export function parseList(raw: string): string[] {
  return raw
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 20);
}

export const teamSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Enter the person's name")
    .max(80, "That name is too long"),
  role: z
    .string()
    .trim()
    .min(2, "Enter their role or designation")
    .max(100, "Keep the role under 100 characters"),
  photo: z
    .string()
    .trim()
    .max(300, "Too long")
    .refine(
      (v) => v === "" || v.startsWith("/") || /^https?:\/\//.test(v),
      "Use a path like /img/name.webp or a full https:// URL",
    )
    .optional()
    .default(""),
  bio: z
    .string()
    .trim()
    .max(1200, "Keep the bio under 1200 characters")
    .optional()
    .default(""),
  tags: z
    .array(z.string().trim().min(1).max(60))
    .max(10, "Ten tags is the limit")
    .optional()
    .default([]),
  expertise: z
    .array(z.string().trim().min(1).max(80))
    .max(20, "Twenty skills is the limit")
    .optional()
    .default([]),
  order: z.number().int().min(0).max(999).optional().default(0),
  isFounder: z.boolean().optional().default(false),
  published: z.boolean().optional().default(false),
});

export type TeamInput = z.output<typeof teamSchema>;

function toRecord(id: string, data: Record<string, unknown>): TeamMember {
  const updatedAt = data.updatedAt as { toMillis?: () => number } | undefined;
  return {
    id,
    name: String(data.name ?? ""),
    role: typeof data.role === "string" ? data.role : "",
    photo: typeof data.photo === "string" ? data.photo : "",
    bio: typeof data.bio === "string" ? data.bio : "",
    tags: Array.isArray(data.tags)
      ? data.tags.filter((t): t is string => typeof t === "string")
      : [],
    expertise: Array.isArray(data.expertise)
      ? data.expertise.filter((e): e is string => typeof e === "string")
      : [],
    order: typeof data.order === "number" ? data.order : 0,
    isFounder: data.isFounder === true,
    published: data.published === true,
    updatedAtMs: updatedAt?.toMillis?.() ?? null,
  };
}

function toDocument(input: TeamInput) {
  return {
    name: input.name,
    role: input.role,
    photo: input.photo || null,
    bio: input.bio,
    tags: input.tags,
    expertise: input.expertise,
    order: input.order,
    isFounder: input.isFounder,
    published: input.published,
    updatedAt: FieldValue.serverTimestamp(),
  };
}

/* ------------------------------------------------------------------ *
 * Public read
 * ------------------------------------------------------------------ */

async function fetchPublishedTeam(): Promise<TeamMember[]> {
  const db = getDb();
  if (!db) return [];

  try {
    const snapshot = await db
      .collection(COLLECTION)
      .where("published", "==", true)
      .limit(50)
      .get();

    return snapshot.docs
      .map((doc) => toRecord(doc.id, doc.data()))
      .filter((m) => m.name);
  } catch (error) {
    console.error("[cms/team] fetch failed", error);
    return [];
  }
}

const cachedPublishedTeam = unstable_cache(
  fetchPublishedTeam,
  ["cms:team"],
  { tags: [TEAM_TAG] },
);

export interface TeamData {
  members: TeamMember[];
  founder: TeamMember | null;
  staff: TeamMember[];
  source: "firestore" | "static";
}

/**
 * Static fallback builds a single member from the coded `founder` constant.
 * That way `FounderBlock.tsx` renders identically with no Firestore at all.
 */
function staticFallback(): TeamData {
  const member: TeamMember = {
    id: "founder",
    name: staticFounder.name,
    role: staticFounder.role,
    photo: staticFounder.photo,
    bio: staticFounder.bio,
    tags: [...staticFounder.tags],
    expertise: [...staticFounder.expertise],
    order: 0,
    isFounder: true,
    published: true,
    updatedAtMs: null,
  };
  return {
    members: [member],
    founder: member,
    staff: [],
    source: "static",
  };
}

export async function getTeam(): Promise<TeamData> {
  const records = await cachedPublishedTeam();

  if (records.length === 0) return staticFallback();

  const ordered = [...records].sort((a, b) => a.order - b.order);
  const founder = ordered.find((m) => m.isFounder) ?? ordered[0] ?? null;
  const staff = ordered.filter((m) => m.id !== founder?.id);

  return { members: ordered, founder, staff, source: "firestore" };
}

/* ------------------------------------------------------------------ *
 * Admin reads and writes
 * ------------------------------------------------------------------ */

export async function listAllTeam(): Promise<TeamMember[] | null> {
  const db = getDb();
  if (!db) return null;

  try {
    const snapshot = await db.collection(COLLECTION).limit(100).get();
    return snapshot.docs
      .map((doc) => toRecord(doc.id, doc.data()))
      .sort((a, b) => a.order - b.order || a.name.localeCompare(b.name));
  } catch (error) {
    console.error("[cms/team] admin list failed", error);
    return null;
  }
}

export async function getTeamMember(id: string): Promise<TeamMember | null> {
  const db = getDb();
  if (!db) return null;

  try {
    const snap = await db.collection(COLLECTION).doc(id).get();
    return snap.exists ? toRecord(snap.id, snap.data() ?? {}) : null;
  } catch (error) {
    console.error("[cms/team] get failed", id, error);
    return null;
  }
}

function toId(name: string): string {
  return (
    name
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "member"
  );
}

async function availableId(
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

export async function createTeamMember(
  input: TeamInput,
): Promise<string | null> {
  const db = getDb();
  if (!db) return null;

  try {
    const id = await availableId(db, toId(input.name));
    await db
      .collection(COLLECTION)
      .doc(id)
      .set({ ...toDocument(input), createdAt: FieldValue.serverTimestamp() });
    return id;
  } catch (error) {
    console.error("[cms/team] create failed", error);
    return null;
  }
}

export async function updateTeamMember(
  id: string,
  input: TeamInput,
): Promise<boolean> {
  const db = getDb();
  if (!db) return false;

  try {
    await db
      .collection(COLLECTION)
      .doc(id)
      .set(toDocument(input), { merge: true });
    return true;
  } catch (error) {
    console.error("[cms/team] update failed", id, error);
    return false;
  }
}

export async function deleteTeamMember(id: string): Promise<boolean> {
  const db = getDb();
  if (!db) return false;

  try {
    await db.collection(COLLECTION).doc(id).delete();
    return true;
  } catch (error) {
    console.error("[cms/team] delete failed", id, error);
    return false;
  }
}

/**
 * Imports the single founder from `content/about.ts` as the first record.
 * No-op once the collection holds anything.
 */
export async function seedTeam(): Promise<number | null> {
  const db = getDb();
  if (!db) return null;

  try {
    const existing = await db.collection(COLLECTION).limit(1).get();
    if (!existing.empty) return 0;

    await db.collection(COLLECTION).doc("founder").set({
      name: staticFounder.name,
      role: staticFounder.role,
      photo: staticFounder.photo,
      bio: staticFounder.bio,
      tags: [...staticFounder.tags],
      expertise: [...staticFounder.expertise],
      order: 0,
      isFounder: true,
      published: true,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    return 1;
  } catch (error) {
    console.error("[cms/team] seed failed", error);
    return null;
  }
}
