"use client";

import { useMemo } from "react";

import { useDb } from "@/components/playground/DbProvider";
import { layoutDatabase, readDatabaseMap, type DatabaseMap, type Layout } from "@/lib/db-map";

/**
 * The live map plus its layout, re-read whenever the database changes.
 *
 * `version` is the invalidation signal: the store bumps it after any statement
 * that is not read-only, and `isReadOnly` already counts CREATE, DROP and ALTER
 * as writes. So a student's new table appears here on the next render without
 * anything having to subscribe to schema events.
 */
export function useDatabaseMap(): { map: DatabaseMap; layout: Layout } {
  const { status, version } = useDb();

  return useMemo(() => {
    if (status !== "ready") {
      const empty: DatabaseMap = { tables: [], edges: [] };
      return { map: empty, layout: layoutDatabase(empty) };
    }
    const map = readDatabaseMap();
    return { map, layout: layoutDatabase(map) };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, version]);
}
