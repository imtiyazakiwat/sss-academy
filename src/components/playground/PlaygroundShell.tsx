"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, type ReactNode } from "react";

import { Console } from "@/components/playground/Console";
import { useDb, type DockTab } from "@/components/playground/DbProvider";
import { Quiz } from "@/components/playground/Quiz";
import { ResultTable } from "@/components/playground/ResultTable";
import { adjacentLabs, labGroups, type Lab } from "@/content/labs";
import { durationLabel, getCourse } from "@/content/courses";
import { cn } from "@/lib/cn";

const DOCK_TABS: { id: DockTab; label: string }[] = [
  { id: "result", label: "Result" },
  { id: "console", label: "Console" },
  { id: "quiz", label: "Quiz" },
  { id: "notes", label: "Notes" },
];

/**
 * The application chrome every lab renders inside: lab rail, header with the
 * course cross-link and job controls, the lab body, and the bottom dock.
 *
 * `data-playground-shell` is what lets globals.css hide the marketing footer and
 * mobile CTA bar for this route. A nested layout cannot remove nodes the root
 * layout rendered, and duplicating the root layout to make one full-height page
 * would have been a much worse trade.
 */
export function PlaygroundShell({
  lab,
  children,
}: {
  lab: Lab;
  children: ReactNode;
}) {
  const router = useRouter();
  const { status, error, dockTab, setDockTab, outcome, reset, resetting } = useDb();
  const [dockOpen, setDockOpen] = useState(true);
  const [present, setPresent] = useState(false);
  const [railOpen, setRailOpen] = useState(false);

  const course = getCourse(lab.courseSlug);
  const { prev, next } = adjacentLabs(lab.slug);

  const go = useCallback(
    (target: Lab | undefined) => {
      if (target) router.push(`/playground/${target.slug}`);
    },
    [router],
  );

  // Presentation shortcuts. Scoped to presentation mode so they never steal
  // arrow keys from the editor or a select during normal use.
  useEffect(() => {
    if (!present) return;

    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "TEXTAREA" ||
          target.tagName === "INPUT" ||
          target.isContentEditable)
      ) {
        return;
      }
      if (event.key === "ArrowRight") go(next);
      else if (event.key === "ArrowLeft") go(prev);
      else if (event.key === "Escape") setPresent(false);
      else if (event.key.toLowerCase() === "n") setDockTab("notes");
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [present, next, prev, go, setDockTab]);

  return (
    <div
      data-playground-shell=""
      className={cn(
        "flex h-[calc(100dvh-var(--header-h))] flex-col bg-navy-950 text-ink-100",
        present && "fixed inset-0 z-50 h-dvh",
      )}
    >
      <div className="flex min-h-0 flex-1">
        {/* Lab rail */}
        <aside
          className={cn(
            "w-60 shrink-0 flex-col overflow-y-auto border-r border-white/8 bg-navy-950/80 px-3 py-4",
            present ? "hidden" : "hidden lg:flex",
          )}
        >
          <LabRail activeSlug={lab.slug} />
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          {/* Header */}
          <header className="shrink-0 border-b border-white/8 bg-navy-950/90 px-4 py-3 backdrop-blur sm:px-5">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <button
                type="button"
                onClick={() => setRailOpen((open) => !open)}
                aria-expanded={railOpen}
                className="rounded-full border border-white/15 px-3 py-1 text-xs text-ink-300 transition-colors hover:border-white/30 hover:text-white lg:hidden"
              >
                {railOpen ? "Hide labs" : "All labs"}
              </button>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  {course ? (
                    <Link
                      href={`/courses/${course.slug}`}
                      className="text-eyebrow truncate uppercase text-violet-300 transition-colors hover:text-violet-200"
                    >
                      {course.title}
                    </Link>
                  ) : null}
                  <span className="text-[0.6875rem] text-ink-500">
                    {lab.minutes} min
                  </span>
                </div>
                <h1
                  className={cn(
                    "mt-0.5 truncate font-semibold tracking-[-0.02em] text-white",
                    present ? "text-2xl" : "text-lg",
                  )}
                >
                  {lab.title}
                </h1>
              </div>

              <div className="flex items-center gap-1.5">
                <StatusPill status={status} />

                <button
                  type="button"
                  onClick={reset}
                  disabled={resetting || status !== "ready"}
                  title="Restore every table to its seeded state"
                  className="rounded-full border border-white/15 px-3 py-1.5 text-xs font-medium text-ink-200 transition-colors hover:border-white/30 hover:text-white disabled:opacity-50"
                >
                  {resetting ? "Resetting…" : "Reset DB"}
                </button>

                <button
                  type="button"
                  onClick={() => setPresent((on) => !on)}
                  aria-pressed={present}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                    present
                      ? "border-ember-500/60 bg-ember-500/15 text-ember-100"
                      : "border-white/15 text-ink-200 hover:border-white/30 hover:text-white",
                  )}
                >
                  {present ? "Exit present" : "Present"}
                </button>

                <div className="ml-1 flex items-center gap-1">
                  <NavArrow
                    direction="prev"
                    label={prev?.title}
                    onClick={() => go(prev)}
                    disabled={!prev}
                  />
                  <NavArrow
                    direction="next"
                    label={next?.title}
                    onClick={() => go(next)}
                    disabled={!next}
                  />
                </div>
              </div>
            </div>

            {present ? (
              <p className="mt-2 font-mono text-[0.6875rem] text-ink-500">
                ← → move between labs · N opens teacher notes · Esc exits
              </p>
            ) : null}
          </header>

          {/* Mobile rail */}
          {railOpen ? (
            <div className="max-h-72 overflow-y-auto border-b border-white/8 bg-navy-900 px-3 py-3 lg:hidden">
              <LabRail activeSlug={lab.slug} onNavigate={() => setRailOpen(false)} />
            </div>
          ) : null}

          {/* Lab body */}
          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-5">
            {status === "error" ? (
              <div
                role="alert"
                className="mx-auto max-w-xl rounded-2xl border border-ember-500/40 bg-ember-500/10 p-5"
              >
                <h2 className="font-semibold text-white">
                  The SQLite engine could not start
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-ember-100">{error}</p>
                <p className="mt-3 text-xs leading-relaxed text-ink-300">
                  The playground needs WebAssembly. If this is a fresh checkout, run
                  <code className="mx-1 rounded bg-white/10 px-1.5 py-0.5 font-mono">
                    npm install
                  </code>
                  so the runtime is copied into public/sql, then reload.
                </p>
              </div>
            ) : (
              <div className={cn(present && "mx-auto max-w-5xl text-[1.05rem]")}>
                {children}
              </div>
            )}
          </div>

          {/* Bottom dock */}
          <div className="shrink-0 border-t border-white/8 bg-navy-950/95">
            <div className="flex items-center gap-1 px-3 py-1.5">
              {DOCK_TABS.map((tab) => {
                const active = dockTab === tab.id && dockOpen;
                const badge =
                  tab.id === "quiz" ? lab.quiz?.length : undefined;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => {
                      setDockTab(tab.id);
                      setDockOpen(true);
                    }}
                    aria-pressed={active}
                    className={cn(
                      "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                      active
                        ? "bg-white/10 text-white"
                        : "text-ink-400 hover:bg-white/5 hover:text-ink-100",
                    )}
                  >
                    {tab.label}
                    {badge ? (
                      <span className="ml-1.5 font-mono text-[0.625rem] text-ink-500">
                        {badge}
                      </span>
                    ) : null}
                  </button>
                );
              })}

              <button
                type="button"
                onClick={() => setDockOpen((open) => !open)}
                aria-expanded={dockOpen}
                className="ml-auto rounded-full px-2.5 py-1 text-xs text-ink-400 transition-colors hover:text-white"
              >
                {dockOpen ? "Collapse" : "Expand"}
              </button>
            </div>

            {dockOpen ? (
              <div className="h-56 overflow-y-auto border-t border-white/8 px-4 py-3 sm:h-64">
                {dockTab === "result" ? (
                  <ResultTable
                    set={outcome?.sets[0] ?? null}
                    error={outcome?.error}
                    empty="Run something and the rows land here."
                  />
                ) : null}
                {dockTab === "console" ? <Console className="h-full" /> : null}
                {dockTab === "quiz" ? <Quiz questions={lab.quiz ?? []} /> : null}
                {dockTab === "notes" ? (
                  <TeacherNotes lab={lab} courseTitle={course?.title} />
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

function LabRail({
  activeSlug,
  onNavigate,
}: {
  activeSlug: string;
  onNavigate?: () => void;
}) {
  return (
    <nav aria-label="Labs" className="space-y-5">
      <Link
        href="/playground"
        onClick={onNavigate}
        className="flex items-center gap-1.5 text-xs text-ink-400 transition-colors hover:text-white"
      >
        <span aria-hidden="true">←</span> Playground home
      </Link>

      {labGroups.map((group) => (
        <div key={group.course.slug}>
          <p className="text-eyebrow px-2 uppercase text-ink-500">
            {group.course.title}
          </p>
          <ul className="mt-1.5 space-y-0.5">
            {group.labs.map((lab) => {
              const active = lab.slug === activeSlug;
              return (
                <li key={lab.slug}>
                  <Link
                    href={`/playground/${lab.slug}`}
                    onClick={onNavigate}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "block rounded-lg px-2.5 py-1.5 text-[0.8125rem] transition-colors",
                      active
                        ? "bg-violet-500/20 font-medium text-white"
                        : "text-ink-300 hover:bg-white/5 hover:text-white",
                    )}
                  >
                    {lab.short}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

function StatusPill({ status }: { status: "loading" | "ready" | "error" }) {
  const map = {
    loading: { label: "Booting SQLite", className: "bg-amber-400/15 text-amber-100" },
    ready: { label: "SQLite live", className: "bg-mint-500/15 text-mint-100" },
    error: { label: "Engine failed", className: "bg-ember-500/15 text-ember-100" },
  } as const;
  const { label, className } = map[status];

  return (
    <span
      className={cn(
        "hidden items-center gap-1.5 rounded-full px-2.5 py-1 text-[0.6875rem] font-medium sm:inline-flex",
        className,
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "size-1.5 rounded-full",
          status === "ready" && "bg-mint-500",
          status === "loading" && "animate-pulse bg-amber-300",
          status === "error" && "bg-ember-500",
        )}
      />
      {label}
    </span>
  );
}

function NavArrow({
  direction,
  label,
  onClick,
  disabled,
}: {
  direction: "prev" | "next";
  label?: string;
  onClick: () => void;
  disabled: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={label ? `${direction === "prev" ? "Previous" : "Next"}: ${label}` : undefined}
      aria-label={
        label
          ? `${direction === "prev" ? "Previous lab" : "Next lab"}: ${label}`
          : `No ${direction === "prev" ? "previous" : "next"} lab`
      }
      className="flex size-7 items-center justify-center rounded-full border border-white/15 text-ink-300 transition-colors hover:border-white/30 hover:text-white disabled:opacity-35"
    >
      <svg viewBox="0 0 16 16" aria-hidden="true" className="size-3.5">
        <path
          d={direction === "prev" ? "M10 3.5 5.5 8 10 12.5" : "M6 3.5 10.5 8 6 12.5"}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}

function TeacherNotes({ lab, courseTitle }: { lab: Lab; courseTitle?: string }) {
  const course = getCourse(lab.courseSlug);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-eyebrow uppercase text-violet-300">Teaching notes</h2>
        <ul className="mt-2.5 space-y-2">
          {lab.notes.map((note) => (
            <li
              key={note}
              className="flex gap-2.5 text-[0.8125rem] leading-relaxed text-ink-200"
            >
              <span aria-hidden="true" className="mt-2 size-1 shrink-0 rounded-full bg-ember-400" />
              {note}
            </li>
          ))}
        </ul>
      </div>

      <div className="border-t border-white/8 pt-3">
        <h2 className="text-eyebrow uppercase text-ink-500">Syllabus coverage</h2>
        <p className="mt-2 text-[0.8125rem] leading-relaxed text-ink-300">
          {courseTitle ?? lab.courseSlug}
          {course ? ` · ${durationLabel(course.durationMonths)} · ${course.level}` : null}
        </p>
        <ul className="mt-2 flex flex-wrap gap-1.5">
          {lab.topics.map((topic) => (
            <li
              key={topic}
              className="rounded-full bg-white/8 px-2.5 py-1 text-[0.6875rem] text-ink-200"
            >
              {topic}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
