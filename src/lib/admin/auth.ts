import "server-only";

import { FieldValue } from "firebase-admin/firestore";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import {
  LOGIN_PATH,
  SESSION_COOKIE,
  SESSION_MAX_AGE_SECONDS,
} from "@/lib/admin/session-cookie";
import { getAdminAuth, getDb } from "@/lib/firebase";

/**
 * Admin authentication.
 *
 * Password sign-in goes through the Identity Toolkit REST API rather than the
 * Firebase client SDK — the SDK would add a large bundle to every page for the
 * sake of one login form. The returned ID token is exchanged server-side for a
 * session cookie, so the browser never holds a Firebase credential.
 *
 * Authorization is a separate gate from authentication: valid Firebase
 * credentials are not enough. An `admins/{uid}` document must exist. Removing
 * that document revokes dashboard access without touching the auth user.
 */

export type AdminRole = "owner" | "admin" | "editor";

export interface AdminSession {
  uid: string;
  email: string;
  name: string;
  role: AdminRole;
}

/**
 * Deliberately identical for every failure mode — wrong password, unknown
 * email, existing Firebase user with no admin record. Distinguishing them
 * turns the login form into an account enumeration oracle.
 */
const GENERIC_FAILURE = "Incorrect email or password.";

const ROLES: readonly AdminRole[] = ["owner", "admin", "editor"];

function toRole(value: unknown): AdminRole {
  return ROLES.includes(value as AdminRole) ? (value as AdminRole) : "editor";
}

/* ------------------------------------------------------------------ *
 * Rate limiting
 * ------------------------------------------------------------------ */

/**
 * Same naive per-instance limiter as `POST /api/enquiry`. It blunts scripted
 * password guessing against a single warm instance and nothing more — on a
 * multi-instance deploy each instance keeps its own counter, so this is not
 * real brute-force protection. That belongs at the edge.
 */
const RATE_WINDOW_MS = 10 * 60_000;
const RATE_MAX = 8;
const attempts = new Map<string, number[]>();

export function loginRateLimited(key: string): boolean {
  const now = Date.now();
  const recent = (attempts.get(key) ?? []).filter(
    (t) => now - t < RATE_WINDOW_MS,
  );
  recent.push(now);
  attempts.set(key, recent);

  if (attempts.size > 500) {
    for (const [k, v] of attempts) {
      if (v.every((t) => now - t >= RATE_WINDOW_MS)) attempts.delete(k);
    }
  }

  return recent.length > RATE_MAX;
}

/* ------------------------------------------------------------------ *
 * Sign in
 * ------------------------------------------------------------------ */

interface SignInResult {
  idToken: string;
  uid: string;
}

async function signInWithPassword(
  email: string,
  password: string,
): Promise<{ result: SignInResult | null; missingApiKey?: boolean }> {
  const rawKey = process.env.FIREBASE_WEB_API_KEY;
  const key = rawKey?.trim().replace(/^["']|["']$/g, "");
  if (!key) {
    console.error("[admin/auth] FIREBASE_WEB_API_KEY is not set");
    return { result: null, missingApiKey: true };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);

  try {
    const response = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${encodeURIComponent(key)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, returnSecureToken: true }),
        cache: "no-store",
        signal: controller.signal,
      },
    );

    const data = (await response.json()) as {
      idToken?: string;
      localId?: string;
      error?: { message?: string; code?: number };
    };

    if (!response.ok || !data.idToken || !data.localId) {
      console.warn(
        `[admin/auth] sign-in rejected (HTTP ${response.status}):`,
        data.error?.message ?? "Unknown error",
      );
      return { result: null };
    }

    return { result: { idToken: data.idToken, uid: data.localId } };
  } catch (error) {
    console.error("[admin/auth] identity toolkit request failed", error);
    return { result: null };
  } finally {
    clearTimeout(timeout);
  }
}

async function loadAdminRecord(uid: string): Promise<AdminSession | null> {
  const db = getDb();
  if (!db) return null;

  try {
    const snap = await db.collection("admins").doc(uid).get();
    if (!snap.exists) {
      console.warn(
        `[admin/auth] authenticated user (UID: ${uid}) has no admins/${uid} record in Firestore`,
      );
      return null;
    }

    const data = snap.data() ?? {};
    return {
      uid,
      email: String(data.email ?? ""),
      name: String(data.name ?? data.email ?? "Admin"),
      role: toRole(data.role),
    };
  } catch (error) {
    console.error("[admin/auth] admin record read failed", error);
    return null;
  }
}

export type LoginResult = { ok: true } | { ok: false; error: string };

export async function login(
  email: string,
  password: string,
): Promise<LoginResult> {
  const auth = getAdminAuth();
  if (!auth) {
    return {
      ok: false,
      error:
        "The dashboard is not configured on this deployment. Set FIREBASE_SERVICE_ACCOUNT_KEY.",
    };
  }

  const { result: credentials, missingApiKey } = await signInWithPassword(
    email,
    password,
  );
  if (missingApiKey) {
    return {
      ok: false,
      error:
        "FIREBASE_WEB_API_KEY is not configured on this deployment. Set FIREBASE_WEB_API_KEY in Vercel.",
    };
  }
  if (!credentials) return { ok: false, error: GENERIC_FAILURE };

  // The authorization gate. No admins/{uid} document, no access — even though
  // the password was correct.
  const record = await loadAdminRecord(credentials.uid);
  if (!record) {
    console.warn(
      "[admin/auth] authenticated user has no admins/ record",
      credentials.uid,
    );
    return { ok: false, error: GENERIC_FAILURE };
  }

  try {
    const sessionCookie = await auth.createSessionCookie(credentials.idToken, {
      expiresIn: SESSION_MAX_AGE_SECONDS * 1000,
    });

    const store = await cookies();
    store.set(SESSION_COOKIE, sessionCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_MAX_AGE_SECONDS,
    });
  } catch (error) {
    console.error("[admin/auth] session cookie mint failed", error);
    return {
      ok: false,
      error: "Could not start a session. Please try again.",
    };
  }

  // Best effort — a failed timestamp write must not block a valid login.
  const db = getDb();
  try {
    await db
      ?.collection("admins")
      .doc(credentials.uid)
      .set({ lastLoginAt: FieldValue.serverTimestamp() }, { merge: true });
  } catch (error) {
    console.warn("[admin/auth] lastLoginAt write failed", error);
  }

  return { ok: true };
}

/* ------------------------------------------------------------------ *
 * Sign out
 * ------------------------------------------------------------------ */

export async function logout(): Promise<void> {
  const store = await cookies();
  const cookie = store.get(SESSION_COOKIE)?.value;

  // Clear the cookie first so the browser is signed out even if the revoke
  // call below fails.
  store.delete(SESSION_COOKIE);

  if (!cookie) return;

  const auth = getAdminAuth();
  if (!auth) return;

  try {
    // Revoking refresh tokens invalidates the session cookie server-side, so a
    // copied cookie value is useless after logout.
    const decoded = await auth.verifySessionCookie(cookie, false);
    await auth.revokeRefreshTokens(decoded.sub);
  } catch {
    // Already expired or invalid. Nothing to revoke.
  }
}

/* ------------------------------------------------------------------ *
 * Session reads
 * ------------------------------------------------------------------ */

/**
 * Resolve the current admin, or null.
 *
 * `checkRevoked` costs a network round trip, so pass it for mutations and leave
 * it off for page reads.
 */
export async function getSession(
  { checkRevoked = false }: { checkRevoked?: boolean } = {},
): Promise<AdminSession | null> {
  const store = await cookies();
  const cookie = store.get(SESSION_COOKIE)?.value;
  if (!cookie) return null;

  const auth = getAdminAuth();
  if (!auth) return null;

  try {
    const decoded = await auth.verifySessionCookie(cookie, checkRevoked);
    return await loadAdminRecord(decoded.sub);
  } catch {
    return null;
  }
}

/**
 * The security boundary. Every admin page, server action and admin route
 * handler calls this — `middleware.ts` only checks that a cookie exists and
 * cannot verify anything, because `firebase-admin` does not run on the Edge.
 *
 * A missed call is an open door.
 */
export async function requireAdmin(
  options: { checkRevoked?: boolean } = {},
): Promise<AdminSession> {
  const session = await getSession(options);
  if (!session) redirect(LOGIN_PATH);
  return session;
}
