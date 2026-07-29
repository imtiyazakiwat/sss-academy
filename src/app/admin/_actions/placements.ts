"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";

import { writeAudit } from "@/lib/admin/audit";
import { requireAdmin } from "@/lib/admin/auth";
import { PLACEMENTS_TAG } from "@/lib/admin/tags";
import {
  createPlacement,
  deletePlacement,
  getPlacement,
  placementSchema,
  seedPlacements,
  updatePlacement,
} from "@/lib/cms/placements";

/**
 * Placement stories publish immediately, gated only by the `published` flag.
 *
 * `revalidateTag` is what makes an edit visible: the public loader has no
 * time-based expiry, so without it the site would serve the cached list until
 * something else happened to bust it.
 */

export interface PlacementState {
  error?: string;
  success?: string;
  fieldErrors?: Record<string, string>;
}

const idSchema = z.string().trim().min(1).max(200);

function readNumber(value: FormDataEntryValue | null): number | undefined {
  const text = String(value ?? "").trim();
  if (!text) return undefined;
  const parsed = Number.parseFloat(text);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function readForm(formData: FormData) {
  return {
    name: formData.get("name"),
    role: formData.get("role"),
    packageLpa: readNumber(formData.get("packageLpa")),
    company: formData.get("company") ?? "",
    location: formData.get("location") ?? "",
    quote: formData.get("quote") ?? "",
    order: Number.parseInt(String(formData.get("order") ?? "0"), 10) || 0,
    published: formData.get("published") === "on",
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
  revalidateTag(PLACEMENTS_TAG);
  revalidatePath("/placements");
  revalidatePath("/admin/placements");
  revalidatePath("/admin");
}

export async function savePlacementAction(
  _previous: PlacementState,
  formData: FormData,
): Promise<PlacementState> {
  const session = await requireAdmin({ checkRevoked: true });

  const rawId = formData.get("id");
  const id = typeof rawId === "string" && rawId ? rawId : null;

  const parsed = placementSchema.safeParse(readForm(formData));
  if (!parsed.success) {
    return {
      error: "Please check the highlighted fields.",
      fieldErrors: toFieldErrors(parsed.error),
    };
  }

  if (id) {
    const before = await getPlacement(id);
    if (!before) return { error: "That story no longer exists." };

    const ok = await updatePlacement(id, parsed.data);
    if (!ok) return { error: "Could not save. Please try again." };

    await writeAudit({
      actor: session,
      entity: "placements",
      entityId: id,
      action: "update",
      before,
      after: parsed.data,
    });

    published();
    return { success: "Story saved." };
  }

  const newId = await createPlacement(parsed.data);
  if (!newId) return { error: "Could not add the story. Please try again." };

  await writeAudit({
    actor: session,
    entity: "placements",
    entityId: newId,
    action: "create",
    after: parsed.data,
  });

  published();
  return {
    success: parsed.data.published
      ? `${parsed.data.name} is live on the placements page now.`
      : `${parsed.data.name} saved as hidden. Tick “Show on the site” to publish.`,
  };
}

export async function togglePlacementAction(formData: FormData): Promise<void> {
  const session = await requireAdmin({ checkRevoked: true });

  const parsed = idSchema.safeParse(formData.get("id"));
  if (!parsed.success) return;

  const before = await getPlacement(parsed.data);
  if (!before) return;

  const ok = await updatePlacement(parsed.data, {
    name: before.name,
    role: before.role,
    packageLpa: before.packageLpa,
    company: before.company,
    location: before.location ?? "",
    quote: before.quote,
    order: before.order,
    published: !before.published,
  });

  if (!ok) return;

  await writeAudit({
    actor: session,
    entity: "placements",
    entityId: parsed.data,
    action: "update",
    before: { published: before.published },
    after: { published: !before.published },
  });

  published();
}

export async function deletePlacementAction(formData: FormData): Promise<void> {
  const session = await requireAdmin({ checkRevoked: true });

  const parsed = idSchema.safeParse(formData.get("id"));
  if (!parsed.success) return;

  const before = await getPlacement(parsed.data);
  const ok = await deletePlacement(parsed.data);
  if (!ok) return;

  await writeAudit({
    actor: session,
    entity: "placements",
    entityId: parsed.data,
    action: "delete",
    before,
  });

  published();
}

/**
 * Copies the stories currently hardcoded in `content/placements.ts` into
 * Firestore so they can be edited. Deliberately manual and one-way: it is a
 * no-op once the collection has anything in it.
 */
export async function seedPlacementsAction(): Promise<void> {
  const session = await requireAdmin({ checkRevoked: true });

  const count = await seedPlacements();
  if (count === null || count === 0) return;

  await writeAudit({
    actor: session,
    entity: "placements",
    entityId: "*",
    action: "create",
    after: { imported: count },
  });

  published();
}
