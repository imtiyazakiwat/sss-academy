import "server-only";

import {
  cert,
  getApp,
  getApps,
  initializeApp,
  type App,
} from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
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

type Cache = { app: App; db: Firestore } | null;

/**
 * The cache lives on `globalThis`, not in a module variable.
 *
 * `firebase-admin`'s app registry is process-global, but Next evaluates this
 * module in more than one module graph and re-evaluates it on every HMR pass in
 * dev. A module-scoped cache therefore resets to `undefined` while the app it
 * created is still registered — the retry then finds the existing app, calls
 * `settings()` on an already-initialised Firestore, throws, and caches null.
 * That silently turned a fully configured deploy into "Firebase is not
 * configured" until the next restart. Keying off the global registry keeps the
 * cache and the registry in step.
 */
const CACHE_KEY = Symbol.for("sss-academy.firebase.cache");

const globalCache = globalThis as typeof globalThis & {
  [CACHE_KEY]?: Cache;
};

/**
 * Single lazily-initialised named app shared by Firestore and Auth. Returns
 * null rather than throwing so an unconfigured deploy still renders.
 */
function getAppOrNull(): App | null {
  const cached = globalCache[CACHE_KEY];
  if (cached !== undefined) return cached?.app ?? null;

  const credentials = readServiceAccount();
  if (!credentials) {
    globalCache[CACHE_KEY] = null;
    return null;
  }

  try {
    const existing = getApps().find((a) => a.name === APP_NAME);
    const app = existing
      ? getApp(APP_NAME)
      : initializeApp(
          {
            credential: cert(credentials),
            projectId: credentials.projectId,
          },
          APP_NAME,
        );

    const db = getFirestore(app);

    // Only meaningful once per Firestore instance, and the instance outlives
    // this module. Throwing here must not fail initialisation — the setting is
    // already applied from the pass that created it.
    try {
      db.settings({ ignoreUndefinedProperties: true });
    } catch {
      // Already initialised. Nothing to do.
    }

    globalCache[CACHE_KEY] = { app, db };
    return app;
  } catch (error) {
    // Deliberately not cached: a genuine failure here (network, malformed
    // credential) should be retried on the next request rather than latched
    // into a permanent "not configured" state.
    console.error("[firebase] initialisation failed", error);
    return null;
  }
}

export function getDb(): Firestore | null {
  getAppOrNull();
  return globalCache[CACHE_KEY]?.db ?? null;
}

/**
 * Admin Auth, used by the dashboard to mint and verify session cookies.
 * Node runtime only — never reachable from middleware or a client component.
 */
export function getAdminAuth(): Auth | null {
  const app = getAppOrNull();
  if (!app) return null;

  try {
    return getAuth(app);
  } catch (error) {
    console.error("[firebase] auth initialisation failed", error);
    return null;
  }
}

export const isFirebaseConfigured = () => getDb() !== null;
