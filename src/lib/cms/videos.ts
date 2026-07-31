import "server-only";

import { FieldValue } from "firebase-admin/firestore";
import { unstable_cache } from "next/cache";
import { z } from "zod";

import { VIDEOS_TAG } from "@/lib/admin/tags";
import { getDb } from "@/lib/firebase";

/**
 * YouTube demo videos — the "Watch Our Demo Classes" section on the homepage.
 *
 * Staff paste a YouTube URL from the admin panel, along with a title and
 * optional description. The public loader returns the active videos sorted by
 * order, and the homepage embeds them as iframes.
 */

export interface Video {
  id: string;
  title: string;
  description: string;
  youtubeUrl: string;
  /** Extracted YouTube video ID for embedding. */
  youtubeId: string;
}

export interface VideoRecord {
  id: string;
  title: string;
  description: string;
  youtubeUrl: string;
  youtubeId: string;
  active: boolean;
  order: number;
  updatedAtMs: number | null;
}

const COLLECTION = "videos";

/**
 * Accepts full YouTube URLs (watch, short, embed) and extracts the video ID.
 */
export function extractYoutubeId(url: string): string | null {
  const trimmed = url.trim();
  // https://www.youtube.com/watch?v=VIDEO_ID
  // https://youtu.be/VIDEO_ID
  // https://www.youtube.com/embed/VIDEO_ID
  // https://www.youtube.com/shorts/VIDEO_ID
  const patterns = [
    /(?:youtube\.com\/watch\?.*v=)([a-zA-Z0-9_-]{11})/,
    /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
  ];

  for (const pattern of patterns) {
    const match = trimmed.match(pattern);
    if (match?.[1]) return match[1];
  }
  return null;
}

export const videoSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, "Enter a video title")
    .max(120, "Keep the title under 120 characters"),
  description: z
    .string()
    .trim()
    .max(240, "Keep the description under 240 characters")
    .optional()
    .default(""),
  youtubeUrl: z
    .string()
    .trim()
    .min(1, "Paste a YouTube URL")
    .max(500, "That URL is too long")
    .refine(
      (v) => extractYoutubeId(v) !== null,
      "Not a valid YouTube URL. Paste a link like https://www.youtube.com/watch?v=...",
    ),
  active: z.boolean().optional().default(true),
  order: z.number().int().min(0).max(999).optional().default(0),
});

export type VideoInput = z.output<typeof videoSchema>;

function toRecord(id: string, data: Record<string, unknown>): VideoRecord {
  const updatedAt = data.updatedAt as { toMillis?: () => number } | undefined;
  const url = typeof data.youtubeUrl === "string" ? data.youtubeUrl : "";
  return {
    id,
    title: String(data.title ?? ""),
    description: typeof data.description === "string" ? data.description : "",
    youtubeUrl: url,
    youtubeId: typeof data.youtubeId === "string" ? data.youtubeId : (extractYoutubeId(url) ?? ""),
    active: data.active === true,
    order: typeof data.order === "number" ? data.order : 0,
    updatedAtMs: updatedAt?.toMillis?.() ?? null,
  };
}

/* ------------------------------------------------------------------ *
 * Public read
 * ------------------------------------------------------------------ */

async function fetchActiveVideos(): Promise<VideoRecord[]> {
  const db = getDb();
  if (!db) return [];

  try {
    const snapshot = await db
      .collection(COLLECTION)
      .where("active", "==", true)
      .limit(20)
      .get();

    return snapshot.docs
      .map((doc) => toRecord(doc.id, doc.data()))
      .filter((v) => v.title && v.youtubeId)
      .sort((a, b) => a.order - b.order);
  } catch (error) {
    console.error("[cms/videos] fetch failed", error);
    return [];
  }
}

const cachedActiveVideos = unstable_cache(fetchActiveVideos, ["cms:videos"], {
  tags: [VIDEOS_TAG],
});

export async function getActiveVideos(): Promise<Video[]> {
  const records = await cachedActiveVideos();
  return records.map(({ id, title, description, youtubeUrl, youtubeId }) => ({
    id,
    title,
    description,
    youtubeUrl,
    youtubeId,
  }));
}

/* ------------------------------------------------------------------ *
 * Admin reads and writes
 * ------------------------------------------------------------------ */

export async function listAllVideos(): Promise<VideoRecord[] | null> {
  const db = getDb();
  if (!db) return null;

  try {
    const snapshot = await db.collection(COLLECTION).limit(100).get();
    return snapshot.docs
      .map((doc) => toRecord(doc.id, doc.data()))
      .sort((a, b) => a.order - b.order || a.title.localeCompare(b.title));
  } catch (error) {
    console.error("[cms/videos] admin list failed", error);
    return null;
  }
}

export async function getVideo(id: string): Promise<VideoRecord | null> {
  const db = getDb();
  if (!db) return null;

  try {
    const snap = await db.collection(COLLECTION).doc(id).get();
    return snap.exists ? toRecord(snap.id, snap.data() ?? {}) : null;
  } catch (error) {
    console.error("[cms/videos] get failed", id, error);
    return null;
  }
}

function toDocument(input: VideoInput) {
  const youtubeId = extractYoutubeId(input.youtubeUrl) ?? "";
  return {
    title: input.title,
    description: input.description || "",
    youtubeUrl: input.youtubeUrl,
    youtubeId,
    active: input.active,
    order: input.order,
    updatedAt: FieldValue.serverTimestamp(),
  };
}

export async function createVideo(input: VideoInput): Promise<string | null> {
  const db = getDb();
  if (!db) return null;

  try {
    const doc = await db.collection(COLLECTION).add({
      ...toDocument(input),
      createdAt: FieldValue.serverTimestamp(),
    });
    return doc.id;
  } catch (error) {
    console.error("[cms/videos] create failed", error);
    return null;
  }
}

export async function updateVideo(
  id: string,
  input: VideoInput,
): Promise<boolean> {
  const db = getDb();
  if (!db) return false;

  try {
    await db.collection(COLLECTION).doc(id).set(toDocument(input), { merge: true });
    return true;
  } catch (error) {
    console.error("[cms/videos] update failed", id, error);
    return false;
  }
}

export async function deleteVideo(id: string): Promise<boolean> {
  const db = getDb();
  if (!db) return false;

  try {
    await db.collection(COLLECTION).doc(id).delete();
    return true;
  } catch (error) {
    console.error("[cms/videos] delete failed", id, error);
    return false;
  }
}
