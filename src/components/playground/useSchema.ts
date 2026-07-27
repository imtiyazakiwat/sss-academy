"use client";

import { useMemo } from "react";

import { useDb } from "@/components/playground/DbProvider";
import { read } from "@/lib/playground-store";
import { quoteIdent } from "@/lib/sqlite";

/**
 * Live schema as `{ table: columns }` for editor autocomplete.
 *
 * The table list comes from `sqlite_master`, not from the seed's `ALL_TABLES`.
 * That was the bug behind "my new table doesn't autocomplete": a CREATE TABLE is
 * invisible to a hard-coded list, however live the column read is.
 */
export function useSchema(): Record<string, string[]> {
  const { status, version } = useDb();

  return useMemo(() => {
    if (status !== "ready") return {};

    const master = read(
      `SELECT name FROM sqlite_master
        WHERE type IN ('table','view') AND name NOT LIKE 'sqlite_%'
        ORDER BY name;`,
    );
    if (!master) return {};

    const schema: Record<string, string[]> = {};
    for (const row of master.values) {
      const table = String(row[0] ?? "");
      if (!table) continue;
      const info = read(`PRAGMA table_info(${quoteIdent(table)});`);
      if (!info) continue;
      const nameIndex = info.columns.indexOf("name");
      schema[table] = info.values.map((column) => String(column[nameIndex] ?? ""));
    }
    return schema;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, version]);
}
