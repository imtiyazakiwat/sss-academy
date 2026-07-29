import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

/**
 * Form primitives for the dashboard.
 *
 * Same accessibility contract as the public enquiry form: the label is bound to
 * the control, errors are announced, and `aria-describedby` points at both the
 * hint and the error. Callers set `aria-invalid` on the control itself.
 */

export function inputClass(invalid = false) {
  return cn(
    "h-11 w-full rounded-lg border bg-[#fffdf8] px-3.5 text-[0.9375rem] text-navy-950 transition-[border-color,box-shadow,background-color] duration-200 outline-none placeholder:text-ink-400/80 hover:border-ink-300 focus:bg-white focus:ring-3",
    invalid
      ? "border-ember-500 focus:border-ember-600 focus:ring-ember-100"
      : "border-ink-300 focus:border-navy-700 focus:ring-navy-100",
  );
}

export function Field({
  id,
  label,
  error,
  hint,
  optional = false,
  className,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  hint?: ReactNode;
  optional?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
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
          <span id={`${id}-hint`} className="text-[0.6875rem] text-ink-500">
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

export function describedBy(
  id: string,
  { hint = false, error = false }: { hint?: boolean; error?: boolean },
) {
  const ids = [hint ? `${id}-hint` : "", error ? `${id}-error` : ""].filter(
    Boolean,
  );
  return ids.length ? ids.join(" ") : undefined;
}

export function FormMessage({
  tone,
  children,
}: {
  tone: "error" | "success";
  children: ReactNode;
}) {
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={cn(
        "border-l-4 px-4 py-3 text-sm leading-6",
        tone === "error"
          ? "border-ember-600 bg-ember-50 text-ember-900"
          : "border-mint-600 bg-[#f0f5f1] text-navy-900",
      )}
    >
      {children}
    </div>
  );
}

export function Card({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-ink-200 bg-[#fffdf8] p-5 shadow-subtle sm:p-6",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function AdminPageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-4 border-b border-ink-200 pb-5">
      <div>
        <h1 className="text-headline text-navy-950">{title}</h1>
        {description ? (
          <p className="mt-1.5 max-w-2xl text-sm leading-6 text-ink-600">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </header>
  );
}
