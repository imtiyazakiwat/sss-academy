"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";

import { writeAudit } from "@/lib/admin/audit";
import { requireAdmin } from "@/lib/admin/auth";
import { BANNERS_TAG } from "@/lib/admin/tags";
import {
  bannerSchema,
  createBanner,
  deleteBanner,
  getBanner,
  updateBanner,
} from "@/lib/cms/banners";

/**
 * Banners publish immediately, same as notices — `active` is the only draft
 * state. `revalidateTag` is what makes an edit show up in the popup; without
 * it the homepage keeps serving the previously cached banner indefinitely.
 */

export interface BannerState {
  error?: string;
  success?: string;
  fieldErrors?: Record<string, string>;
}

const idSchema = z.string().trim().min(1).max(200);

function readForm(formData: FormData) {
  return {
    title: formData.get("title"),
    description: formData.get("description"),
    primaryLabel: formData.get("primaryLabel") ?? "",
    primaryHref: formData.get("primaryHref") ?? "",
    secondaryLabel: formData.get("secondaryLabel") ?? "",
    secondaryHref: formData.get("secondaryHref") ?? "",
    deadlineLabel: formData.get("deadlineLabel") ?? "",
    deadlineAt: formData.get("deadlineAt") ?? "",
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
  revalidateTag(BANNERS_TAG);
  revalidatePath("/admin/banners");
  revalidatePath("/admin");
  revalidatePath("/");
}

export async function saveBannerAction(
  _previous: BannerState,
  formData: FormData,
): Promise<BannerState> {
  const session = await requireAdmin({ checkRevoked: true });

  const rawId = formData.get("id");
  const id = typeof rawId === "string" && rawId ? rawId : null;

  const parsed = bannerSchema.safeParse(readForm(formData));
  if (!parsed.success) {
    return {
      error: "Please check the highlighted fields.",
      fieldErrors: toFieldErrors(parsed.error),
    };
  }

  if (id) {
    const before = await getBanner(id);
    if (!before) return { error: "That banner no longer exists." };

    const ok = await updateBanner(id, parsed.data);
    if (!ok) return { error: "Could not save. Please try again." };

    await writeAudit({
      actor: session,
      entity: "banners",
      entityId: id,
      action: "update",
      before,
      after: parsed.data,
    });

    published();
    return { success: "Banner saved." };
  }

  const newId = await createBanner(parsed.data);
  if (!newId) return { error: "Could not create the banner. Please try again." };

  await writeAudit({
    actor: session,
    entity: "banners",
    entityId: newId,
    action: "create",
    after: parsed.data,
  });

  published();
  return {
    success: parsed.data.active
      ? "Banner published. It will pop up on the homepage now."
      : "Banner saved as inactive. Tick “Show on the site” to publish it.",
  };
}

export async function toggleBannerAction(formData: FormData): Promise<void> {
  const session = await requireAdmin({ checkRevoked: true });

  const parsed = idSchema.safeParse(formData.get("id"));
  if (!parsed.success) return;

  const before = await getBanner(parsed.data);
  if (!before) return;

  const ok = await updateBanner(parsed.data, {
    title: before.title,
    description: before.description,
    primaryLabel: before.primaryLabel,
    primaryHref: before.primaryHref,
    secondaryLabel: before.secondaryLabel,
    secondaryHref: before.secondaryHref,
    deadlineLabel: before.deadlineLabel,
    deadlineAt: before.deadlineAtMs
      ? new Date(before.deadlineAtMs).toISOString().slice(0, 10)
      : "",
    order: before.order,
    active: !before.active,
    expiresAt: before.expiresAtMs
      ? new Date(before.expiresAtMs).toISOString().slice(0, 10)
      : "",
  });

  if (!ok) return;

  await writeAudit({
    actor: session,
    entity: "banners",
    entityId: parsed.data,
    action: "update",
    before: { active: before.active },
    after: { active: !before.active },
  });

  published();
}

export async function deleteBannerAction(formData: FormData): Promise<void> {
  const session = await requireAdmin({ checkRevoked: true });

  const parsed = idSchema.safeParse(formData.get("id"));
  if (!parsed.success) return;

  const before = await getBanner(parsed.data);
  const ok = await deleteBanner(parsed.data);
  if (!ok) return;

  await writeAudit({
    actor: session,
    entity: "banners",
    entityId: parsed.data,
    action: "delete",
    before,
  });

  published();
}
