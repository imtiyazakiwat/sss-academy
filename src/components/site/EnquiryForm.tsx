"use client";

import { useId, useState } from "react";

import { ArrowIcon, Button } from "@/components/ui/Button";
import { courses } from "@/content/courses";
import { contact } from "@/content/site";
import {
  FIELD_LIMITS,
  enquirySchema,
  type EnquiryResponse,
} from "@/lib/enquiry";
import { cn } from "@/lib/cn";

type Status = "idle" | "submitting" | "success" | "error";

const EMPTY = { name: "", phone: "", email: "", course: "", message: "" };

export function EnquiryForm({
  defaultCourse = "",
  className,
}: {
  defaultCourse?: string;
  className?: string;
}) {
  const uid = useId();
  const [values, setValues] = useState({ ...EMPTY, course: defaultCourse });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<Status>("idle");
  const [formError, setFormError] = useState<string | null>(null);

  const set = (field: keyof typeof EMPTY) => (value: string) => {
    setValues((v) => ({ ...v, [field]: value }));
    if (errors[field]) setErrors((e) => ({ ...e, [field]: "" }));
  };

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    // Validate client-side with the same schema the route uses.
    const parsed = enquirySchema.safeParse(values);
    if (!parsed.success) {
      const next: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0] ?? "form");
        if (!next[key]) next[key] = issue.message;
      }
      setErrors(next);
      const first = document.getElementById(`${uid}-${Object.keys(next)[0]}`);
      first?.focus();
      return;
    }

    setStatus("submitting");
    try {
      const res = await fetch("/api/enquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...parsed.data, company: "" }),
      });
      const data = (await res.json()) as EnquiryResponse;

      if (data.ok) {
        setStatus("success");
        setValues({ ...EMPTY, course: defaultCourse });
        return;
      }

      setStatus("error");
      setFormError(data.error);
      if (data.fieldErrors) setErrors(data.fieldErrors);
    } catch {
      setStatus("error");
      setFormError(
        `Network error. Please call us on ${contact.phones[0]} and we will help you directly.`,
      );
    }
  }

  if (status === "success") {
    return (
      <div
        className={cn(
          "flex flex-col items-start gap-4 rounded-2xl border border-navy-200 bg-navy-50 p-8",
          className,
        )}
        role="status"
      >
        <span className="flex size-11 items-center justify-center rounded-full bg-navy-900">
          <svg viewBox="0 0 20 20" className="size-5" aria-hidden="true">
            <path
              d="M4.5 10.5l3.5 3.5 7.5-8"
              fill="none"
              stroke="white"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
        <div>
          <h3 className="text-title text-navy-950">Enquiry received</h3>
          <p className="mt-2 text-sm leading-relaxed text-ink-600">
            Thank you for connecting with SSS Academy. Our team will contact you
            shortly. If it is urgent, call us on{" "}
            <a
              className="font-medium text-navy-900 underline decoration-ember-400 decoration-2 underline-offset-2"
              href={`tel:${contact.phoneHrefs[0]}`}
            >
              {contact.phones[0]}
            </a>
            .
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={() => setStatus("idle")}>
          Send another enquiry
        </Button>
      </div>
    );
  }

  const busy = status === "submitting";

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      className={cn("flex flex-col gap-5", className)}
    >
      {formError ? (
        <p
          role="alert"
          className="rounded-xl border border-ember-200 bg-ember-50 px-4 py-3 text-sm text-ember-800"
        >
          {formError}
        </p>
      ) : null}

      <div className="grid gap-5 sm:grid-cols-2">
        <Field
          id={`${uid}-name`}
          label="Full name"
          error={errors.name}
          maxLength={FIELD_LIMITS.name}
        >
          <input
            id={`${uid}-name`}
            name="name"
            type="text"
            autoComplete="name"
            maxLength={FIELD_LIMITS.name}
            value={values.name}
            onChange={(e) => set("name")(e.target.value)}
            aria-invalid={Boolean(errors.name)}
            aria-describedby={errors.name ? `${uid}-name-error` : undefined}
            className={inputClass(Boolean(errors.name))}
            placeholder="Your name"
          />
        </Field>

        <Field
          id={`${uid}-phone`}
          label="Mobile number"
          error={errors.phone}
          hint="10 digits, no country code"
        >
          <input
            id={`${uid}-phone`}
            name="phone"
            type="tel"
            inputMode="numeric"
            autoComplete="tel-national"
            maxLength={FIELD_LIMITS.phone}
            value={values.phone}
            onChange={(e) =>
              set("phone")(e.target.value.replace(/\D/g, "").slice(0, 10))
            }
            aria-invalid={Boolean(errors.phone)}
            aria-describedby={errors.phone ? `${uid}-phone-error` : undefined}
            className={inputClass(Boolean(errors.phone))}
            placeholder="9876543210"
          />
        </Field>
      </div>

      <Field id={`${uid}-email`} label="Email address" error={errors.email}>
        <input
          id={`${uid}-email`}
          name="email"
          type="email"
          autoComplete="email"
          maxLength={FIELD_LIMITS.email}
          value={values.email}
          onChange={(e) => set("email")(e.target.value)}
          aria-invalid={Boolean(errors.email)}
          aria-describedby={errors.email ? `${uid}-email-error` : undefined}
          className={inputClass(Boolean(errors.email))}
          placeholder="you@example.com"
        />
      </Field>

      <Field
        id={`${uid}-course`}
        label="Course of interest"
        error={errors.course}
        optional
      >
        <div className="relative">
          <select
            id={`${uid}-course`}
            name="course"
            value={values.course}
            onChange={(e) => set("course")(e.target.value)}
            className={cn(inputClass(Boolean(errors.course)), "appearance-none pr-10")}
          >
            <option value="">Not sure yet — please advise</option>
            {courses.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.title}
              </option>
            ))}
          </select>
          <svg
            viewBox="0 0 16 16"
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 right-3.5 size-4 -translate-y-1/2 text-ink-400"
          >
            <path
              d="M4 6.5 8 10.5 12 6.5"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </Field>

      <Field
        id={`${uid}-message`}
        label="What would you like to know?"
        error={errors.message}
        hint={`${values.message.length}/${FIELD_LIMITS.message}`}
      >
        <textarea
          id={`${uid}-message`}
          name="message"
          rows={4}
          maxLength={FIELD_LIMITS.message}
          value={values.message}
          onChange={(e) => set("message")(e.target.value)}
          aria-invalid={Boolean(errors.message)}
          aria-describedby={errors.message ? `${uid}-message-error` : undefined}
          className={cn(inputClass(Boolean(errors.message)), "min-h-28 resize-y py-3")}
          placeholder="Your background, the role you're targeting, and when you'd like to start."
        />
      </Field>

      {/* Honeypot — hidden from users and assistive tech, visible to bots. */}
      <div className="hidden" aria-hidden="true">
        <label htmlFor={`${uid}-company`}>Company</label>
        <input
          id={`${uid}-company`}
          name="company"
          type="text"
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Button type="submit" size="lg" disabled={busy}>
          {busy ? "Submitting…" : "Submit enquiry"}
          {busy ? null : <ArrowIcon />}
        </Button>
        <p className="text-xs leading-relaxed text-ink-400">
          We will only use your details to respond to this enquiry.
        </p>
      </div>
    </form>
  );
}

function inputClass(invalid: boolean) {
  return cn(
    "h-12 w-full rounded-xl border bg-white px-4 text-[0.9375rem] text-navy-950 shadow-subtle transition-[border-color,box-shadow] duration-200 outline-none placeholder:text-ink-300",
    invalid
      ? "border-ember-400 focus:border-ember-500 focus:ring-4 focus:ring-ember-100"
      : "border-ink-200 focus:border-navy-400 focus:ring-4 focus:ring-navy-100",
  );
}

function Field({
  id,
  label,
  error,
  hint,
  optional,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  optional?: boolean;
  maxLength?: number;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="text-sm font-medium text-navy-900">
          {label}
          {optional ? (
            <span className="ml-1.5 text-xs font-normal text-ink-400">
              optional
            </span>
          ) : null}
        </label>
        {hint && !error ? (
          <span className="font-mono text-[0.6875rem] text-ink-400">{hint}</span>
        ) : null}
      </div>
      {children}
      {error ? (
        <p id={`${id}-error`} role="alert" className="text-xs text-ember-700">
          {error}
        </p>
      ) : null}
    </div>
  );
}
