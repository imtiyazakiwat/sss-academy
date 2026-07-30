import "server-only";

import { FieldValue } from "firebase-admin/firestore";
import { cache } from "react";

import {
  ENQUIRY_STATUSES,
  REPLY_CHANNELS,
  type DeliveryStatus,
  type EnquiryStatus,
  type ReplyChannel,
  type ReplyInput,
} from "@/lib/cms/enquiry-schema";
import { getDb } from "@/lib/firebase";

/**
 * Enquiry inbox data layer.
 *
 * Deliberately **not** wrapped in `unstable_cache`. Everything else in the CMS
 * is content that changes rarely and is read constantly; this is the opposite —
 * a work queue two people share. A stale inbox means two staff replying to the
 * same person, so every read hits Firestore.
 *
 * Filtering and search happen in memory over a bounded window of the most
 * recent enquiries rather than in the query. That is a deliberate trade:
 *
 * - Firestore cannot do substring search at all, so `search` had to be
 *   in-memory regardless.
 * - `where(status) + orderBy(createdAt)` needs a composite index, which is one
 *   more thing to provision by hand before the dashboard works.
 *
 * One `orderBy("createdAt")` query serves the list, the status counts and the
 * search from a single read set. The cost is that enquiries older than
 * `WINDOW` fall out of view — see `windowCapped` on the result, which the list
 * page surfaces.
 */

export {
  CHANNEL_LABELS,
  ENQUIRY_STATUSES,
  REPLY_CHANNELS,
  STATUS_LABELS,
  channelSchema,
  replySchema,
  statusSchema,
} from "@/lib/cms/enquiry-schema";
export type {
  DeliveryStatus,
  EnquiryStatus,
  ReplyChannel,
  ReplyInput,
} from "@/lib/cms/enquiry-schema";

export interface EnquiryRecord {
  id: string;
  name: string;
  phone: string;
  email: string;
  course: string;
  message: string;
  source: string;
  status: EnquiryStatus;
  assignedTo: string | null;
  userAgent: string | null;
  createdAtMs: number | null;
  updatedAtMs: number | null;
}

export interface EnquiryReply {
  id: string;
  body: string;
  channel: ReplyChannel;
  authorUid: string;
  authorName: string;
  createdAtMs: number | null;
  deliveryStatus: DeliveryStatus;
}

export type StatusCounts = Record<EnquiryStatus | "all", number>;

export interface EnquiryPage {
  items: EnquiryRecord[];
  counts: StatusCounts;
  total: number;
  page: number;
  pageCount: number;
  pageSize: number;
  /** True when the window filled up, meaning older enquiries are not included. */
  windowCapped: boolean;
  /** Firestore unreachable or unconfigured. */
  unavailable: boolean;
}

const WINDOW = 500;
export const PAGE_SIZE = 25;

/* ------------------------------------------------------------------ *
 * Mapping
 * ------------------------------------------------------------------ */

function millis(value: unknown): number | null {
  const ts = value as { toMillis?: () => number } | undefined;
  if (typeof ts?.toMillis === "function") return ts.toMillis();
  return typeof value === "number" ? value : null;
}

function toStatus(value: unknown): EnquiryStatus {
  return ENQUIRY_STATUSES.includes(value as EnquiryStatus)
    ? (value as EnquiryStatus)
    : "new";
}

function toEnquiry(id: string, data: Record<string, unknown>): EnquiryRecord {
  return {
    id,
    name: String(data.name ?? ""),
    phone: String(data.phone ?? ""),
    email: String(data.email ?? ""),
    course: String(data.course ?? ""),
    message: String(data.message ?? ""),
    source: String(data.source ?? "website"),
    status: toStatus(data.status),
    assignedTo: typeof data.assignedTo === "string" ? data.assignedTo : null,
    userAgent: typeof data.userAgent === "string" ? data.userAgent : null,
    createdAtMs: millis(data.createdAt),
    updatedAtMs: millis(data.updatedAt),
  };
}

const emptyCounts = (): StatusCounts => ({
  all: 0,
  new: 0,
  open: 0,
  replied: 0,
  closed: 0,
});

/* ------------------------------------------------------------------ *
 * Reads
 * ------------------------------------------------------------------ */

/**
 * Deduplicated per request, not cached across requests. The dashboard layout
 * needs the counts for its sidebar badge and the page below it needs the same
 * documents — `cache()` collapses those into one Firestore read without ever
 * serving a stale inbox, which is the distinction that matters here.
 */
const readWindow = cache(async (): Promise<EnquiryRecord[] | null> => {
  const db = getDb();
  if (!db) return null;

  try {
    const snap = await db
      .collection("enquiries")
      .orderBy("createdAt", "desc")
      .limit(WINDOW)
      .get();

    return snap.docs.map((doc) => toEnquiry(doc.id, doc.data()));
  } catch (error) {
    console.error("[cms/enquiries] list failed", error);
    return null;
  }
});

function matchesSearch(enquiry: EnquiryRecord, needle: string): boolean {
  if (!needle) return true;
  const haystack = [
    enquiry.name,
    enquiry.email,
    enquiry.phone,
    enquiry.course,
    enquiry.message,
  ]
    .join(" ")
    .toLowerCase();
  return haystack.includes(needle);
}

export async function listEnquiries({
  status,
  search = "",
  page = 1,
  pageSize = PAGE_SIZE,
}: {
  status?: EnquiryStatus;
  search?: string;
  page?: number;
  pageSize?: number;
} = {}): Promise<EnquiryPage> {
  const all = await readWindow();

  if (!all) {
    return {
      items: [],
      counts: emptyCounts(),
      total: 0,
      page: 1,
      pageCount: 1,
      pageSize,
      windowCapped: false,
      unavailable: true,
    };
  }

  const needle = search.trim().toLowerCase();
  const searched = needle ? all.filter((e) => matchesSearch(e, needle)) : all;

  // Counts reflect the active search so the tab numbers agree with the table.
  const counts = emptyCounts();
  counts.all = searched.length;
  for (const enquiry of searched) counts[enquiry.status] += 1;

  const filtered = status
    ? searched.filter((e) => e.status === status)
    : searched;

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const current = Math.min(Math.max(1, page), pageCount);
  const start = (current - 1) * pageSize;

  return {
    items: filtered.slice(start, start + pageSize),
    counts,
    total: filtered.length,
    page: current,
    pageCount,
    pageSize,
    windowCapped: all.length >= WINDOW,
    unavailable: false,
  };
}

export async function getEnquiry(id: string): Promise<EnquiryRecord | null> {
  const db = getDb();
  if (!db) return null;

  try {
    const snap = await db.collection("enquiries").doc(id).get();
    if (!snap.exists) return null;
    return toEnquiry(snap.id, snap.data() ?? {});
  } catch (error) {
    console.error("[cms/enquiries] get failed", id, error);
    return null;
  }
}

export async function listReplies(id: string): Promise<EnquiryReply[]> {
  const db = getDb();
  if (!db) return [];

  try {
    const snap = await db
      .collection("enquiries")
      .doc(id)
      .collection("replies")
      .orderBy("createdAt", "asc")
      .get();

    return snap.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        body: String(data.body ?? ""),
        channel: (REPLY_CHANNELS.includes(data.channel as ReplyChannel)
          ? data.channel
          : "note") as ReplyChannel,
        authorUid: String(data.authorUid ?? ""),
        authorName: String(data.authorName ?? "Admin"),
        createdAtMs: millis(data.createdAt),
        deliveryStatus: (data.deliveryStatus ?? "not-sent") as DeliveryStatus,
      };
    });
  } catch (error) {
    console.error("[cms/enquiries] replies read failed", id, error);
    return [];
  }
}

/** Status tallies for the overview. Cheap enough to reuse the same window. */
export async function getEnquiryStats(): Promise<{
  counts: StatusCounts;
  recent: EnquiryRecord[];
  unavailable: boolean;
}> {
  const all = await readWindow();
  if (!all) return { counts: emptyCounts(), recent: [], unavailable: true };

  const counts = emptyCounts();
  counts.all = all.length;
  for (const enquiry of all) counts[enquiry.status] += 1;

  return { counts, recent: all.slice(0, 5), unavailable: false };
}

/* ------------------------------------------------------------------ *
 * Writes
 *
 * Authorization and audit logging live in the server actions that call these.
 * ------------------------------------------------------------------ */

export async function setEnquiryStatus(
  id: string,
  status: EnquiryStatus,
): Promise<boolean> {
  const db = getDb();
  if (!db) return false;

  try {
    await db.collection("enquiries").doc(id).update({
      status,
      updatedAt: FieldValue.serverTimestamp(),
    });
    return true;
  } catch (error) {
    console.error("[cms/enquiries] status update failed", id, error);
    return false;
  }
}

export async function addReply(
  id: string,
  reply: ReplyInput & {
    authorUid: string;
    authorName: string;
    deliveryStatus: DeliveryStatus;
  },
): Promise<string | null> {
  const db = getDb();
  if (!db) return null;

  try {
    const doc = await db
      .collection("enquiries")
      .doc(id)
      .collection("replies")
      .add({
        body: reply.body,
        channel: reply.channel,
        authorUid: reply.authorUid,
        authorName: reply.authorName,
        deliveryStatus: reply.deliveryStatus,
        createdAt: FieldValue.serverTimestamp(),
      });

    return doc.id;
  } catch (error) {
    console.error("[cms/enquiries] reply write failed", id, error);
    return null;
  }
}

/** Every enquiry in the window, for CSV export. */
export async function exportEnquiries(): Promise<EnquiryRecord[] | null> {
  return readWindow();
}
