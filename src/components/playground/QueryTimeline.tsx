"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";

import { useDb } from "@/components/playground/DbProvider";
import { read } from "@/lib/playground-store";
import { stripTrailingSemicolon } from "@/lib/sqlite";
import { cn } from "@/lib/cn";

interface Step {
  label: string;
  detail: string;
}

const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";

function subscribeToMotionPreference(callback: () => void): () => void {
  const media = window.matchMedia(REDUCED_MOTION);
  media.addEventListener("change", callback);
  return () => media.removeEventListener("change", callback);
}

/**
 * Read as an external store rather than through an effect, so the preference is
 * known on the very first render and never causes a second one.
 */
function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(
    subscribeToMotionPreference,
    () => window.matchMedia(REDUCED_MOTION).matches,
    () => false,
  );
}

/** Case-insensitive keyword test that ignores string literals and comments. */
function has(sql: string, pattern: RegExp): boolean {
  const stripped = sql
    .replace(/'(?:[^']|'')*'/g, "''")
    .replace(/--[^\n]*/g, "")
    .replace(/\/\*[\s\S]*?\*\//g, "");
  return pattern.test(stripped);
}

/**
 * SQL Execution Timeline.
 *
 * The steps are not decorative: clause presence is parsed from the statement and
 * the access path comes from SQLite's own EXPLAIN QUERY PLAN. When the plan says
 * SCAN, the timeline says full scan — because the engine said so. That is the
 * difference between showing students how a database works and showing them an
 * animation of how one might.
 */
export function QueryTimeline({
  sql,
  rowCount,
  ms,
  className,
}: {
  sql: string;
  rowCount: number;
  ms: number;
  className?: string;
}) {
  const { version } = useDb();
  const reducedMotion = usePrefersReducedMotion();
  // Progress is stored against the step list it belongs to, so a new query
  // restarts the reveal without an effect having to reset the counter.
  const [progress, setProgress] = useState<{ steps: Step[]; count: number } | null>(
    null,
  );

  const steps = useMemo<Step[]>(() => {
    const statement = stripTrailingSemicolon(sql);
    if (!statement) return [];

    const planSet = read(`EXPLAIN QUERY PLAN ${statement};`);
    const detailIndex = planSet?.columns.indexOf("detail") ?? -1;
    const plan =
      planSet?.values.map((row) =>
        String(row[detailIndex === -1 ? 3 : detailIndex] ?? "").trim(),
      ) ?? [];

    const list: Step[] = [
      {
        label: "Parse",
        detail: `${statement.length} characters tokenised into a syntax tree`,
      },
    ];

    if (plan.length > 0) {
      list.push({
        label: "Plan",
        detail: `Optimiser chose ${plan.length} ${plan.length === 1 ? "operation" : "operations"}`,
      });
    }

    const scans = plan.filter((line) => /^(SCAN|SEARCH)/i.test(line));
    if (scans.length > 0) {
      for (const scan of scans) {
        const full = /^SCAN/i.test(scan);
        list.push({
          label: full ? "Full scan" : "Index search",
          detail: scan,
        });
      }
    } else {
      list.push({ label: "Read source", detail: "FROM clause resolved" });
    }

    if (has(sql, /\bjoin\b/i)) {
      list.push({
        label: "Join",
        detail: "Matching rows combined; unmatched rows dropped or nulled",
      });
    }
    if (has(sql, /\bwhere\b/i)) {
      list.push({
        label: "Filter",
        detail: "WHERE applied — rows that fail the predicate are discarded",
      });
    }
    const materialised = plan.filter((line) =>
      /MATERIALIZE|CO-ROUTINE|SUBQUERY/i.test(line),
    );
    for (const line of materialised) {
      list.push({ label: "Subquery", detail: line });
    }
    if (has(sql, /\bgroup\s+by\b/i)) {
      list.push({
        label: "Aggregate",
        detail: "Rows collapsed into one row per group",
      });
    }
    if (has(sql, /\bhaving\b/i)) {
      list.push({ label: "Filter groups", detail: "HAVING applied after grouping" });
    }
    if (has(sql, /\bover\s*\(/i)) {
      list.push({
        label: "Window",
        detail: "Window functions evaluated — every row survives",
      });
    }
    if (has(sql, /\bdistinct\b/i)) {
      list.push({ label: "De-duplicate", detail: "DISTINCT removes repeated rows" });
    }
    if (has(sql, /\border\s+by\b/i)) {
      const temp = plan.find((line) => /B-TREE FOR ORDER BY/i.test(line));
      list.push({
        label: "Sort",
        detail: temp ?? "ORDER BY applied",
      });
    }
    if (has(sql, /\blimit\b/i)) {
      list.push({ label: "Limit", detail: "Row cap applied last" });
    }

    list.push({
      label: "Return",
      detail: `${rowCount.toLocaleString("en-IN")} ${rowCount === 1 ? "row" : "rows"} in ${ms} ms`,
    });

    return list;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sql, rowCount, ms, version]);

  // Reveal one step at a time. Reduced-motion users get the finished list.
  useEffect(() => {
    if (steps.length === 0 || reducedMotion) return;

    let index = 0;
    const timer = setInterval(() => {
      index += 1;
      setProgress({ steps, count: index });
      if (index >= steps.length) clearInterval(timer);
    }, 140);
    return () => clearInterval(timer);
  }, [steps, reducedMotion]);

  if (steps.length === 0) return null;

  const revealed = reducedMotion
    ? steps.length
    : progress?.steps === steps
      ? progress.count
      : 0;

  return (
    <ol className={cn("space-y-0", className)}>
      {steps.map((step, index) => {
        const shown = index < revealed;
        const last = index === steps.length - 1;
        return (
          <li
            key={`${step.label}-${index}`}
            className="flex gap-3 transition-all duration-300 ease-[var(--ease-out-expo)]"
            style={{
              opacity: shown ? 1 : 0,
              transform: shown ? "none" : "translate3d(-6px, 0, 0)",
            }}
          >
            <div className="flex flex-col items-center pt-1">
              <span
                className={cn(
                  "size-2 shrink-0 rounded-full transition-colors duration-300",
                  last ? "bg-mint-500" : "bg-violet-400",
                )}
              />
              {!last ? (
                <span
                  className="mt-1 w-px flex-1 bg-white/12"
                  style={{ minHeight: 18 }}
                />
              ) : null}
            </div>
            <div className={cn("min-w-0 pb-3", last && "pb-0")}>
              <p
                className={cn(
                  "text-[0.8125rem] font-medium",
                  last ? "text-mint-100" : "text-white",
                )}
              >
                {step.label}
              </p>
              <p className="mt-0.5 font-mono text-[0.6875rem] leading-relaxed break-words text-ink-400">
                {step.detail}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
