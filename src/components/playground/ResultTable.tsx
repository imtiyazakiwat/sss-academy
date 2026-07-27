"use client";

import { useMemo } from "react";

import { formatCell, type ResultSet, type SqlValue } from "@/lib/sqlite";
import { cn } from "@/lib/cn";

export type RowFlag = "bad" | "warn" | "good" | null;

const ROW_FLAG: Record<"bad" | "warn" | "good", string> = {
  bad: "bg-ember-500/12 hover:bg-ember-500/20",
  warn: "bg-amber-400/10 hover:bg-amber-400/16",
  good: "bg-mint-500/10 hover:bg-mint-500/16",
};

export interface ResultTableProps {
  set: ResultSet | null;
  error?: string;
  /** Flags a whole row. Return null to leave it neutral. */
  flagRow?: (row: SqlValue[], columns: string[], index: number) => RowFlag;
  /** Flags one cell — used to point at the specific offending value. */
  flagCell?: (
    value: SqlValue,
    column: string,
    row: SqlValue[],
  ) => RowFlag;
  /** Rendered when there is nothing to show yet. */
  empty?: string;
  maxRows?: number;
  /** Adds a pulse to rows flagged since the last run. */
  animate?: boolean;
  className?: string;
}

/**
 * Result grid for every lab.
 *
 * NULL is rendered as a distinct token rather than an empty cell, because the
 * difference between "no value" and "empty string" is the single most common
 * thing students get wrong in validation work.
 */
export function ResultTable({
  set,
  error,
  flagRow,
  flagCell,
  empty = "Run a query to see rows here.",
  maxRows = 200,
  animate = false,
  className,
}: ResultTableProps) {
  const rows = useMemo(
    () => (set ? set.values.slice(0, maxRows) : []),
    [set, maxRows],
  );

  if (error) {
    return (
      <div
        role="alert"
        className={cn(
          "rounded-xl border border-ember-500/35 bg-ember-500/10 px-4 py-3 font-mono text-[0.8125rem] leading-relaxed text-ember-200",
          className,
        )}
      >
        {error}
      </div>
    );
  }

  if (!set) {
    return (
      <p className={cn("px-1 py-6 text-sm text-ink-400", className)}>{empty}</p>
    );
  }

  if (set.values.length === 0) {
    return (
      <div
        className={cn(
          "rounded-xl border border-white/10 bg-white/[0.03] px-4 py-6 text-center",
          className,
        )}
      >
        <p className="text-sm font-medium text-mint-100">Zero rows returned.</p>
        <p className="mt-1 text-xs text-ink-400">
          For a validation query that is usually the result you want.
        </p>
      </div>
    );
  }

  const truncated = set.values.length - rows.length;

  return (
    <div className={cn("overflow-hidden rounded-xl border border-white/10", className)}>
      <div className="max-h-[22rem] overflow-auto">
        <table className="w-full border-collapse text-left font-mono text-[0.8125rem]">
          <thead className="sticky top-0 z-10">
            <tr className="bg-navy-900">
              <th
                scope="col"
                className="w-10 border-b border-white/10 px-3 py-2 text-right text-[0.6875rem] font-medium text-ink-500"
              >
                #
              </th>
              {set.columns.map((column) => (
                <th
                  key={column}
                  scope="col"
                  className="border-b border-white/10 px-3 py-2 text-[0.75rem] font-medium whitespace-nowrap text-navy-100"
                >
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIndex) => {
              const flag = flagRow?.(row, set.columns, rowIndex) ?? null;
              return (
                <tr
                  key={rowIndex}
                  className={cn(
                    "border-b border-white/6 transition-colors last:border-b-0",
                    flag ? ROW_FLAG[flag] : "hover:bg-white/[0.04]",
                    animate && flag === "bad" && "animate-[pulse-bad_1.4s_ease-out_2]",
                  )}
                >
                  <td className="px-3 py-1.5 text-right text-[0.6875rem] text-ink-500">
                    {rowIndex + 1}
                  </td>
                  {row.map((value, cellIndex) => {
                    const column = set.columns[cellIndex];
                    const cellFlag = flagCell?.(value, column, row) ?? null;
                    const isNull = value === null;
                    return (
                      <td
                        key={cellIndex}
                        className={cn(
                          "px-3 py-1.5 whitespace-nowrap",
                          typeof value === "number"
                            ? "text-right tabular-nums text-ember-100"
                            : "text-ink-100",
                          isNull && "text-ink-500 italic",
                          cellFlag === "bad" &&
                            "rounded bg-ember-500/25 font-medium text-white",
                          cellFlag === "warn" && "bg-amber-400/20 text-white",
                          cellFlag === "good" && "bg-mint-500/20 text-white",
                        )}
                      >
                        {formatCell(value)}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between gap-4 border-t border-white/10 bg-white/[0.02] px-3 py-1.5 text-[0.6875rem] text-ink-400">
        <span>
          {set.values.length.toLocaleString("en-IN")}{" "}
          {set.values.length === 1 ? "row" : "rows"} ·{" "}
          {set.columns.length} {set.columns.length === 1 ? "column" : "columns"}
        </span>
        {truncated > 0 ? (
          <span>Showing first {maxRows.toLocaleString("en-IN")}</span>
        ) : null}
      </div>
    </div>
  );
}
