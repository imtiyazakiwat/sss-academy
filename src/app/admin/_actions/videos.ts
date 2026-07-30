"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";

import { writeAudit } from "@/lib/admin/audit";
import { requireAdmin } from "@/lib/admin/auth";
import { VIDEOS_TAG } from "@/lib/admin/tags";
import {
  createVideo,
  deleteVideo,
  getVideo,
  updateVideo,
  videoSchema,
} from "@/lib/cms/videos";

export interface VideoState {
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
    title: formData.get("title"),
    description: formData.get("description") ?? "",
    youtubeUrl: formData.get("youtubeUrl"),
    active: formData.get("active") === "on",
    order: Number.parseInt(String(formData.get("order") ?? "0"), 10) || 0,
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
  revalidateTag(VIDEOS_TAG);
  revalidatePath("/admin/videos");
  revalidatePath("/admin");
  revalidatePath("/");
}

export async function saveVideoAction(
  _previous: VideoState,
  formData: FormData,
): Promise<VideoState> {
  const session = await requireAdmin({ checkRevoked: true });

  const rawId = formData.get("id");
  const id = typeof rawId === "string" && rawId
    ? idSchema.safeParse(rawId).success ? rawId.trim() : null
    : null;

  const parsed = videoSchema.safeParse(readForm(formData));
  if (!parsed.success) {
    return {
      error: "Please check the highlighted fields.",
      fieldErrors: toFieldErrors(parsed.error),
    };
  }

  if (id) {
    const before = await getVideo(id);
    if (!before) return { error: "That video no longer exists." };

    const ok = await updateVideo(id, parsed.data);
    if (!ok) return { error: "Could not save. Please try again." };

    await writeAudit({
      actor: session,
      entity: "videos",
      entityId: id,
      action: "update",
      before,
      after: parsed.data,
    });

    published();
    return { success: "Video saved." };
  }

  const newId = await createVideo(parsed.data);
  if (!newId) return { error: "Could not create the video. Please try again." };

  await writeAudit({
    actor: session,
    entity: "videos",
    entityId: newId,
    action: "create",
    after: parsed.data,
  });

  published();
  return {
    success: parsed.data.active
      ? "Video published. It will appear on the homepage now."
      : 'Video saved as inactive. Tick "Show on the site" to publish it.',
  };
}

export async function toggleVideoAction(formData: FormData): Promise<void> {
  const session = await requireAdmin({ checkRevoked: true });

  const parsed = idSchema.safeParse(formData.get("id"));
  if (!parsed.success) return;

  const before = await getVideo(parsed.data);
  if (!before) return;

  const ok = await updateVideo(parsed.data, {
    title: before.title,
    description: before.description,
    youtubeUrl: before.youtubeUrl,
    order: before.order,
    active: !before.active,
  });

  if (!ok) return;

  await writeAudit({
    actor: session,
    entity: "videos",
    entityId: parsed.data,
    action: "update",
    before: { active: before.active },
    after: { active: !before.active },
  });

  published();
}

export async function deleteVideoAction(formData: FormData): Promise<void> {
  const session = await requireAdmin({ checkRevoked: true });

  const parsed = idSchema.safeParse(formData.get("id"));
  if (!parsed.success) return;

  const before = await getVideo(parsed.data);
  const ok = await deleteVideo(parsed.data);
  if (!ok) return;

  await writeAudit({
    actor: session,
    entity: "videos",
    entityId: parsed.data,
    action: "delete",
    before,
  });

  published();
}
