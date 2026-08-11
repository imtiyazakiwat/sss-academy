"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireAdmin } from "@/lib/admin/auth";
import { writeAudit } from "@/lib/admin/audit";
import {
  addReply,
  getEnquiry,
  replySchema,
  setEnquiryStatus,
  statusSchema,
  type DeliveryStatus,
} from "@/lib/cms/enquiries";
import { isMailConfigured, sendMail } from "@/lib/mail";
import { contact } from "@/content/site";
import { adminReplyTemplate } from "@/lib/email-templates";

/**
 * Every action here follows the same order: authorize, validate, write, audit,
 * revalidate. `checkRevoked: true` costs a round trip to Google and is worth it
 * on a mutation — a sacked staff member's cookie stops working immediately
 * rather than at the end of its five days.
 */

const idSchema = z.string().trim().min(1).max(200).refine(
  (v) => !v.includes("/"),
  "Invalid document ID",
);

export interface ActionState {
  error?: string;
  success?: string;
}

export async function updateStatusAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await requireAdmin({ checkRevoked: true });

  const parsed = z
    .object({ id: idSchema, status: statusSchema })
    .safeParse({ id: formData.get("id"), status: formData.get("status") });

  if (!parsed.success) return { error: "That status is not valid." };

  const before = await getEnquiry(parsed.data.id);
  if (!before) return { error: "That enquiry no longer exists." };
  if (before.status === parsed.data.status) return {};

  const ok = await setEnquiryStatus(parsed.data.id, parsed.data.status);
  if (!ok) return { error: "Could not save the status. Please try again." };

  await writeAudit({
    actor: session,
    entity: "enquiries",
    entityId: parsed.data.id,
    action: "update",
    before: { status: before.status },
    after: { status: parsed.data.status },
  });

  revalidatePath("/admin/enquiries");
  revalidatePath(`/admin/enquiries/${parsed.data.id}`);
  revalidatePath("/admin");

  return { success: `Moved to ${parsed.data.status}.` };
}

export async function addReplyAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await requireAdmin({ checkRevoked: true });

  const parsed = z
    .object({ id: idSchema })
    .and(replySchema)
    .safeParse({
      id: formData.get("id"),
      body: formData.get("body"),
      channel: formData.get("channel"),
    });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the form." };
  }

  const enquiry = await getEnquiry(parsed.data.id);
  if (!enquiry) return { error: "That enquiry no longer exists." };

  // Persist first, send second. A mail failure must never lose what someone
  // typed, so delivery is recorded as state on a saved document rather than
  // being a precondition for saving it.
  let deliveryStatus: DeliveryStatus =
    parsed.data.channel === "email" ? "pending" : "not-sent";
  let notice: string | null = null;

  if (parsed.data.channel === "email") {
    if (!isMailConfigured()) {
      deliveryStatus = "not-sent";
      notice =
        "Saved as log. SMTP credentials are not configured yet (set SMTP_USER & SMTP_PASS in environment).";
    } else {
      const template = adminReplyTemplate({
        userName: enquiry.name || "Student",
        replyBody: parsed.data.body,
        adminName: session.name,
        courseName: enquiry.course,
      });

      const result = await sendMail({
        to: enquiry.email,
        subject: template.subject,
        body: template.text,
        html: template.html,
        replyTo: contact.email,
      });
      deliveryStatus = result.ok ? "sent" : "failed";
      if (!result.ok) {
        notice = `Saved, but email delivery failed: ${result.error}`;
      } else {
        notice = `Email sent successfully to ${enquiry.email}.`;
      }
    }
  }

  const replyId = await addReply(parsed.data.id, {
    body: parsed.data.body,
    channel: parsed.data.channel,
    authorUid: session.uid,
    authorName: session.name,
    deliveryStatus,
  });

  if (!replyId) return { error: "Could not save that. Please try again." };

  // A reply is progress; a private note is not. Only the former moves the
  // enquiry along, and never backwards out of `closed`.
  if (parsed.data.channel !== "note" && enquiry.status !== "closed") {
    await setEnquiryStatus(parsed.data.id, "replied");
  }

  await writeAudit({
    actor: session,
    entity: "enquiries/replies",
    entityId: `${parsed.data.id}/${replyId}`,
    action: "create",
    after: { channel: parsed.data.channel, deliveryStatus },
  });

  revalidatePath("/admin/enquiries");
  revalidatePath(`/admin/enquiries/${parsed.data.id}`);
  revalidatePath("/admin");

  return {
    success:
      notice ??
      (parsed.data.channel === "note" ? "Note added." : "Reply logged."),
  };
}
