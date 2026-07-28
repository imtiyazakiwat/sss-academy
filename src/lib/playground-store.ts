/**
 * Playground session store.
 *
 * The SQLite instance is an external system, not React state: it is mutable, it
 * is a singleton, and its lifetime is the browser tab rather than any component.
 * Modelling it as a module store read through `useSyncExternalStore` (instead of
 * useState driven by an effect) means no cascading renders on boot, and the
 * database survives client-side navigation between labs — which matters, because
 * a class that has just run the ETL job needs that state still there when it
 * opens the validation lab.
 *
 * Snapshots are replaced, never mutated, so reference equality is a valid
 * change signal.
 */

import { ALL_TABLES, SEED_SQL } from "@/content/lab-seed";
import {
  createDatabase,
  isReadOnly,
  query,
  runSql,
  type QueryOutcome,
  type ResultSet,
  type SqlDatabase,
} from "@/lib/sqlite";

export type LogKind = "sql" | "info" | "ok" | "warn" | "error";

export interface LogLine {
  id: number;
  kind: LogKind;
  text: string;
  /** Local time, HH:MM:SS. */
  at: string;
}

export type DockTab = "result" | "console" | "quiz" | "notes";

/** Which surface the centre pane is showing: the lab, or the database map. */
export type Stage = "lab" | "map";

export interface PlaygroundState {
  status: "loading" | "ready" | "error";
  error: string | null;
  /** Bumped by any statement that could have changed data. */
  version: number;
  logs: LogLine[];
  outcome: QueryOutcome | null;
  resetting: boolean;
  dockTab: DockTab;
  stage: Stage;
  /** The last statement a lab ran on the learner's behalf, for the schema map. */
  lastSql: string | null;
  /** Incremented per run, so the map can re-trigger its pulse on a repeat. */
  runCount: number;
  /**
   * Whether loading a worked example or a table also executes it. Off by
   * default: a lab that runs SQL the moment you glance at an example takes the
   * decision to execute away from the learner, and in a classroom it fires
   * before the teacher has finished reading the statement out.
   */
  autoRun: boolean;
  /**
   * Editor contents, keyed by lab slug.
   *
   * Lifted out of the lab component so a sibling surface — the schema map's "To
   * editor", for instance — can write to the editor without a token-and-effect
   * dance, and so switching labs and coming back does not lose a half-written
   * statement. Keyed rather than shared because each lab starts from its own
   * worked example.
   */
  editorSql: Record<string, string>;
  /**
   * The lab whose editor is holding SQL that was loaded but deliberately not
   * run. Keyed by slug rather than a bare boolean so the "not run yet" hint
   * cannot follow the learner into a different lab.
   */
  stagedFor: string | null;
}

export interface RunOptions {
  /** Skip the console and the result pane. For queries that feed UI directly. */
  silent?: boolean;
  /** Written to the console instead of the raw SQL. */
  label?: string;
  /** Leave the dock where it is instead of switching to Result. */
  keepTab?: boolean;
}

const INITIAL: PlaygroundState = Object.freeze({
  status: "loading",
  error: null,
  version: 0,
  logs: [],
  outcome: null,
  resetting: false,
  dockTab: "result",
  stage: "lab",
  lastSql: null,
  runCount: 0,
  autoRun: false,
  editorSql: {},
  stagedFor: null,
});

const AUTORUN_KEY = "sss-pg-autorun";

/** Console cap — a long teaching session can run hundreds of statements. */
const MAX_LOGS = 300;

let state: PlaygroundState = INITIAL;
let db: SqlDatabase | null = null;
let logId = 0;
let booting: Promise<void> | null = null;

const listeners = new Set<() => void>();

function set(patch: Partial<PlaygroundState>): void {
  state = { ...state, ...patch };
  for (const listener of listeners) listener();
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getSnapshot(): PlaygroundState {
  return state;
}

/** Stable object so server and hydration snapshots compare equal. */
export function getServerSnapshot(): PlaygroundState {
  return INITIAL;
}

function timestamp(): string {
  return new Date().toLocaleTimeString("en-GB", { hour12: false });
}

export function log(kind: LogKind, text: string): void {
  logId += 1;
  const line: LogLine = { id: logId, kind, text, at: timestamp() };
  const logs = [...state.logs, line];
  set({ logs: logs.length > MAX_LOGS ? logs.slice(logs.length - MAX_LOGS) : logs });
}

export function clearLogs(): void {
  set({ logs: [] });
}

export function setDockTab(dockTab: DockTab): void {
  set({ dockTab });
}

export function setStage(stage: Stage): void {
  set({ stage });
}

/** Typing in the editor. Clears the staged flag: this is now the learner's text. */
export function setEditorSql(slug: string, sql: string): void {
  set({ editorSql: { ...state.editorSql, [slug]: sql }, stagedFor: null });
}

/**
 * Loads a statement into a lab's editor and brings that editor forward —
 * sending SQL to a pane the learner cannot see would be a dead end.
 *
 * Whether it also executes is the learner's setting, not ours. With auto-run
 * off the statement waits, which is the difference between offering an example
 * and running one on somebody's behalf.
 */
export function loadEditorSql(slug: string, sql: string): void {
  set({
    editorSql: { ...state.editorSql, [slug]: sql },
    stage: "lab",
    stagedFor: state.autoRun ? null : slug,
  });
  if (state.autoRun) run(sql);
}

export function setAutoRun(autoRun: boolean): void {
  set({ autoRun });
  try {
    localStorage.setItem(AUTORUN_KEY, autoRun ? "1" : "0");
  } catch {
    // Preference still applies for this session.
  }
}

/**
 * Reads persisted preferences after mount. Kept out of the initial snapshot so
 * the server and the first client render agree.
 */
export function restorePreferences(): void {
  try {
    const stored = localStorage.getItem(AUTORUN_KEY);
    if (stored === "1") set({ autoRun: true });
  } catch {
    // Nothing to restore.
  }
}

async function build(mode: "initial" | "reset"): Promise<void> {
  try {
    const next = await createDatabase(SEED_SQL);
    db?.close();
    db = next;
    set({
      status: "ready",
      error: null,
      version: state.version + 1,
      resetting: false,
      outcome: mode === "reset" ? null : state.outcome,
    });
    log(
      "ok",
      mode === "reset"
        ? "Database reset. Every table is back to its original state."
        : `SQLite ready. ${ALL_TABLES.length} tables seeded and waiting.`,
    );
  } catch (cause) {
    const message =
      cause instanceof Error ? cause.message : "Could not start SQLite.";
    set({ status: "error", error: message, resetting: false });
    log("error", message);
  }
}

/** Boots the database once per session. Safe to call from every mount. */
export function ensureDatabase(): void {
  if (booting) return;
  booting = build("initial");
}

/** Rebuilds from the seed script — the classroom's undo button. */
export function resetDatabase(): void {
  set({ resetting: true, status: "loading" });
  booting = build("reset");
}

/**
 * Executes SQL and records it. Never throws: a SQL error is data here, because a
 * failed query is a normal part of learning and belongs in the console rather
 * than in an error boundary.
 */
export function run(sql: string, options: RunOptions = {}): QueryOutcome | null {
  const trimmed = sql.trim();
  if (!db || !trimmed) return null;

  const outcome = runSql(db, trimmed);
  const readOnly = isReadOnly(trimmed);
  const patch: Partial<PlaygroundState> = {};

  if (!options.silent) {
    patch.outcome = outcome;
    patch.lastSql = trimmed;
    patch.runCount = state.runCount + 1;
    patch.stagedFor = null;
    if (!options.keepTab) patch.dockTab = "result";
  }
  if (!outcome.error && !readOnly) {
    patch.version = state.version + 1;
  }
  if (Object.keys(patch).length > 0) set(patch);

  if (!options.silent) {
    log("sql", options.label ?? trimmed);
    if (outcome.error) {
      log("error", outcome.error);
    } else {
      const rows = outcome.sets[0]?.values.length ?? 0;
      log(
        "ok",
        readOnly
          ? `${rows} ${rows === 1 ? "row" : "rows"} in ${outcome.ms} ms`
          : `${outcome.rowsModified} ${outcome.rowsModified === 1 ? "row" : "rows"} affected in ${outcome.ms} ms`,
      );
    }
  }

  return outcome;
}

/** Reads a single result set without touching the console or the dock. */
export function read(sql: string): ResultSet | null {
  if (!db) return null;
  return query(db, sql);
}
