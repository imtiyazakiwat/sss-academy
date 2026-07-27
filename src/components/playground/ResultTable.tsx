"use client";

import { useMemo } from "react";

import { formatCell, type ResultSet, type SqlValue } from "@/lib/sqlite";
import { cn } from "@/lib/cn";

export type RowFlag = "bad" | "warn" | "good" | null;

const ROW_FLAG: Record<"bad" | "warn" | "good", string> = {
  bad: "bg-pg-rose-soft",
  warn: "bg-pg-gold-soft",
  good: "bg-pg-sky-soft",
};

export interface ResultTableProps {
  set: ResultSet | null;
  error?: string;
  /** Flags a whole row. Return null to leave it neutral. */
  flagRow?: (row: SqlValue[], columns: string[], index: number) => RowFlag;
  /** Flags one cell — used to point at the specific offending value. */
  flagCell?: (value: SqlValue, column: string, row: SqlValue[]) => RowFlag;
  /** Rendered when there is nothing to show yet. */
  empty?: string;
  maxRows?: number;
  /** Adds a pulse to rows flagged since the last run. */
  animate?: boolean;
  /** Fills its container instead of capping at 22rem. For dock and pane use. */
  fill?: boolean;
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
  fill = false,
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
          "animate-pg-fade-in rounded-xl border border-pg-rose/40 bg-pg-rose-soft px-4 py-3 font-mono text-[0.8125rem] leading-relaxed text-pg-rose",
          className,
        )}
      >
        {error}
      </div>
    );
  }

  if (!set) {
    return (
      <p className={cn("px-1 py-6 text-sm text-pg-dim", className)}>{empty}</p>
    );
  }

  if (set.values.length === 0) {
    return (
      <div
        className={cn(
          "animate-pg-fade-in rounded-xl border border-pg-line bg-pg-raised px-4 py-6 text-center",
          className,
        )}
      >
        <p className="text-sm font-medium text-pg-sky">Zero rows returned.</p>
        <p className="mt-1 text-xs text-pg-dim">
          For a validation query that is usually the result you want.
        </p>
      </div>
    );
  }

  const truncated = set.values.length - rows.length;

  return (
    <div
      className={cn(
        "flex flex-col overflow-hidden rounded-xl border border-pg-line bg-pg-surface",
        fill && "h-full min-h-0",
        className,
      )}
    >
      <div
        className={cn(
          "pg-scroll overflow-auto",
          fill ? "min-h-0 flex-1" : "max-h-[22rem]",
        )}
      >
        <table className="w-full border-collapse text-left font-mono text-[0.8125rem]">
          <thead className="sticky top-0 z-10">
            <tr className="bg-pg-raised">
              <th
                scope="col"
                className="w-10 border-b border-pg-line px-3 py-2 text-right text-[0.6875rem] font-medium text-pg-faint"
              >
                #
              </th>
              {set.columns.map((column) => (
                <th
                  key={column}
                  scope="col"
                  className="border-b border-pg-line px-3 py-2 text-[0.75rem] font-medium whitespace-nowrap text-pg-gold"
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
                    "border-b border-pg-line/60 transition-colors last:border-b-0",
                    flag ? ROW_FLAG[flag] : "hover:bg-pg-hover",
                    animate &&
                      flag === "bad" &&
                      "animate-[pulse-bad_1.4s_ease-out_2]",
                  )}
                  // Staggered only over the first screenful; past that it is noise.
                  style={
                    animate && rowIndex < 14
                      ? {
                          animation: `pg-row-in 0.32s var(--ease-out-expo) ${rowIndex * 18}ms both`,
                        }
                      : undefined
                  }
                >
                  <td className="px-3 py-1.5 text-right text-[0.6875rem] text-pg-faint">
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
                            ? "text-right tabular-nums text-pg-sky"
                            : "text-pg-text",
                          isNull && "text-pg-faint italic",
                          cellFlag === "bad" &&
                            "bg-pg-rose-soft font-medium text-pg-rose",
                          cellFlag === "warn" && "bg-pg-gold-soft text-pg-gold",
                          cellFlag === "good" && "bg-pg-sky-soft text-pg-sky",
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

      <div className="flex shrink-0 items-center justify-between gap-4 border-t border-pg-line bg-pg-raised px-3 py-1.5 text-[0.6875rem] text-pg-dim">
        <span>
          {set.values.length.toLocaleString("en-IN")}{" "}
          {set.values.length === 1 ? "row" : "rows"} · {set.columns.length}{" "}
          {set.columns.length === 1 ? "column" : "columns"}
        </span>
        {truncated > 0 ? (
          <span>Showing first {maxRows.toLocaleString("en-IN")}</span>
        ) : null}
      </div>
    </div>
  );
}
