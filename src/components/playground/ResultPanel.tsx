"use client";

import { useState } from "react";

import { useDb } from "@/components/playground/DbProvider";
import { ResultTable } from "@/components/playground/ResultTable";
import { describeStatements, type QueryOutcome } from "@/lib/sqlite";
import { cn } from "@/lib/cn";

/**
 * The dock's Result surface.
 *
 * SQLite returns a result set only for statements that produce rows, so a pasted
 * CREATE or INSERT comes back with nothing at all. Rendering the empty-state in
 * that case was actively misleading — the statement had run, the table existed,
 * and the panel said "run something". Anything that produced no rows now gets an
 * explicit receipt instead, and a batch that produced several result sets shows
 * all of them rather than silently keeping the first.
 */
export function ResultPanel({ outcome }: { outcome: QueryOutcome | null }) {
  const { setStage } = useDb();
  const [active, setActive] = useState(0);

  if (!outcome) {
    return (
      <ResultTable
        set={null}
        fill
        empty="Run something and the rows land here."
      />
    );
  }

  if (outcome.error) {
    return <ResultTable set={null} error={outcome.error} fill />;
  }

  // Rows came back: show them, with a switcher when a batch produced several.
  if (outcome.sets.length > 0) {
    const index = Math.min(active, outcome.sets.length - 1);

    return (
      <div className="flex h-full min-h-0 flex-col gap-2">
        {outcome.sets.length > 1 ? (
          <div className="flex shrink-0 items-center gap-1">
            <span className="mr-1 text-[0.6875rem] text-pg-faint">
              {outcome.sets.length} result sets
            </span>
            {outcome.sets.map((set, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setActive(i)}
                aria-pressed={i === index}
                className={cn(
                  "rounded-full px-2.5 py-0.5 font-mono text-[0.6875rem] transition-colors",
                  i === index
                    ? "bg-pg-primary-soft text-pg-primary"
                    : "text-pg-faint hover:bg-pg-hover hover:text-pg-text",
                )}
              >
                {i + 1}
                <span className="ml-1 text-pg-faint">
                  {set.values.length}
                </span>
              </button>
            ))}
          </div>
        ) : null}

        <ResultTable set={outcome.sets[index]} animate fill className="min-h-0" />
      </div>
    );
  }

  // No rows, no error: the statement did something the grid cannot show.
  const statements = describeStatements(outcome.sql);
  const created = statements.filter(
    (item) => item.verb === "CREATE" && item.objectName,
  );
  const changed = statements.some((item) =>
    ["INSERT", "UPDATE", "DELETE", "REPLACE"].includes(item.verb),
  );

  return (
    <div className="animate-pg-fade-in flex h-full min-h-0 flex-col overflow-auto pg-scroll">
      <div className="rounded-xl border border-pg-sky/40 bg-pg-sky-soft px-4 py-3">
        <p className="flex items-center gap-2 text-sm font-medium text-pg-text">
          <span aria-hidden="true" className="text-pg-sky">
            ✓
          </span>
          Statement executed. No rows to return.
        </p>

        <ul className="mt-2.5 space-y-1">
          {statements.map((item, index) => (
            <li
              key={`${item.verb}-${index}`}
              className="font-mono text-[0.75rem] text-pg-dim"
            >
              <span className="text-pg-gold">{item.verb}</span>
              {item.objectKind ? ` ${item.objectKind.toLowerCase()}` : null}
              {item.objectName ? (
                <span className="text-pg-text"> {item.objectName}</span>
              ) : null}
            </li>
          ))}
        </ul>

        <p className="mt-2.5 font-mono text-[0.6875rem] text-pg-faint">
          {changed
            ? `${outcome.rowsModified.toLocaleString("en-IN")} ${outcome.rowsModified === 1 ? "row" : "rows"} affected · `
            : ""}
          {outcome.ms} ms
        </p>

        {created.length > 0 ? (
          <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-pg-sky/25 pt-3">
            <p className="text-[0.8125rem] text-pg-dim">
              {created.length === 1
                ? `${created[0].objectName} now exists in the database.`
                : `${created.length} new objects now exist in the database.`}
            </p>
            <button
              type="button"
              onClick={() => setStage("map")}
              className="rounded-full bg-pg-primary px-3 py-1 text-[0.75rem] font-medium text-pg-on-primary transition-colors hover:bg-pg-primary-hover"
            >
              See it on the map
            </button>
          </div>
        ) : null}
      </div>

      <p className="mt-3 shrink-0 text-[0.75rem] leading-relaxed text-pg-faint">
        Only SELECT-shaped statements produce a grid. Add a SELECT after your
        script — or open the Database map — to see what changed.
      </p>
    </div>
  );
}
