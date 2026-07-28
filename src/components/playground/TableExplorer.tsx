"use client";

import { useMemo, useState } from "react";

import { useDb } from "@/components/playground/DbProvider";
import { useDatabaseMap } from "@/components/playground/useDatabaseMap";
import { SESSION_GROUP, type DbTable } from "@/lib/db-map";
import { quoteIdent } from "@/lib/sqlite";
import { cn } from "@/lib/cn";

/**
 * Compact table picker for a lab's side rail.
 *
 * Deliberately not a data browser any more: the full view — columns, keys,
 * relationships, row previews — lives on the Database map, which has the room
 * for it. Cramming an expandable result grid into a 300px rail was what forced
 * the editor off-screen in the first place.
 *
 * The list comes from `useDatabaseMap`, so a table created mid-session appears
 * here under "Created in this session" without anything being registered.
 */
export function TableExplorer({
  onSelect,
  onOpenMap,
  className,
}: {
  /** Called with a ready-made SELECT so a lab can push it into its editor. */
  onSelect?: (sql: string, table: string) => void;
  /** Jumps to the canvas view. */
  onOpenMap?: () => void;
  className?: string;
}) {
  const { status } = useDb();
  const { map } = useDatabaseMap();
  const [query, setQuery] = useState("");

  const groups = useMemo(() => {
    const term = query.trim().toLowerCase();
    const filtered = term
      ? map.tables.filter(
          (table) =>
            table.name.toLowerCase().includes(term) ||
            table.columns.some((column) =>
              column.name.toLowerCase().includes(term),
            ),
        )
      : map.tables;

    const byGroup = new Map<string, DbTable[]>();
    for (const table of filtered) {
      const list = byGroup.get(table.group) ?? [];
      list.push(table);
      byGroup.set(table.group, list);
    }
    // Anything the learner made goes first: it is what they are working on.
    return [...byGroup.entries()].sort(([a], [b]) =>
      a === SESSION_GROUP ? -1 : b === SESSION_GROUP ? 1 : 0,
    );
  }, [map.tables, query]);

  if (status !== "ready") {
    return (
      <p className={cn("px-1 py-3 text-xs text-pg-faint", className)}>
        Waiting for SQLite…
      </p>
    );
  }

  return (
    <div className={cn("flex min-h-0 flex-col", className)}>
      <div className="relative shrink-0">
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Filter tables"
          aria-label="Filter tables"
          className="h-8 w-full rounded-lg border border-pg-line bg-pg-raised pr-2.5 pl-7.5 text-xs text-pg-text outline-none transition-colors placeholder:text-pg-faint focus:border-pg-primary"
        />
        <svg
          viewBox="0 0 20 20"
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 left-2.5 size-3 -translate-y-1/2 text-pg-faint"
          fill="none"
        >
          <circle cx="8.5" cy="8.5" r="5.25" stroke="currentColor" strokeWidth="1.8" />
          <path
            d="m12.5 12.5 4 4"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      </div>

      <div className="pg-scroll mt-2 min-h-0 flex-1 space-y-3 overflow-y-auto">
        {groups.length === 0 ? (
          <p className="px-1 py-3 text-xs text-pg-faint">
            {query.trim()
              ? `Nothing matches “${query}”.`
              : "No tables yet. Create one, or press Reset DB to restore the seed."}
          </p>
        ) : null}

        {groups.map(([label, tables]) => (
          <section key={label}>
            <h3
              className={cn(
                "text-[0.625rem] font-semibold tracking-[0.1em] uppercase",
                label === SESSION_GROUP ? "text-pg-primary" : "text-pg-faint",
              )}
            >
              {label}
            </h3>
            <ul className="mt-1 space-y-px">
              {tables.map((table) => (
                <li key={table.name}>
                  <button
                    type="button"
                    onClick={() =>
                      onSelect?.(
                        `SELECT * FROM ${quoteIdent(table.name)};`,
                        table.name,
                      )
                    }
                    title={table.note ?? `${table.columns.length} columns`}
                    className="group flex w-full items-center gap-2 rounded-md px-1.5 py-1 text-left transition-colors hover:bg-pg-hover"
                  >
                    <span
                      aria-hidden="true"
                      className={cn(
                        "size-1.5 shrink-0 rounded-full",
                        table.rows === 0 ? "bg-pg-line-strong" : "bg-pg-gold",
                      )}
                    />
                    <span className="min-w-0 flex-1 truncate font-mono text-xs text-pg-text">
                      {table.name}
                    </span>
                    {table.kind === "view" ? (
                      <span className="shrink-0 text-[0.5625rem] tracking-[0.08em] text-pg-iris uppercase">
                        view
                      </span>
                    ) : null}
                    <span className="shrink-0 font-mono text-[0.625rem] text-pg-faint tabular-nums">
                      {table.rows.toLocaleString("en-IN")}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      {onOpenMap ? (
        <button
          type="button"
          onClick={onOpenMap}
          className="mt-2 flex shrink-0 items-center justify-center gap-1.5 rounded-lg border border-pg-line py-1.5 text-[0.6875rem] font-medium text-pg-dim transition-colors hover:border-pg-primary hover:text-pg-primary"
        >
          Open the database map
          <span aria-hidden="true">→</span>
        </button>
      ) : null}
    </div>
  );
}
