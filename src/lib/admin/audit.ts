import "server-only";

import { FieldValue } from "firebase-admin/firestore";

import type { AdminSession } from "@/lib/admin/auth";
import { getDb } from "@/lib/firebase";

/**
 * Audit log.
 *
 * Saving in the dashboard publishes immediately — there is no draft workflow —
 * so this log is the safety net. It records who changed what and the document
 * on both sides of the change, which is enough to reconstruct a bad edit by
 * hand.
 *
 * Never throws. Losing an audit entry is bad; failing a save the user already
 * confirmed because the log write hiccuped is worse.
 */

export type AuditAction = "create" | "update" | "delete";

export interface AuditEntry {
  actor: Pick<AdminSession, "uid" | "email">;
  entity: string;
  entityId: string;
  action: AuditAction;
  before?: unknown;
  after?: unknown;
}

export interface AuditRecord {
  id: string;
  actorUid: string;
  actorEmail: string;
  entity: string;
  entityId: string;
  action: AuditAction;
  before: unknown;
  after: unknown;
  atMs: number | null;
}

/** Firestore rejects nested undefined and cannot store class instances. */
function plain(value: unknown): unknown {
  if (value === undefined) return null;
  try {
    return JSON.parse(JSON.stringify(value));
  } catch {
    return null;
  }
}

export async function writeAudit(entry: AuditEntry): Promise<void> {
  const db = getDb();
  if (!db) return;

  try {
    await db.collection("auditLog").add({
      actorUid: entry.actor.uid,
      actorEmail: entry.actor.email,
      entity: entry.entity,
      entityId: entry.entityId,
      action: entry.action,
      before: plain(entry.before),
      after: plain(entry.after),
      at: FieldValue.serverTimestamp(),
    });
  } catch (error) {
    console.error("[admin/audit] write failed", entry, error);
  }
}

export async function listAudit(limit = 100): Promise<AuditRecord[]> {
  const db = getDb();
  if (!db) return [];

  try {
    const snap = await db
      .collection("auditLog")
      .orderBy("at", "desc")
      .limit(limit)
      .get();

    return snap.docs.map((doc) => {
      const data = doc.data();
      const at = data.at as { toMillis?: () => number } | undefined;
      return {
        id: doc.id,
        actorUid: String(data.actorUid ?? ""),
        actorEmail: String(data.actorEmail ?? ""),
        entity: String(data.entity ?? ""),
        entityId: String(data.entityId ?? ""),
        action: (data.action ?? "update") as AuditAction,
        before: data.before ?? null,
        after: data.after ?? null,
        atMs: at?.toMillis?.() ?? null,
      };
    });
  } catch (error) {
    console.error("[admin/audit] read failed", error);
    return [];
  }
}
