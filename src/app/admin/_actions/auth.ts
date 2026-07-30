"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";

import { login, loginRateLimited, logout } from "@/lib/admin/auth";
import { ADMIN_HOME, LOGIN_PATH } from "@/lib/admin/session-cookie";

const credentialsSchema = z.object({
  email: z.string().trim().min(1).max(200),
  password: z.string().min(1).max(200),
});

export interface LoginState {
  error?: string;
}

/**
 * Only same-origin admin paths are accepted as a post-login destination.
 * `next` arrives in a query string, so without this check the login page is an
 * open redirect.
 */
function safeNext(value: unknown): string {
  const raw = typeof value === "string" ? value : "";
  if (!raw.startsWith("/admin")) return ADMIN_HOME;
  if (raw.startsWith("//") || raw.includes("://")) return ADMIN_HOME;
  if (raw === LOGIN_PATH || raw.startsWith(`${LOGIN_PATH}/`)) return ADMIN_HOME;
  return raw;
}

export async function loginAction(
  _previous: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const parsed = credentialsSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: "Enter your email and password." };
  }

  const headerList = await headers();
  const ip =
    headerList.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

  if (loginRateLimited(`${ip}:${parsed.data.email}`)) {
    return {
      error: "Too many sign-in attempts. Wait a few minutes and try again.",
    };
  }

  const result = await login(parsed.data.email, parsed.data.password);
  if (!result.ok) return { error: result.error };

  // Outside the try/catch-free path on purpose: redirect() signals by throwing,
  // so it must be the last thing the action does.
  redirect(safeNext(formData.get("next")));
}

export async function logoutAction(): Promise<void> {
  await logout();
  redirect(LOGIN_PATH);
}
