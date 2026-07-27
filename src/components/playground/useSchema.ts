"use client";

import { useMemo } from "react";

import { useDb } from "@/components/playground/DbProvider";
import { ALL_TABLES } from "@/content/lab-seed";
import { read } from "@/lib/playground-store";
import { quoteIdent } from "@/lib/sqlite";

/**
 * Live schema as `{ table: columns }`, read from PRAGMA table_info rather than
 * from a hard-coded list — so editor autocomplete stays correct even after a
 * student runs their own CREATE or ALTER.
 */
export function useSchema(): Record<string, string[]> {
  const { status, version } = useDb();

  return useMemo(() => {
    if (status !== "ready") return {};

    const schema: Record<string, string[]> = {};
    for (const table of ALL_TABLES) {
      const set = read(`PRAGMA table_info(${quoteIdent(table)});`);
      if (!set) continue;
      const nameIndex = set.columns.indexOf("name");
      schema[table] = set.values.map((row) => String(row[nameIndex] ?? ""));
    }
    return schema;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, version]);
}
