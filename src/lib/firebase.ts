import "server-only";

import {
  cert,
  getApp,
  getApps,
  initializeApp,
  type App,
} from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

const APP_NAME = "sss-academy";

/**
 * Firebase is optional at build time.
 *
 * The site's core content is statically compiled (see `src/content`), so pages
 * render fine without credentials. Firestore is layered on top for the parts
 * that need to change without a redeploy — notices, and enquiry capture.
 *
 * Credentials come from a single base64-encoded service account JSON so that a
 * multi-line private key survives Vercel's env var UI intact.
 */
function readServiceAccount() {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!raw) return null;

  try {
    const json = raw.trim().startsWith("{")
      ? raw
      : Buffer.from(raw, "base64").toString("utf8");
    const parsed = JSON.parse(json) as {
      project_id?: string;
      client_email?: string;
      private_key?: string;
    };

    if (!parsed.project_id || !parsed.client_email || !parsed.private_key) {
      console.warn("[firebase] service account JSON is missing required fields");
      return null;
    }

    return {
      projectId: parsed.project_id,
      clientEmail: parsed.client_email,
      privateKey: parsed.private_key.replace(/\\n/g, "\n"),
    };
  } catch {
    console.warn("[firebase] could not parse FIREBASE_SERVICE_ACCOUNT_KEY");
    return null;
  }
}

let cached: { app: App; db: Firestore } | null | undefined;

export function getDb(): Firestore | null {
  if (cached !== undefined) return cached?.db ?? null;

  const credentials = readServiceAccount();
  if (!credentials) {
    cached = null;
    return null;
  }

  try {
    const app = getApps().find((a) => a.name === APP_NAME)
      ? getApp(APP_NAME)
      : initializeApp(
          {
            credential: cert(credentials),
            projectId: credentials.projectId,
          },
          APP_NAME,
        );

    const db = getFirestore(app);
    db.settings({ ignoreUndefinedProperties: true });
    cached = { app, db };
    return db;
  } catch (error) {
    console.error("[firebase] initialisation failed", error);
    cached = null;
    return null;
  }
}

export const isFirebaseConfigured = () => getDb() !== null;
