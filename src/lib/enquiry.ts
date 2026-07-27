import { z } from "zod";

import { courses } from "@/content/courses";

const courseSlugs = courses.map((c) => c.slug);

/**
 * Mirrors the legacy PHP form's constraints (name 50, phone 10 digits,
 * email 100, message 500) and adds an optional course of interest.
 * Shared by the client form and the serverless route so validation cannot drift.
 */
export const enquirySchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Please enter your full name")
    .max(50, "Name must be 50 characters or fewer"),
  phone: z
    .string()
    .trim()
    .regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile number"),
  email: z
    .string()
    .trim()
    .max(100, "Email must be 100 characters or fewer")
    .pipe(z.string().email("Enter a valid email address")),
  course: z
    .string()
    .trim()
    .refine((v) => v === "" || courseSlugs.includes(v), "Unknown course")
    .optional()
    .default(""),
  message: z
    .string()
    .trim()
    .min(10, "Tell us a little about what you're looking for")
    .max(500, "Message must be 500 characters or fewer"),
});

export type EnquiryInput = z.input<typeof enquirySchema>;
export type Enquiry = z.output<typeof enquirySchema>;

export type EnquiryResponse =
  | { ok: true; queued: boolean }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

export const FIELD_LIMITS = {
  name: 50,
  phone: 10,
  email: 100,
  message: 500,
} as const;
