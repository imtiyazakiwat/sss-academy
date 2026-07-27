"use client";

import { useState } from "react";

import { useDb, useQuery } from "@/components/playground/DbProvider";
import { ResultTable } from "@/components/playground/ResultTable";
import { TABLE_GROUPS } from "@/content/lab-seed";
import { quoteIdent } from "@/lib/sqlite";
import { cn } from "@/lib/cn";

/**
 * Live Database Explorer.
 *
 * Row counts and previews are read straight from SQLite on every render and
 * invalidated by the provider's `version`, so a table's count updates the
 * instant another lab's INSERT lands. Nothing here is cached or mocked.
 */
export function TableExplorer({
  onSelect,
  className,
}: {
  /** Called with a ready-made SELECT so a lab can push it into its editor. */
  onSelect?: (sql: string, table: string) => void;
  className?: string;
}) {
  const { status } = useDb();
  const [open, setOpen] = useState<string | null>("src_sales");

  return (
    <div className={cn("space-y-5", className)}>
      {TABLE_GROUPS.map((group) => (
        <section key={group.label}>
          <h3 className="text-eyebrow uppercase text-violet-300">{group.label}</h3>
          <p className="mt-1.5 text-xs leading-relaxed text-ink-400">{group.hint}</p>

          <ul className="mt-3 space-y-1">
            {group.tables.map((table) => (
              <li key={table.name}>
                <TableRow
                  name={table.name}
                  note={table.note}
                  open={open === table.name}
                  ready={status === "ready"}
                  onToggle={() =>
                    setOpen((current) => (current === table.name ? null : table.name))
                  }
                  onSelect={onSelect}
                />
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

function TableRow({
  name,
  note,
  open,
  ready,
  onToggle,
  onSelect,
}: {
  name: string;
  note: string;
  open: boolean;
  ready: boolean;
  onToggle: () => void;
  onSelect?: (sql: string, table: string) => void;
}) {
  const countSet = useQuery(
    ready ? `SELECT COUNT(*) FROM ${quoteIdent(name)};` : null,
  );
  const preview = useQuery(
    open && ready ? `SELECT * FROM ${quoteIdent(name)} LIMIT 50;` : null,
  );

  const rowCount = Number(countSet?.values[0]?.[0] ?? 0);
  const selectSql = `SELECT * FROM ${name};`;
  const panelId = `table-panel-${name}`;

  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border transition-colors",
        open ? "border-violet-400/40 bg-white/[0.05]" : "border-white/8 bg-white/[0.02]",
      )}
    >
      <div className="flex items-stretch">
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={open}
          aria-controls={panelId}
          className="flex min-w-0 flex-1 items-center gap-2.5 px-3 py-2 text-left transition-colors hover:bg-white/[0.04]"
        >
          <svg
            viewBox="0 0 16 16"
            aria-hidden="true"
            className={cn(
              "size-3 shrink-0 text-ink-400 transition-transform duration-200",
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
            <span className="block truncate font-mono text-[0.8125rem] text-ink-100">
              {name}
            </span>
            <span className="mt-0.5 block truncate text-[0.6875rem] text-ink-400">
              {note}
            </span>
          </span>
          <span
            className={cn(
              "shrink-0 rounded-full px-2 py-0.5 font-mono text-[0.6875rem] tabular-nums",
              rowCount === 0
                ? "bg-white/8 text-ink-400"
                : "bg-violet-500/20 text-violet-100",
            )}
          >
            {rowCount.toLocaleString("en-IN")}
          </span>
        </button>

        {onSelect ? (
          <button
            type="button"
            onClick={() => onSelect(selectSql, name)}
            title={`Load "${selectSql}" into the editor`}
            className="shrink-0 border-l border-white/8 px-2.5 text-[0.6875rem] font-medium text-ink-400 transition-colors hover:bg-white/[0.06] hover:text-white"
          >
            Query
          </button>
        ) : null}
      </div>

      {open ? (
        <div id={panelId} className="border-t border-white/8 p-2.5">
          <ResultTable set={preview} maxRows={50} empty="Loading…" />
        </div>
      ) : null}
    </div>
  );
}
