import "server-only";

import { getDb } from "@/lib/firebase";

/**
 * Notices are the one genuinely time-sensitive element on the site (batch
 * starts, admission deadlines). They live in Firestore so staff can update
 * them without a redeploy, and fall back to nothing when unconfigured — we
 * never fabricate urgency.
 *
 * Firestore shape — collection `notices`:
 *   { message: string, href?: string, cta?: string,
 *     active: boolean, expiresAt?: Timestamp, order?: number }
 */
export interface Notice {
  id: string;
  message: string;
  href?: string;
  cta?: string;
}

export async function getActiveNotices(): Promise<Notice[]> {
  const db = getDb();
  if (!db) return [];

  try {
    const snapshot = await db
      .collection("notices")
      .where("active", "==", true)
      .limit(10)
      .get();

    const now = Date.now();

    return snapshot.docs
      .map((doc) => {
        const data = doc.data() as Record<string, unknown>;
        const expiresAt = data.expiresAt as { toMillis?: () => number } | undefined;
        return {
          id: doc.id,
          message: String(data.message ?? ""),
          href: typeof data.href === "string" ? data.href : undefined,
          cta: typeof data.cta === "string" ? data.cta : undefined,
          order: typeof data.order === "number" ? data.order : 0,
          expiresAtMs: expiresAt?.toMillis?.() ?? null,
        };
      })
      .filter((n) => n.message && (n.expiresAtMs === null || n.expiresAtMs > now))
      .sort((a, b) => a.order - b.order)
      .map(({ id, message, href, cta }) => ({ id, message, href, cta }));
  } catch (error) {
    console.error("[notices] fetch failed", error);
    return [];
  }
}
