"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";

import { writeAudit } from "@/lib/admin/audit";
import { requireAdmin } from "@/lib/admin/auth";
import { TEAM_TAG } from "@/lib/admin/tags";
import {
  createTeamMember,
  deleteTeamMember,
  getTeamMember,
  parseList,
  seedTeam,
  teamSchema,
  updateTeamMember,
} from "@/lib/cms/team";

export interface TeamState {
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
    name: formData.get("name"),
    role: formData.get("role"),
    photo: formData.get("photo") ?? "",
    bio: formData.get("bio") ?? "",
    tags: parseList(String(formData.get("tags") ?? "")),
    expertise: parseList(String(formData.get("expertise") ?? "")),
    order: Number.parseInt(String(formData.get("order") ?? "0"), 10) || 0,
    isFounder: formData.get("isFounder") === "on",
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
  revalidateTag(TEAM_TAG);
  revalidatePath("/about");
  revalidatePath("/");
  revalidatePath("/admin/team");
  revalidatePath("/admin");
}

export async function saveTeamAction(
  _previous: TeamState,
  formData: FormData,
): Promise<TeamState> {
  const session = await requireAdmin({ checkRevoked: true });

  const rawId = formData.get("id");
  const id = typeof rawId === "string" && rawId
    ? idSchema.safeParse(rawId).success ? rawId.trim() : null
    : null;

  const parsed = teamSchema.safeParse(readForm(formData));
  if (!parsed.success) {
    return {
      error: "Please check the highlighted fields.",
      fieldErrors: toFieldErrors(parsed.error),
    };
  }

  if (id) {
    const before = await getTeamMember(id);
    if (!before) return { error: "That member no longer exists." };

    const ok = await updateTeamMember(id, parsed.data);
    if (!ok) return { error: "Could not save. Please try again." };

    await writeAudit({
      actor: session,
      entity: "team",
      entityId: id,
      action: "update",
      before,
      after: parsed.data,
    });

    published();
    return { success: "Member saved." };
  }

  const newId = await createTeamMember(parsed.data);
  if (!newId) return { error: "Could not add the member. Please try again." };

  await writeAudit({
    actor: session,
    entity: "team",
    entityId: newId,
    action: "create",
    after: parsed.data,
  });

  published();
  return {
    success: parsed.data.published
      ? `${parsed.data.name} is now visible on the site.`
      : `${parsed.data.name} saved as hidden.`,
  };
}

export async function toggleTeamAction(formData: FormData): Promise<void> {
  const session = await requireAdmin({ checkRevoked: true });

  const parsed = idSchema.safeParse(formData.get("id"));
  if (!parsed.success) return;

  const before = await getTeamMember(parsed.data);
  if (!before) return;

  const ok = await updateTeamMember(parsed.data, {
    name: before.name,
    role: before.role,
    photo: before.photo,
    bio: before.bio,
    tags: before.tags,
    expertise: before.expertise,
    order: before.order,
    isFounder: before.isFounder,
    published: !before.published,
  });

  if (!ok) return;

  await writeAudit({
    actor: session,
    entity: "team",
    entityId: parsed.data,
    action: "update",
    before: { published: before.published },
    after: { published: !before.published },
  });

  published();
}

export async function deleteTeamAction(formData: FormData): Promise<void> {
  const session = await requireAdmin({ checkRevoked: true });

  const parsed = idSchema.safeParse(formData.get("id"));
  if (!parsed.success) return;

  const before = await getTeamMember(parsed.data);
  const ok = await deleteTeamMember(parsed.data);
  if (!ok) return;

  await writeAudit({
    actor: session,
    entity: "team",
    entityId: parsed.data,
    action: "delete",
    before,
  });

  published();
}

export async function seedTeamAction(): Promise<void> {
  const session = await requireAdmin({ checkRevoked: true });

  const count = await seedTeam();
  if (count === null || count === 0) return;

  await writeAudit({
    actor: session,
    entity: "team",
    entityId: "*",
    action: "create",
    after: { imported: count },
  });

  published();
}
