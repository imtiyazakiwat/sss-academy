"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";

import { writeAudit } from "@/lib/admin/audit";
import { requireAdmin } from "@/lib/admin/auth";
import { NOTICES_TAG } from "@/lib/admin/tags";
import {
  createNotice,
  deleteNotice,
  getNotice,
  noticeSchema,
  updateNotice,
} from "@/lib/cms/notices";

/**
 * Notices publish immediately — there is no draft state beyond the `active`
 * flag, which is the draft state. `revalidateTag` is what makes the change
 * visible on the public site; without it the announcement bar would keep
 * serving the cached value indefinitely, because the loader has no time-based
 * expiry.
 */

export interface NoticeState {
  error?: string;
  success?: string;
  fieldErrors?: Record<string, string>;
}

const idSchema = z.string().trim().min(1).max(200).refine(
  (v) => !v.includes("/"),
  "Invalid document ID",
);

function readForm(formData: FormData) {
  return {
    message: formData.get("message"),
    href: formData.get("href") ?? "",
    cta: formData.get("cta") ?? "",
    active: formData.get("active") === "on",
    order: Number.parseInt(String(formData.get("order") ?? "0"), 10) || 0,
    expiresAt: formData.get("expiresAt") ?? "",
  };
}

function toFieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

function published() {
  revalidateTag(NOTICES_TAG);
  revalidatePath("/admin/notices");
  revalidatePath("/admin");
}

export async function saveNoticeAction(
  _previous: NoticeState,
  formData: FormData,
): Promise<NoticeState> {
  const session = await requireAdmin({ checkRevoked: true });

  const rawId = formData.get("id");
  const id = typeof rawId === "string" && rawId
    ? idSchema.safeParse(rawId).success ? rawId.trim() : null
    : null;

  const parsed = noticeSchema.safeParse(readForm(formData));
  if (!parsed.success) {
    return {
      error: "Please check the highlighted fields.",
      fieldErrors: toFieldErrors(parsed.error),
    };
  }

  if (id) {
    const before = await getNotice(id);
    if (!before) return { error: "That notice no longer exists." };

    const ok = await updateNotice(id, parsed.data);
    if (!ok) return { error: "Could not save. Please try again." };

    await writeAudit({
      actor: session,
      entity: "notices",
      entityId: id,
      action: "update",
      before,
      after: parsed.data,
    });

    published();
    return { success: "Notice saved." };
  }

  const newId = await createNotice(parsed.data);
  if (!newId) return { error: "Could not create the notice. Please try again." };

  await writeAudit({
    actor: session,
    entity: "notices",
    entityId: newId,
    action: "create",
    after: parsed.data,
  });

  published();
  return {
    success: parsed.data.active
      ? "Notice published. It is live on the site now."
      : "Notice saved as inactive. Tick “Show on the site” to publish it.",
  };
}

export async function toggleNoticeAction(formData: FormData): Promise<void> {
  const session = await requireAdmin({ checkRevoked: true });

  const parsed = idSchema.safeParse(formData.get("id"));
  if (!parsed.success) return;

  const before = await getNotice(parsed.data);
  if (!before) return;

  const ok = await updateNotice(parsed.data, {
    message: before.message,
    href: before.href,
    cta: before.cta,
    order: before.order,
    active: !before.active,
    expiresAt: before.expiresAtMs
      ? new Date(before.expiresAtMs).toISOString().slice(0, 10)
      : "",
  });

  if (!ok) return;

  await writeAudit({
    actor: session,
    entity: "notices",
    entityId: parsed.data,
    action: "update",
    before: { active: before.active },
    after: { active: !before.active },
  });

  published();
}

export async function deleteNoticeAction(formData: FormData): Promise<void> {
  const session = await requireAdmin({ checkRevoked: true });

  const parsed = idSchema.safeParse(formData.get("id"));
  if (!parsed.success) return;

  const before = await getNotice(parsed.data);
  const ok = await deleteNotice(parsed.data);
  if (!ok) return;

  await writeAudit({
    actor: session,
    entity: "notices",
    entityId: parsed.data,
    action: "delete",
    before,
  });

  published();
}
