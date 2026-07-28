"use client";

import { useEffect, useId, useRef, useState } from "react";

import { ArrowIcon, Button } from "@/components/ui/Button";
import { courses } from "@/content/courses";
import { contact } from "@/content/site";
import { cn } from "@/lib/cn";
import {
  FIELD_LIMITS,
  enquirySchema,
  type EnquiryResponse,
} from "@/lib/enquiry";

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
  const successRef = useRef<HTMLDivElement>(null);
  const errorRef = useRef<HTMLDivElement>(null);
  const [values, setValues] = useState({ ...EMPTY, course: defaultCourse });
  const [company, setCompany] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<Status>("idle");
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (status === "success") successRef.current?.focus();
    if (status === "error" && formError) errorRef.current?.focus();
  }, [formError, status]);

  const set = (field: keyof typeof EMPTY) => (value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
    if (errors[field]) {
      setErrors((current) => ({ ...current, [field]: "" }));
    }
  };

  const describedBy = (field: string, hasHint = false) => {
    const ids = [
      hasHint ? `${uid}-${field}-hint` : "",
      errors[field] ? `${uid}-${field}-error` : "",
    ].filter(Boolean);
    return ids.length ? ids.join(" ") : undefined;
  };

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    setErrors({});

    const parsed = enquirySchema.safeParse(values);
    if (!parsed.success) {
      const next: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0] ?? "form");
        if (!next[key]) next[key] = issue.message;
      }
      setErrors(next);
      document.getElementById(`${uid}-${Object.keys(next)[0]}`)?.focus();
      return;
    }

    setStatus("submitting");
    try {
      const response = await fetch("/api/enquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...parsed.data, company }),
      });

      let data: EnquiryResponse | null = null;
      try {
        data = (await response.json()) as EnquiryResponse;
      } catch {
        // Proxies and hosting errors sometimes return HTML instead of JSON.
      }

      if (response.ok && data?.ok) {
        setStatus("success");
        setValues({ ...EMPTY, course: defaultCourse });
        setCompany("");
        return;
      }

      setStatus("error");
      if (data && !data.ok) {
        setFormError(data.error);
        if (data.fieldErrors) setErrors(data.fieldErrors);
      } else {
        setFormError(
          response.status === 429
            ? "You have sent a few enquiries recently. Please wait one minute and try again."
            : `We could not send this right now. Call ${contact.phones[0]} and we will help you directly.`,
        );
      }
    } catch {
      setStatus("error");
      setFormError(
        `You appear to be offline. Call ${contact.phones[0]} and we will help you directly.`,
      );
    }
  }

  if (status === "success") {
    return (
      <div
        ref={successRef}
        tabIndex={-1}
        className={cn(
          "border-l-4 border-mint-600 bg-[#f0f5f1] px-6 py-7 outline-none sm:px-8 sm:py-9",
          className,
        )}
        role="status"
      >
        <div className="flex items-start gap-4">
          <span className="mt-0.5 grid size-10 shrink-0 place-items-center rounded-full bg-navy-900 text-white">
            <CheckIcon />
          </span>
          <div>
            <p className="font-mono text-[0.625rem] font-semibold tracking-[0.16em] text-mint-700 uppercase">
              Message delivered
            </p>
            <h3 className="text-title mt-2 text-navy-950">
              We&apos;ll call you shortly.
            </h3>
            <p className="mt-2 max-w-lg text-sm leading-6 text-ink-600">
              Your enquiry is with our counselling team. We usually respond
              within one working day. For anything urgent, call{" "}
              <a
                className="font-semibold text-ember-700 underline decoration-ember-300 underline-offset-4"
                href={`tel:${contact.phoneHrefs[0]}`}
              >
                {contact.phones[0]}
              </a>
              .
            </p>
            <Button
              variant="ghost"
              size="sm"
              className="mt-5"
              onClick={() => setStatus("idle")}
            >
              Send another enquiry
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const busy = status === "submitting";

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      aria-busy={busy}
      className={cn("flex flex-col", className)}
    >


      {formError ? (
        <div
          ref={errorRef}
          tabIndex={-1}
          role="alert"
          className="mb-6 border-l-4 border-ember-600 bg-ember-50 px-4 py-3 text-sm leading-6 text-ember-900 outline-none"
        >
          {formError}
        </div>
      ) : null}

      <div className="grid gap-x-5 gap-y-6 sm:grid-cols-2">
        <Field id={`${uid}-name`} label="Full name" error={errors.name}>
          <input
            id={`${uid}-name`}
            name="name"
            type="text"
            required
            autoComplete="name"
            maxLength={FIELD_LIMITS.name}
            value={values.name}
            onChange={(event) => set("name")(event.target.value)}
            aria-invalid={Boolean(errors.name)}
            aria-describedby={describedBy("name")}
            className={inputClass(Boolean(errors.name))}
            placeholder="e.g. Priya Patil"
          />
        </Field>

        <Field
          id={`${uid}-phone`}
          label="Mobile number"
          error={errors.phone}
        >
          <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center border-r border-ink-200 px-3.5 text-sm font-medium text-ink-500">
              +91
            </span>
            <input
              id={`${uid}-phone`}
              name="phone"
              type="tel"
              required
              inputMode="numeric"
              autoComplete="tel-national"
              maxLength={14}
              value={values.phone}
              onChange={(event) => {
                let digits = event.target.value.replace(/\D/g, "");
                if (digits.length > 10 && digits.startsWith("91")) {
                  digits = digits.slice(2);
                }
                set("phone")(digits.slice(0, 10));
              }}
              aria-invalid={Boolean(errors.phone)}
              aria-describedby={describedBy("phone")}
              className={cn(inputClass(Boolean(errors.phone)), "pl-[4.25rem]")}
              placeholder="98765 43210"
            />
          </div>
        </Field>

        <Field id={`${uid}-email`} label="Email address" error={errors.email}>
          <input
            id={`${uid}-email`}
            name="email"
            type="email"
            required
            autoComplete="email"
            maxLength={FIELD_LIMITS.email}
            value={values.email}
            onChange={(event) => set("email")(event.target.value)}
            aria-invalid={Boolean(errors.email)}
            aria-describedby={describedBy("email")}
            className={inputClass(Boolean(errors.email))}
            placeholder="you@example.com"
          />
        </Field>

        <Field
          id={`${uid}-course`}
          label="Course of interest"
          error={errors.course}
        >
          <div className="relative">
            <select
              id={`${uid}-course`}
              name="course"
              value={values.course}
              onChange={(event) => set("course")(event.target.value)}
              aria-invalid={Boolean(errors.course)}
              aria-describedby={describedBy("course")}
              className={cn(
                inputClass(Boolean(errors.course)),
                "appearance-none pr-10",
              )}
            >
              <option value="">I&apos;m not sure — help me choose</option>
              {courses.map((course) => (
                <option key={course.slug} value={course.slug}>
                  {course.title}
                </option>
              ))}
            </select>
            <ChevronIcon />
          </div>
        </Field>
      </div>

      <div className="mt-6">
        <Field
          id={`${uid}-message`}
          label="What are you trying to achieve?"
          error={errors.message}
          hint={`${values.message.length}/${FIELD_LIMITS.message}`}
        >
          <textarea
            id={`${uid}-message`}
            name="message"
            required
            rows={5}
            maxLength={FIELD_LIMITS.message}
            value={values.message}
            onChange={(event) => set("message")(event.target.value)}
            aria-invalid={Boolean(errors.message)}
            aria-describedby={describedBy("message", true)}
            className={cn(
              inputClass(Boolean(errors.message)),
              "min-h-32 resize-y py-3",
            )}
            placeholder="Tell us your background, the role you want, or what you need help deciding."
          />
        </Field>
      </div>

      <div className="absolute -left-[10000px] top-auto h-px w-px overflow-hidden" aria-hidden="true">
        <label htmlFor={`${uid}-company`}>Company website</label>
        <input
          id={`${uid}-company`}
          name="company"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={company}
          onChange={(event) => setCompany(event.target.value)}
        />
      </div>

      <div className="mt-7 flex justify-center border-t border-ink-200 pt-6">
        <Button type="submit" size="lg" disabled={busy} className="sm:min-w-48">
          {busy ? (
            <>
              <SpinnerIcon /> Sending…
            </>
          ) : (
            <>
              Send my enquiry <ArrowIcon />
            </>
          )}
        </Button>
      </div>
    </form>
  );
}

function inputClass(invalid: boolean) {
  return cn(
    "h-12 w-full rounded-lg border bg-[#fffdf8] px-3.5 text-[0.9375rem] text-navy-950 transition-[border-color,box-shadow,background-color] duration-200 outline-none placeholder:text-ink-400/80 hover:border-ink-300 focus:bg-white focus:ring-3",
    invalid
      ? "border-ember-500 focus:border-ember-600 focus:ring-ember-100"
      : "border-ink-300 focus:border-navy-700 focus:ring-navy-100",
  );
}

function Field({
  id,
  label,
  error,
  hint,
  optional = false,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  optional?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="text-sm font-semibold text-navy-900">
          {label}
          {!optional ? (
            <span className="ml-1 text-ember-700" aria-hidden="true">
              *
            </span>
          ) : null}
        </label>
        {optional ? (
          <span className="text-[0.6875rem] text-ink-500">Optional</span>
        ) : hint ? (
          <span
            id={`${id}-hint`}
            className="text-[0.6875rem] text-ink-500"
          >
            {hint}
          </span>
        ) : null}
      </div>
      {children}
      {error ? (
        <p
          id={`${id}-error`}
          role="alert"
          className="flex items-center gap-1.5 text-xs font-medium text-ember-700"
        >
          <span aria-hidden="true">—</span>
          {error}
        </p>
      ) : null}
    </div>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 20 20" className="size-5" aria-hidden="true">
      <path
        d="M4.5 10.5 8 14l7.5-8"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ChevronIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      aria-hidden="true"
      className="pointer-events-none absolute top-1/2 right-3.5 size-4 -translate-y-1/2 text-ink-500"
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
  );
}

function SpinnerIcon() {
  return (
    <svg viewBox="0 0 20 20" className="size-4 animate-spin" aria-hidden="true">
      <circle cx="10" cy="10" r="7" fill="none" stroke="currentColor" strokeOpacity="0.25" strokeWidth="2" />
      <path d="M10 3a7 7 0 0 1 7 7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
