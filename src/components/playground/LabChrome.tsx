"use client";

import type { ReactNode } from "react";

import type { Lab } from "@/content/labs";
import { cn } from "@/lib/cn";

/**
 * Shared lab furniture: the framing card and the header block.
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
        "overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]",
        className,
      )}
    >
      {title ? (
        <header className="flex flex-wrap items-center gap-x-4 gap-y-1.5 border-b border-white/8 px-4 py-2.5">
          <div className="min-w-0 flex-1">
            <h2 className="text-[0.9375rem] font-semibold text-white">{title}</h2>
            {subtitle ? (
              <p className="mt-0.5 text-xs leading-relaxed text-ink-400">{subtitle}</p>
            ) : null}
          </div>
          {actions ? <div className="flex items-center gap-1.5">{actions}</div> : null}
        </header>
      ) : null}
      <div className={cn("p-4", bodyClassName)}>{children}</div>
    </section>
  );
}

export function LabIntro({ lab }: { lab: Lab }) {
  return (
    <div className="space-y-4">
      <p className="max-w-3xl text-[0.9375rem] leading-relaxed text-ink-200">
        {lab.summary}
      </p>

      <ul className="grid gap-2.5 sm:grid-cols-3">
        {lab.points.map((point, index) => (
          <li
            key={point}
            className="rounded-xl border border-white/8 bg-white/[0.03] p-3.5"
          >
            <span className="font-mono text-[0.6875rem] text-violet-300">
              {String(index + 1).padStart(2, "0")}
            </span>
            <p className="mt-1.5 text-[0.8125rem] leading-relaxed text-ink-200">
              {point}
            </p>
          </li>
        ))}
      </ul>

      {lab.engineNote ? (
        <div className="flex gap-2.5 rounded-xl border border-amber-400/30 bg-amber-400/8 px-4 py-3">
          <span aria-hidden="true" className="mt-1.5 size-1.5 shrink-0 rounded-full bg-amber-300" />
          <p className="text-[0.8125rem] leading-relaxed text-amber-100">
            <span className="font-medium">Engine note. </span>
            {lab.engineNote}
          </p>
        </div>
      ) : null}
    </div>
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
        "inline-flex h-8 items-center gap-1.5 rounded-full px-3.5 text-[0.8125rem] font-medium transition-colors disabled:opacity-50",
        tone === "primary" && "bg-ember-600 text-white hover:bg-ember-700",
        tone === "danger" &&
          "border border-ember-500/45 text-ember-100 hover:bg-ember-500/15",
        tone === "neutral" &&
          "border border-white/15 text-ink-200 hover:border-white/30 hover:text-white",
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
    <div className="rounded-xl border border-white/8 bg-white/[0.03] px-3.5 py-3">
      <p className="text-[0.6875rem] uppercase tracking-[0.08em] text-ink-500">
        {label}
      </p>
      <p
        className={cn(
          "mt-1 font-mono text-xl tabular-nums",
          tone === "neutral" && "text-white",
          tone === "good" && "text-mint-100",
          tone === "bad" && "text-ember-200",
          tone === "warn" && "text-amber-200",
        )}
      >
        {typeof value === "number" ? value.toLocaleString("en-IN") : value}
      </p>
      {hint ? <p className="mt-0.5 text-[0.6875rem] text-ink-400">{hint}</p> : null}
    </div>
  );
}
