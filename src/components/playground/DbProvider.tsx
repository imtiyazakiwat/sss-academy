"use client";

import { useEffect, useMemo, useSyncExternalStore, type ReactNode } from "react";

import {
  clearLogs,
  ensureDatabase,
  getServerSnapshot,
  getSnapshot,
  log,
  read,
  resetDatabase,
  run,
  setDockTab,
  subscribe,
  type DockTab,
  type LogKind,
  type LogLine,
  type PlaygroundState,
  type RunOptions,
} from "@/lib/playground-store";
import type { ResultSet } from "@/lib/sqlite";

export type { DockTab, LogKind, LogLine, RunOptions };

/**
 * Boots the shared SQLite instance for the playground subtree.
 *
 * There is no context here on purpose: the database lives in a module store
 * (see lib/playground-store.ts), so every hook below reads the same session
 * without prop or provider plumbing. This component exists to kick the boot off
 * once, from the layout, and to keep the call site self-documenting.
 */
export function DbProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    ensureDatabase();
  }, []);

  return <>{children}</>;
}

interface DbApi extends PlaygroundState {
  setDockTab: (tab: DockTab) => void;
  run: (sql: string, options?: RunOptions) => ReturnType<typeof run>;
  read: (sql: string) => ResultSet | null;
  log: (kind: LogKind, text: string) => void;
  clearLogs: () => void;
  reset: () => void;
  /** True while a statement is in flight. Kept for API symmetry — SQLite is
   *  synchronous, so this is only ever true during a reset. */
  running: boolean;
}

export function useDb(): DbApi {
  const state = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  return useMemo(
    () => ({
      ...state,
      running: state.resetting,
      setDockTab,
      run,
      read,
      log,
      clearLogs,
      reset: resetDatabase,
    }),
    [state],
  );
}

/**
 * Runs a read query and re-runs it whenever the database changes.
 *
 * Queries are synchronous, so this is derived state — no effect, no loading
 * flag, no flicker. `version` in the dependency list is what makes one
 * component's table refresh after another component's INSERT.
 */
export function useQuery(sql: string | null): ResultSet | null {
  const { status, version } = useDb();

  return useMemo(
    () => (sql && status === "ready" ? read(sql) : null),
    // `version` is the invalidation signal.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [sql, status, version],
  );
}
