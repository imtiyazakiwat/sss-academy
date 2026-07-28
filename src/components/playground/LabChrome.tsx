"use client";

import { useState, type ReactNode } from "react";

import type { Lab } from "@/content/labs";
import { cn } from "@/lib/cn";

/**
 * Shared lab furniture: the framing card, the header block, and the scroll
 * surface document-style labs live in.
 *
 * Kept small on purpose. The PRD's rule — no walls of text — is enforced here by
 * only ever rendering `lab.points` as short bullets, never a prose blob.
 */
export function Panel({
  title,
  subtitle,
  actions,
  children,
  className,
  bodyClassName,
}: {
  title?: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section
      className={cn(
        "overflow-hidden rounded-2xl border border-pg-line bg-pg-surface",
        className,
      )}
    >
      {title ? (
        <header className="flex flex-wrap items-center gap-x-4 gap-y-1.5 border-b border-pg-line bg-pg-raised px-4 py-2.5">
          <div className="min-w-0 flex-1">
            <h2 className="text-[0.9375rem] font-semibold text-pg-text">{title}</h2>
            {subtitle ? (
              <p className="mt-0.5 text-xs leading-relaxed text-pg-dim">
                {subtitle}
              </p>
            ) : null}
          </div>
          {actions ? (
            <div className="flex items-center gap-1.5">{actions}</div>
          ) : null}
        </header>
      ) : null}
      <div className={cn("p-4", bodyClassName)}>{children}</div>
    </section>
  );
}

/**
 * The scrollport for labs that read as documents rather than applications.
 *
 * The workspace shell hands its centre pane over at a fixed height and does not
 * scroll it, so each lab owns its own overflow. Query labs fill the pane and
 * scroll their columns independently; every other kind wraps in this.
 */
export function LabScroll({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "pg-scroll h-full min-h-0 overflow-y-auto px-4 py-5 sm:px-5",
        className,
      )}
    >
      <div className="space-y-5">{children}</div>
    </div>
  );
}

export function LabIntro({ lab }: { lab: Lab }) {
  return (
    <div className="space-y-4">
      <p className="max-w-3xl text-[0.9375rem] leading-relaxed text-pg-text">
        {lab.summary}
      </p>

      <ul className="grid gap-2.5 sm:grid-cols-3">
        {lab.points.map((point, index) => (
          <li
            key={point}
            className="rounded-xl border border-pg-line bg-pg-raised p-3.5"
          >
            <span className="font-mono text-[0.6875rem] text-pg-gold">
              {String(index + 1).padStart(2, "0")}
            </span>
            <p className="mt-1.5 text-[0.8125rem] leading-relaxed text-pg-dim">
              {point}
            </p>
          </li>
        ))}
      </ul>

      {lab.engineNote ? <EngineNote note={lab.engineNote} /> : null}
    </div>
  );
}

function EngineNote({ note }: { note: string }) {
  return (
    <div className="flex gap-2.5 rounded-xl border border-pg-gold/35 bg-pg-gold-soft px-4 py-3">
      <span
        aria-hidden="true"
        className="mt-1.5 size-1.5 shrink-0 rounded-full bg-pg-gold"
      />
      <p className="text-[0.8125rem] leading-relaxed text-pg-text">
        <span className="font-medium text-pg-gold">Engine note. </span>
        {note}
      </p>
    </div>
  );
}

/**
 * Collapsible version of the intro, for labs where the editor should own the
 * top of the pane. Collapsed by default: the brief matters once, the editor
 * matters for the rest of the session.
 */
export function LabBrief({ lab }: { lab: Lab }) {
  const [open, setOpen] = useState(false);

  return (
    <section className="overflow-hidden rounded-xl border border-pg-line bg-pg-raised">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="flex w-full items-center gap-3 px-3.5 py-2.5 text-left transition-colors hover:bg-pg-hover"
      >
        <svg
          viewBox="0 0 16 16"
          aria-hidden="true"
          className={cn(
            "size-3 shrink-0 text-pg-faint transition-transform duration-200",
            open && "rotate-90",
          )}
        >
          <path
            d="M6 3.5 10.5 8 6 12.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <span className="min-w-0 flex-1">
          <span className="block text-[0.8125rem] font-medium text-pg-text">
            About this lab
          </span>
          {!open ? (
            <span className="mt-0.5 block truncate text-[0.6875rem] text-pg-dim">
              {lab.summary}
            </span>
          ) : null}
        </span>
        <span className="shrink-0 font-mono text-[0.6875rem] text-pg-faint">
          {lab.minutes} min
        </span>
      </button>

      {open ? (
        <div className="animate-pg-fade-in border-t border-pg-line p-3.5">
          <LabIntro lab={lab} />
        </div>
      ) : null}
    </section>
  );
}

/** Small pill button used for lab-local actions. */
export function PillButton({
  children,
  onClick,
  disabled,
  tone = "neutral",
  title,
  className,
}: {
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  tone?: "neutral" | "primary" | "danger";
  title?: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={cn(
        "inline-flex h-8 items-center gap-1.5 rounded-full px-3.5 text-[0.8125rem] font-medium transition-[background-color,border-color,color,transform] duration-200 active:translate-y-px disabled:opacity-50 disabled:active:translate-y-0",
        tone === "primary" &&
          "bg-pg-primary text-pg-on-primary hover:bg-pg-primary-hover",
        tone === "danger" &&
          "border border-pg-rose/50 text-pg-rose hover:bg-pg-rose-soft",
        tone === "neutral" &&
          "border border-pg-line text-pg-dim hover:border-pg-line-strong hover:text-pg-text",
        className,
      )}
    >
      {children}
    </button>
  );
}

/** Labelled metric, used across the pipeline, validation and SCD labs. */
export function Stat({
  label,
  value,
  tone = "neutral",
  hint,
}: {
  label: string;
  value: string | number;
  tone?: "neutral" | "good" | "bad" | "warn";
  hint?: string;
}) {
  return (
    <div className="rounded-xl border border-pg-line bg-pg-raised px-3.5 py-3">
      <p className="text-[0.6875rem] tracking-[0.08em] text-pg-faint uppercase">
        {label}
      </p>
      <p
        className={cn(
          "mt-1 font-mono text-xl tabular-nums",
          tone === "neutral" && "text-pg-text",
          tone === "good" && "text-pg-sky",
          tone === "bad" && "text-pg-rose",
          tone === "warn" && "text-pg-gold",
        )}
      >
        {typeof value === "number" ? value.toLocaleString("en-IN") : value}
      </p>
      {hint ? <p className="mt-0.5 text-[0.6875rem] text-pg-faint">{hint}</p> : null}
    </div>
  );
}
