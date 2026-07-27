"use client";

import { useState } from "react";

import { useDb } from "@/components/playground/DbProvider";
import { LabIntro, Panel } from "@/components/playground/LabChrome";
import { QueryTimeline } from "@/components/playground/QueryTimeline";
import { SqlEditor } from "@/components/playground/SqlEditor";
import { TableExplorer } from "@/components/playground/TableExplorer";
import { useSchema } from "@/components/playground/useSchema";
import type { Lab } from "@/content/labs";
import { cn } from "@/lib/cn";

/**
 * The SQL Playground / query-lab surface, shared by every `kind: "query"` lab.
 *
 * One editor, the lab's own snippets, the live table explorer, and the execution
 * timeline. Results render in the shell's dock rather than here, so the editor
 * never gets pushed off-screen by a wide result set.
 */
export function QueryLab({ lab }: { lab: Lab }) {
  const { run, running, status } = useDb();
  const schema = useSchema();
  const snippets = lab.snippets ?? [];

  const [sql, setSql] = useState(snippets[0]?.sql ?? "SELECT * FROM customer;");
  const [activeSnippet, setActiveSnippet] = useState(0);
  const [lastRun, setLastRun] = useState<{
    sql: string;
    rows: number;
    ms: number;
  } | null>(null);

  const execute = (statement?: string) => {
    const target = (statement ?? sql).trim();
    if (!target || status !== "ready") return;
    const outcome = run(target);
    if (outcome && !outcome.error) {
      setLastRun({
        sql: target,
        rows: outcome.sets[0]?.values.length ?? 0,
        ms: outcome.ms,
      });
    } else {
      setLastRun(null);
    }
  };

  const loadSnippet = (index: number) => {
    const snippet = snippets[index];
    if (!snippet) return;
    setActiveSnippet(index);
    setSql(snippet.sql);
    execute(snippet.sql);
  };

  return (
    <div className="space-y-5">
      <LabIntro lab={lab} />

      <div className="grid gap-5 xl:grid-cols-12">
        <div className="space-y-5 xl:col-span-8">
          <SqlEditor
            value={sql}
            onChange={setSql}
            onRun={() => execute()}
            schema={schema}
            running={running}
            rows={12}
            label={`${lab.title} SQL editor`}
          />

          {snippets.length > 0 ? (
            <p className="text-[0.8125rem] leading-relaxed text-ink-400">
              {snippets[activeSnippet]?.note}
            </p>
          ) : null}

          {lastRun ? (
            <Panel
              title="Execution timeline"
              subtitle="Clause order parsed from your statement; access paths from SQLite's own EXPLAIN QUERY PLAN."
            >
              <QueryTimeline
                sql={lastRun.sql}
                rowCount={lastRun.rows}
                ms={lastRun.ms}
              />
            </Panel>
          ) : null}
        </div>

        <div className="space-y-5 xl:col-span-4">
          {snippets.length > 0 ? (
            <Panel
              title="Worked examples"
              subtitle="Loads into the editor and runs immediately."
              bodyClassName="p-2.5"
            >
              <ol className="space-y-1">
                {snippets.map((snippet, index) => (
                  <li key={snippet.label}>
                    <button
                      type="button"
                      onClick={() => loadSnippet(index)}
                      className={cn(
                        "w-full rounded-lg px-3 py-2 text-left transition-colors",
                        index === activeSnippet
                          ? "bg-violet-500/20 text-white"
                          : "text-ink-200 hover:bg-white/5 hover:text-white",
                      )}
                    >
                      <span className="flex items-baseline gap-2">
                        <span className="font-mono text-[0.6875rem] text-violet-300">
                          {String(index + 1).padStart(2, "0")}
                        </span>
                        <span className="min-w-0 flex-1 text-[0.8125rem] font-medium">
                          {snippet.label}
                        </span>
                      </span>
                      <span className="mt-0.5 block pl-6 text-[0.6875rem] leading-relaxed text-ink-400">
                        {snippet.note}
                      </span>
                    </button>
                  </li>
                ))}
              </ol>
            </Panel>
          ) : null}

          <Panel
            title="Live database"
            subtitle="Click a table to read its rows. Counts update as data changes."
            bodyClassName="p-3"
          >
            <TableExplorer
              onSelect={(statement) => {
                setSql(statement);
                execute(statement);
              }}
            />
          </Panel>
        </div>
      </div>
    </div>
  );
}
