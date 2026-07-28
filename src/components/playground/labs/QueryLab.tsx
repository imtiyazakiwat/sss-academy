"use client";

import { useRef, useState } from "react";

import { useDb } from "@/components/playground/DbProvider";
import { LabBrief } from "@/components/playground/LabChrome";
import { Splitter, useResizable } from "@/components/playground/Splitter";
import { SqlEditor } from "@/components/playground/SqlEditor";
import { TableExplorer } from "@/components/playground/TableExplorer";
import { useSchema } from "@/components/playground/useSchema";
import type { Lab } from "@/content/labs";
import { cn } from "@/lib/cn";

/**
 * The SQL Playground surface, shared by every `kind: "query"` lab.
 *
 * Two panes that fill the stage and scroll independently: the editor owns the
 * left, the examples and the table list own the right. Nothing here is in a
 * document flow, so reaching for a table can never push the editor out of view —
 * which is exactly what the old single-scroll layout did.
 *
 * Results go to the shell's dock, and the relationships live on the Database map
 * tab, so this pane stays about writing SQL.
 */
export function QueryLab({ lab }: { lab: Lab }) {
  const {
    run,
    running,
    status,
    autoRun,
    stagedFor,
    editorSql,
    setEditorSql,
    loadEditorSql,
    setStage,
  } = useDb();
  const schema = useSchema();
  const snippets = lab.snippets ?? [];
  const paneRef = useRef<HTMLDivElement>(null);

  // The text lives in the store, keyed by lab, so the schema map can write to it
  // and so a half-written statement survives a trip to another lab and back.
  const fallback = snippets[0]?.sql ?? "SELECT * FROM customer;";
  const sql = editorSql[lab.slug] ?? fallback;
  const [activeSnippet, setActiveSnippet] = useState(0);
  const staged = stagedFor === lab.slug;

  const rail = useResizable({
    storageKey: "sss-pg-query-rail-w",
    initial: 296,
    min: 220,
    max: () => Math.max(240, (paneRef.current?.clientWidth ?? 900) - 420),
    axis: "x",
    invert: true,
  });

  const execute = () => {
    const target = sql.trim();
    if (!target || status !== "ready") return;
    run(target);
  };

  /**
   * Loading is separate from running, and that is the point. With auto-run off
   * the statement lands in the editor and the Run button nudges, so the learner
   * reads the SQL before the database does anything with it.
   */
  const load = (statement: string) => loadEditorSql(lab.slug, statement);

  return (
    <div ref={paneRef} className="flex h-full min-h-0 flex-col lg:flex-row">
      {/* Editor pane */}
      <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-3 p-3">
        <LabBrief lab={lab} />

        <SqlEditor
          value={sql}
          onChange={(next) => setEditorSql(lab.slug, next)}
          onRun={execute}
          schema={schema}
          running={running}
          fill
          pulseRun={staged}
          label={`${lab.title} SQL editor`}
          className="min-h-0 flex-1"
          actions={
            staged ? (
              <span className="animate-pg-fade-in text-[0.6875rem] text-pg-gold">
                Loaded — not run yet
              </span>
            ) : null
          }
        />
      </div>

      <Splitter
        {...rail.handleProps}
        label="Resize the examples and table list"
        className="hidden lg:block"
      />

      {/* Reference rail */}
      <aside
        style={{ width: rail.size }}
        className="hidden min-h-0 shrink-0 flex-col gap-4 border-l border-pg-line bg-pg-surface p-3 lg:flex"
      >
        {snippets.length > 0 ? (
          <section className="flex min-h-0 flex-[3] flex-col">
            <RailHeading
              title="Worked examples"
              hint={autoRun ? "Loads and runs" : "Loads into the editor"}
            />
            <ol className="pg-scroll mt-1.5 min-h-0 flex-1 space-y-1 overflow-y-auto">
              {snippets.map((snippet, index) => (
                <li key={snippet.label}>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveSnippet(index);
                      load(snippet.sql);
                    }}
                    className={cn(
                      "w-full rounded-lg px-2.5 py-2 text-left transition-colors",
                      index === activeSnippet
                        ? "bg-pg-primary-soft text-pg-text"
                        : "text-pg-dim hover:bg-pg-hover hover:text-pg-text",
                    )}
                  >
                    <span className="flex items-baseline gap-2">
                      <span className="font-mono text-[0.6875rem] text-pg-gold">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <span className="min-w-0 flex-1 text-[0.8125rem] font-medium">
                        {snippet.label}
                      </span>
                    </span>
                    <span className="mt-0.5 block pl-6 text-[0.6875rem] leading-relaxed text-pg-faint">
                      {snippet.note}
                    </span>
                  </button>
                </li>
              ))}
            </ol>
          </section>
        ) : null}

        <section className="flex min-h-0 flex-[4] flex-col border-t border-pg-line pt-3">
          <RailHeading title="Live database" hint="Click to load a SELECT" />
          <TableExplorer
            className="mt-1.5 flex-1"
            onSelect={(statement) => load(statement)}
            onOpenMap={() => setStage("map")}
          />
        </section>
      </aside>

      {/* Small screens get the rail as a scrolling block under the editor. */}
      <div className="shrink-0 border-t border-pg-line bg-pg-surface p-3 lg:hidden">
        {snippets.length > 0 ? (
          <>
            <RailHeading
              title="Worked examples"
              hint={autoRun ? "Loads and runs" : "Loads into the editor"}
            />
            <div className="pg-scroll mt-1.5 flex gap-2 overflow-x-auto pb-1">
              {snippets.map((snippet, index) => (
                <button
                  key={snippet.label}
                  type="button"
                  onClick={() => {
                    setActiveSnippet(index);
                    load(snippet.sql);
                  }}
                  className={cn(
                    "shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                    index === activeSnippet
                      ? "border-pg-primary bg-pg-primary-soft text-pg-primary"
                      : "border-pg-line text-pg-dim",
                  )}
                >
                  {snippet.label}
                </button>
              ))}
            </div>
          </>
        ) : null}

        <button
          type="button"
          onClick={() => setStage("map")}
          className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg border border-pg-line py-2 text-[0.8125rem] font-medium text-pg-dim transition-colors hover:border-pg-primary hover:text-pg-primary"
        >
          Browse the database map
          <span aria-hidden="true">→</span>
        </button>
      </div>
    </div>
  );
}

function RailHeading({ title, hint }: { title: string; hint: string }) {
  return (
    <div className="flex shrink-0 items-baseline justify-between gap-2">
      <h2 className="text-[0.6875rem] font-semibold tracking-[0.1em] text-pg-faint uppercase">
        {title}
      </h2>
      <span className="text-[0.625rem] text-pg-faint">{hint}</span>
    </div>
  );
}
