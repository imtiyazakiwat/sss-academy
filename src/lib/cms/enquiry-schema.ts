import { z } from "zod";

/**
 * Enquiry vocabulary and validation — the parts the browser needs.
 *
 * Split out of `enquiries.ts` deliberately. That module is `server-only` and
 * imports `firebase-admin`; the status dropdown and the reply composer are
 * client components that need the same status list and the same schema the
 * server action validates against. Keeping them here means one definition
 * instead of two that can drift, without dragging the admin SDK into the
 * browser bundle.
 *
 * Nothing in this file may import Firebase or anything `server-only`.
 */

export const ENQUIRY_STATUSES = ["new", "open", "replied", "closed"] as const;
export type EnquiryStatus = (typeof ENQUIRY_STATUSES)[number];

export const REPLY_CHANNELS = ["email", "whatsapp", "call", "note"] as const;
export type ReplyChannel = (typeof REPLY_CHANNELS)[number];

export type DeliveryStatus = "pending" | "sent" | "failed" | "not-sent";

export const statusSchema = z.enum(ENQUIRY_STATUSES);
export const channelSchema = z.enum(REPLY_CHANNELS);

export const replySchema = z.object({
  body: z
    .string()
    .trim()
    .min(2, "Write something before saving")
    .max(4000, "Keep it under 4000 characters"),
  channel: channelSchema,
});

export type ReplyInput = z.output<typeof replySchema>;

export const STATUS_LABELS: Record<EnquiryStatus, string> = {
  new: "New",
  open: "Open",
  replied: "Replied",
  closed: "Closed",
};

export const CHANNEL_LABELS: Record<ReplyChannel, string> = {
  note: "Internal note",
  call: "Phone call",
  whatsapp: "WhatsApp",
  email: "Email",
};
