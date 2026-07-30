/**
 * Session cookie constants.
 *
 * Kept in its own dependency-free module because `middleware.ts` runs on the
 * Edge runtime and must not pull `firebase-admin` (or anything `server-only`)
 * into its bundle. Everything else about the session lives in `./auth.ts`.
 */
export const SESSION_COOKIE = "sss_admin_session";

/** Five days, in seconds. Firebase caps session cookies at 14 days. */
export const SESSION_MAX_AGE_SECONDS = 5 * 24 * 60 * 60;

export const LOGIN_PATH = "/admin/login";
export const ADMIN_HOME = "/admin";
