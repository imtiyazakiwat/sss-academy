"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";

import { Console } from "@/components/playground/Console";
import { useDb, type DockTab } from "@/components/playground/DbProvider";
import { ThemeToggle } from "@/components/playground/PlaygroundTheme";
import { Quiz } from "@/components/playground/Quiz";
import { ResultPanel } from "@/components/playground/ResultPanel";
import { SchemaMap } from "@/components/playground/SchemaMap";
import { Splitter, useResizable } from "@/components/playground/Splitter";
import { adjacentLabs, labGroups, type Lab } from "@/content/labs";
import { durationLabel, getCourse } from "@/content/courses";
import { quoteIdent } from "@/lib/sqlite";
import { cn } from "@/lib/cn";

const DOCK_TABS: { id: DockTab; label: string }[] = [
  { id: "result", label: "Result" },
  { id: "console", label: "Console" },
  { id: "quiz", label: "Quiz" },
  { id: "notes", label: "Notes" },
];

/**
 * The workspace every lab renders inside.
 *
 * Laid out like an editor rather than a page: a lab rail, a centre stage that
 * switches between the lab and the live schema map, and a dock. Every boundary
 * is a real splitter, and nothing here scrolls as a document — each pane owns
 * its own overflow, which is what stops the editor sliding off-screen when
 * someone goes looking at the data.
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
  const {
    status,
    error,
    dockTab,
    setDockTab,
    outcome,
    reset,
    resetting,
    autoRun,
    setAutoRun,
    loadEditorSql,
    stage,
    setStage,
    run,
  } = useDb();

  const centreRef = useRef<HTMLDivElement>(null);
  const [dockOpen, setDockOpen] = useState(true);
  const [present, setPresent] = useState(false);
  const [railOpen, setRailOpen] = useState(false);

  const course = getCourse(lab.courseSlug);
  const { prev, next } = adjacentLabs(lab.slug);

  const dock = useResizable({
    storageKey: "sss-pg-dock-h",
    initial: 248,
    min: 120,
    max: () => Math.max(160, (centreRef.current?.clientHeight ?? 700) - 220),
    axis: "y",
    invert: true,
  });

  const rail = useResizable({
    storageKey: "sss-pg-rail-w",
    initial: 240,
    min: 168,
    max: 420,
    axis: "x",
  });

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

  const peek = useCallback(
    (table: string) => {
      run(`SELECT * FROM ${quoteIdent(table)} LIMIT 50;`, {
        label: `Peek ${table}`,
      });
    },
    [run],
  );

  return (
    <div
      data-playground-shell=""
      className={cn(
        "flex h-[calc(100dvh-var(--header-h))] flex-col bg-pg-bg text-pg-text",
        present && "fixed inset-0 z-50 h-dvh",
      )}
    >
      <div className="flex min-h-0 flex-1">
        {/* Lab rail */}
        <aside
          style={{ width: rail.size }}
          className={cn(
            "pg-scroll shrink-0 flex-col overflow-y-auto border-r border-pg-line bg-pg-surface px-3 py-4",
            present ? "hidden" : "hidden lg:flex",
          )}
        >
          <LabRail activeSlug={lab.slug} />
        </aside>

        {!present ? (
          <Splitter
            {...rail.handleProps}
            label="Resize the lab list"
            className="hidden lg:block"
          />
        ) : null}

        <div ref={centreRef} className="flex min-w-0 flex-1 flex-col">
          {/* Header */}
          <header className="shrink-0 border-b border-pg-line bg-pg-surface px-4 py-2.5 sm:px-5">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <button
                type="button"
                onClick={() => setRailOpen((open) => !open)}
                aria-expanded={railOpen}
                className="rounded-full border border-pg-line px-3 py-1 text-xs text-pg-dim transition-colors hover:border-pg-line-strong hover:text-pg-text lg:hidden"
              >
                {railOpen ? "Hide labs" : "All labs"}
              </button>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  {course ? (
                    <Link
                      href={`/courses/${course.slug}`}
                      className="text-eyebrow truncate uppercase text-pg-gold transition-colors hover:text-pg-primary"
                    >
                      {course.title}
                    </Link>
                  ) : null}
                  <span className="text-[0.6875rem] text-pg-faint">
                    {lab.minutes} min
                  </span>
                </div>
                <h1
                  className={cn(
                    "mt-0.5 truncate font-semibold tracking-[-0.02em] text-pg-text",
                    present ? "text-2xl" : "text-lg",
                  )}
                >
                  {lab.title}
                </h1>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={reset}
                  disabled={resetting || status !== "ready"}
                  title="Restore every table to its seeded state"
                  className="rounded-full border border-pg-line px-3 py-1.5 text-xs font-medium text-pg-dim transition-colors hover:border-pg-line-strong hover:text-pg-text disabled:opacity-50"
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
                      ? "border-pg-primary bg-pg-primary-soft text-pg-primary"
                      : "border-pg-line text-pg-dim hover:border-pg-line-strong hover:text-pg-text",
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
              <p className="mt-2 font-mono text-[0.6875rem] text-pg-faint">
                ← → move between labs · N opens teacher notes · Esc exits
              </p>
            ) : null}
          </header>

          {/* Mobile rail */}
          {railOpen ? (
            <div className="pg-scroll max-h-72 overflow-y-auto border-b border-pg-line bg-pg-surface px-3 py-3 lg:hidden">
              <LabRail
                activeSlug={lab.slug}
                onNavigate={() => setRailOpen(false)}
              />
            </div>
          ) : null}

          {/* Stage tabs */}
          <div className="flex shrink-0 items-center gap-1 border-b border-pg-line bg-pg-surface px-3">
            <StageTab
              active={stage === "lab"}
              onClick={() => setStage("lab")}
              label={lab.kind === "query" ? "Editor" : "Lab"}
            />
            <StageTab
              active={stage === "map"}
              onClick={() => setStage("map")}
              label="Database map"
            />
            <p className="ml-auto hidden font-mono text-[0.6875rem] text-pg-faint md:block">
              {stage === "map"
                ? "Live schema · drag, zoom, click a table"
                : lab.topics.slice(0, 3).join(" · ")}
            </p>
          </div>

          {/* Stage */}
          <div className="min-h-0 flex-1">
            {status === "error" ? (
              <div className="pg-scroll h-full overflow-y-auto px-4 py-6">
                <div
                  role="alert"
                  className="mx-auto max-w-xl rounded-2xl border border-pg-rose/45 bg-pg-rose-soft p-5"
                >
                  <h2 className="font-semibold text-pg-text">
                    The SQLite engine could not start
                  </h2>
                  <p className="mt-2 text-sm leading-relaxed text-pg-rose">
                    {error}
                  </p>
                  <p className="mt-3 text-xs leading-relaxed text-pg-dim">
                    The playground needs WebAssembly. If this is a fresh
                    checkout, run
                    <code className="mx-1 rounded bg-pg-hover px-1.5 py-0.5 font-mono">
                      npm install
                    </code>
                    so the runtime is copied into public/sql, then reload.
                  </p>
                </div>
              </div>
            ) : stage === "map" ? (
              <SchemaMap
                onQuery={
                  lab.kind === "query"
                    ? (sql) => loadEditorSql(lab.slug, sql)
                    : undefined
                }
                onPeek={peek}
              />
            ) : (
              <div
                className={cn(
                  "h-full min-h-0",
                  present && "mx-auto max-w-6xl text-[1.05rem]",
                )}
              >
                {children}
              </div>
            )}
          </div>

          {/* Dock */}
          {dockOpen ? (
            <Splitter {...dock.handleProps} label="Resize the panel" />
          ) : null}

          <div className="shrink-0 border-t border-pg-line bg-pg-surface">
            <div className="flex items-center gap-1 px-3 py-1.5">
              {DOCK_TABS.map((tab) => {
                const active = dockTab === tab.id && dockOpen;
                const badge = tab.id === "quiz" ? lab.quiz?.length : undefined;
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
                      "relative rounded-full px-3 py-1 text-xs font-medium transition-colors",
                      active
                        ? "bg-pg-hover text-pg-text"
                        : "text-pg-faint hover:bg-pg-hover hover:text-pg-text",
                    )}
                  >
                    {tab.label}
                    {badge ? (
                      <span className="ml-1.5 font-mono text-[0.625rem] text-pg-faint">
                        {badge}
                      </span>
                    ) : null}
                    {active ? (
                      <span
                        aria-hidden="true"
                        className="absolute inset-x-3 -bottom-1 h-0.5 rounded-full bg-pg-primary"
                      />
                    ) : null}
                  </button>
                );
              })}

              <button
                type="button"
                onClick={() => setDockOpen((open) => !open)}
                aria-expanded={dockOpen}
                title={dockOpen ? "Collapse panel" : "Expand panel"}
                className="ml-auto rounded-full px-2.5 py-1 text-xs text-pg-faint transition-colors hover:text-pg-text"
              >
                {dockOpen ? "Collapse" : "Expand"}
              </button>
            </div>

            {dockOpen ? (
              <div
                style={{ height: dock.size }}
                className={cn(
                  "pg-scroll overflow-y-auto border-t border-pg-line px-4 py-3",
                  !dock.dragging && "transition-[height] duration-150",
                )}
              >
                {dockTab === "result" ? (
                  <ResultPanel outcome={outcome} />
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

      {/* Status bar */}
      <footer className="flex shrink-0 items-center gap-3 border-t border-pg-line bg-pg-surface px-3 py-1 text-[0.6875rem]">
        <StatusPill status={status} />

        <button
          type="button"
          onClick={() => setAutoRun(!autoRun)}
          aria-pressed={autoRun}
          title="When on, loading an example or a table runs it immediately"
          className={cn(
            "flex items-center gap-1.5 rounded-full px-2 py-0.5 transition-colors",
            autoRun
              ? "bg-pg-primary-soft text-pg-primary"
              : "text-pg-faint hover:text-pg-text",
          )}
        >
          <span
            aria-hidden="true"
            className={cn(
              "flex h-3 w-5 items-center rounded-full p-px transition-colors",
              autoRun ? "bg-pg-primary" : "bg-pg-line-strong",
            )}
          >
            <span
              className={cn(
                "size-2.5 rounded-full bg-pg-surface transition-transform duration-200",
                autoRun && "translate-x-2",
              )}
            />
          </span>
          Auto-run {autoRun ? "on" : "off"}
        </button>

        <span className="hidden text-pg-faint sm:inline">
          {lab.topics.length} topics
        </span>

        <div className="ml-auto flex items-center gap-2">
          <span className="hidden font-mono text-pg-faint md:inline">
            ⌘↵ run · ⌘/ctrl+scroll zoom
          </span>
          <ThemeToggle className="flex size-6 items-center justify-center rounded-full text-pg-dim transition-colors hover:bg-pg-hover hover:text-pg-text" />
        </div>
      </footer>
    </div>
  );
}

function StageTab({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "relative px-3 py-2 text-[0.8125rem] font-medium transition-colors",
        active ? "text-pg-text" : "text-pg-faint hover:text-pg-dim",
      )}
    >
      {label}
      {active ? (
        <span
          aria-hidden="true"
          className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-pg-primary"
        />
      ) : null}
    </button>
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
        className="flex items-center gap-1.5 text-xs text-pg-dim transition-colors hover:text-pg-text"
      >
        <span aria-hidden="true">←</span> Playground home
      </Link>

      {labGroups.map((group) => (
        <div key={group.course.slug}>
          <p className="text-eyebrow px-2 uppercase text-pg-faint">
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
                        ? "bg-pg-primary-soft font-medium text-pg-primary"
                        : "text-pg-dim hover:bg-pg-hover hover:text-pg-text",
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
    loading: { label: "Booting SQLite", className: "text-pg-gold" },
    ready: { label: "SQLite live", className: "text-pg-sky" },
    error: { label: "Engine failed", className: "text-pg-rose" },
  } as const;
  const { label, className } = map[status];

  return (
    <span className={cn("flex items-center gap-1.5", className)}>
      <span
        aria-hidden="true"
        className={cn(
          "size-1.5 rounded-full bg-current",
          status === "loading" && "animate-pulse",
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
      title={
        label
          ? `${direction === "prev" ? "Previous" : "Next"}: ${label}`
          : undefined
      }
      aria-label={
        label
          ? `${direction === "prev" ? "Previous lab" : "Next lab"}: ${label}`
          : `No ${direction === "prev" ? "previous" : "next"} lab`
      }
      className="flex size-7 items-center justify-center rounded-full border border-pg-line text-pg-dim transition-colors hover:border-pg-line-strong hover:text-pg-text disabled:opacity-35"
    >
      <svg viewBox="0 0 16 16" aria-hidden="true" className="size-3.5">
        <path
          d={
            direction === "prev" ? "M10 3.5 5.5 8 10 12.5" : "M6 3.5 10.5 8 6 12.5"
          }
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
        <h2 className="text-eyebrow uppercase text-pg-gold">Teaching notes</h2>
        <ul className="mt-2.5 space-y-2">
          {lab.notes.map((note) => (
            <li
              key={note}
              className="flex gap-2.5 text-[0.8125rem] leading-relaxed text-pg-text"
            >
              <span
                aria-hidden="true"
                className="mt-2 size-1 shrink-0 rounded-full bg-pg-primary"
              />
              {note}
            </li>
          ))}
        </ul>
      </div>

      <div className="border-t border-pg-line pt-3">
        <h2 className="text-eyebrow uppercase text-pg-faint">Syllabus coverage</h2>
        <p className="mt-2 text-[0.8125rem] leading-relaxed text-pg-dim">
          {courseTitle ?? lab.courseSlug}
          {course
            ? ` · ${durationLabel(course.durationMonths)} · ${course.level}`
            : null}
        </p>
        <ul className="mt-2 flex flex-wrap gap-1.5">
          {lab.topics.map((topic) => (
            <li
              key={topic}
              className="rounded-full bg-pg-hover px-2.5 py-1 text-[0.6875rem] text-pg-dim"
            >
              {topic}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
