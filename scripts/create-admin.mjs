/**
 * Create the first dashboard account.
 *
 *   node scripts/create-admin.mjs you@sssacademy.in 'a-long-password' 'Your Name' owner
 *
 * Two things have to exist for sign-in to work, and this does both:
 *
 *   1. A Firebase Auth user, so the password check has something to check.
 *   2. An `admins/{uid}` document, which is the authorization gate. Without it
 *      a valid password still gets no access.
 *
 * Re-running with the same email updates the password and the admin record
 * rather than failing, which makes it a password reset too.
 *
 * Reads FIREBASE_SERVICE_ACCOUNT_KEY from the environment or from .env.local —
 * plain `node` does not load .env files the way `next` does.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { cert, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { FieldValue, getFirestore } from "firebase-admin/firestore";

const ROLES = ["owner", "admin", "editor"];

function loadEnvFile(name) {
  try {
    const text = readFileSync(resolve(process.cwd(), name), "utf8");
    for (const line of text.split("\n")) {
      const match = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(line);
      if (!match) continue;
      const [, key, rawValue] = match;
      if (process.env[key]) continue;
      process.env[key] = rawValue.replace(/^["']|["']$/g, "");
    }
  } catch {
    // No file. The variable may still be exported in the shell.
  }
}

function die(message) {
  console.error(`\n  ${message}\n`);
  process.exit(1);
}

function readServiceAccount() {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!raw) {
    die(
      "FIREBASE_SERVICE_ACCOUNT_KEY is not set. Put it in .env.local or export it.",
    );
  }

  const json = raw.trim().startsWith("{")
    ? raw
    : Buffer.from(raw, "base64").toString("utf8");

  const parsed = JSON.parse(json);
  if (!parsed.project_id || !parsed.client_email || !parsed.private_key) {
    die("The service account JSON is missing project_id, client_email or private_key.");
  }

  return {
    projectId: parsed.project_id,
    clientEmail: parsed.client_email,
    privateKey: parsed.private_key.replace(/\\n/g, "\n"),
  };
}

async function main() {
  loadEnvFile(".env.local");
  loadEnvFile(".env");

  const [email, password, name, roleArg] = process.argv.slice(2);

  if (!email || !password) {
    die(
      "Usage: node scripts/create-admin.mjs <email> <password> [name] [owner|admin|editor]",
    );
  }
  if (password.length < 12) {
    die("Use a password of at least 12 characters. This account can edit the live site.");
  }

  const role = roleArg ?? "owner";
  if (!ROLES.includes(role)) {
    die(`Role must be one of: ${ROLES.join(", ")}`);
  }

  const credentials = readServiceAccount();
  const app = initializeApp({
    credential: cert(credentials),
    projectId: credentials.projectId,
  });

  const auth = getAuth(app);
  const db = getFirestore(app);

  let user;
  try {
    user = await auth.getUserByEmail(email);
    await auth.updateUser(user.uid, { password, displayName: name ?? user.displayName });
    console.log(`  Existing Firebase user updated: ${user.uid}`);
  } catch (error) {
    if (error.code !== "auth/user-not-found") throw error;
    user = await auth.createUser({
      email,
      password,
      displayName: name ?? email,
      emailVerified: true,
    });
    console.log(`  Firebase user created: ${user.uid}`);
  }

  await db
    .collection("admins")
    .doc(user.uid)
    .set(
      {
        email,
        name: name ?? email,
        role,
        createdAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );

  console.log(`  admins/${user.uid} written with role "${role}".`);
  console.log(`\n  Sign in at /admin/login as ${email}.\n`);
  console.log(
    "  Reminder: FIREBASE_WEB_API_KEY must also be set for password sign-in to work.\n",
  );
}

main().catch((error) => {
  console.error("\n  Failed:", error.message ?? error, "\n");
  process.exit(1);
});
