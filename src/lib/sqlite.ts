/**
 * Browser SQLite, via sql.js.
 *
 * The runtime is loaded as a static script from `/sql/sql-wasm.js` rather than
 * imported, because sql.js ships a UMD bundle that probes for `require` and
 * `__dirname` to find its own .wasm file — behaviour bundlers either rewrite or
 * reject. A script tag keeps the ~700 KB wasm binary out of the app bundle and
 * independently cacheable. `scripts/copy-sql-wasm.mjs` puts both files in place.
 *
 * Everything here is synchronous once loaded, which is what makes the
 * playground feel instant: a query is a function call, not a round trip.
 */

export type SqlValue = number | string | Uint8Array | null;

/** One result set, in sql.js's column/rows shape. */
export interface ResultSet {
  columns: string[];
  values: SqlValue[][];
}

export interface SqlDatabase {
  /** Executes one or more statements, discarding results. */
  run(sql: string, params?: SqlValue[]): void;
  /** Executes one or more statements, returning a result set per SELECT. */
  exec(sql: string, params?: SqlValue[]): ResultSet[];
  getRowsModified(): number;
  close(): void;
}

interface SqlJsStatic {
  Database: new (data?: ArrayLike<number> | null) => SqlDatabase;
}

type InitSqlJs = (config: {
  locateFile: (file: string) => string;
}) => Promise<SqlJsStatic>;

declare global {
  interface Window {
    initSqlJs?: InitSqlJs;
  }
}

const SCRIPT_SRC = "/sql/sql-wasm.js";
const SCRIPT_ID = "sqljs-runtime";

let runtime: Promise<SqlJsStatic> | null = null;

function loadScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    const existing = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;

    if (existing) {
      if (window.initSqlJs) {
        resolve();
        return;
      }
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener(
        "error",
        () => reject(new Error("Failed to load the SQLite runtime.")),
        { once: true },
      );
      return;
    }

    const script = document.createElement("script");
    script.id = SCRIPT_ID;
    script.src = SCRIPT_SRC;
    script.async = true;
    script.addEventListener("load", () => resolve(), { once: true });
    script.addEventListener(
      "error",
      () =>
        reject(
          new Error(
            "Could not load /sql/sql-wasm.js. Run `npm install` so the sql.js runtime is copied into public/sql.",
          ),
        ),
      { once: true },
    );
    document.head.append(script);
  });
}

/**
 * Resolves the sql.js module, loading the script and compiling the wasm on
 * first call and reusing it for the rest of the session.
 */
export function loadSqlJs(): Promise<SqlJsStatic> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("SQLite is only available in the browser."));
  }

  runtime ??= loadScript()
    .then(() => {
      const init = window.initSqlJs;
      if (!init) {
        throw new Error("The SQLite runtime loaded but did not register itself.");
      }
      return init({ locateFile: (file) => `/sql/${file}` });
    })
    .catch((error: unknown) => {
      // Don't cache a failure — a retry (or a fixed install) should be able to
      // succeed without a page reload.
      runtime = null;
      throw error;
    });

  return runtime;
}

/** Creates an empty database and applies the given schema/seed script. */
export async function createDatabase(seedSql: string): Promise<SqlDatabase> {
  const SQL = await loadSqlJs();
  const db = new SQL.Database();
  db.run(seedSql);
  return db;
}

export interface QueryOutcome {
  sql: string;
  /** Result sets, one per statement that returned rows. */
  sets: ResultSet[];
  /** Rows changed by the last INSERT/UPDATE/DELETE in the batch. */
  rowsModified: number;
  /** Wall-clock duration, rounded to two decimals. */
  ms: number;
  error?: string;
}

/**
 * Runs a batch and never throws — a SQL error is data here, because a failed
 * query is a normal part of learning and should render in the console rather
 * than break the lab.
 */
export function runSql(db: SqlDatabase, sql: string): QueryOutcome {
  const started = performance.now();
  try {
    const sets = db.exec(sql);
    return {
      sql,
      sets,
      rowsModified: db.getRowsModified(),
      ms: round(performance.now() - started),
    };
  } catch (error) {
    return {
      sql,
      sets: [],
      rowsModified: 0,
      ms: round(performance.now() - started),
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/** Single result set or null. For UI reads that shouldn't touch the console. */
export function query(db: SqlDatabase, sql: string): ResultSet | null {
  const outcome = runSql(db, sql);
  return outcome.sets[0] ?? null;
}

/** First column of the first row, coerced to a number. Handy for COUNT(*). */
export function queryValue(db: SqlDatabase, sql: string): number {
  const set = query(db, sql);
  const raw = set?.values[0]?.[0];
  return typeof raw === "number" ? raw : Number(raw ?? 0);
}

/** Result set as objects keyed by column name. */
export function queryRows(
  db: SqlDatabase,
  sql: string,
): Record<string, SqlValue>[] {
  const set = query(db, sql);
  if (!set) return [];
  return set.values.map((row) => {
    const record: Record<string, SqlValue> = {};
    set.columns.forEach((column, i) => {
      record[column] = row[i] ?? null;
    });
    return record;
  });
}

/** Column metadata from PRAGMA table_info, used by metadata validation. */
export interface ColumnInfo {
  name: string;
  type: string;
  notNull: boolean;
  primaryKey: boolean;
}

export function tableInfo(db: SqlDatabase, table: string): ColumnInfo[] {
  // Table names come from our own seeded catalogue, never from user input, and
  // PRAGMA does not accept bound parameters for the table name.
  const set = query(db, `PRAGMA table_info(${quoteIdent(table)});`);
  if (!set) return [];
  const index = (name: string) => set.columns.indexOf(name);
  return set.values.map((row) => ({
    name: String(row[index("name")] ?? ""),
    type: String(row[index("type")] ?? ""),
    notNull: Number(row[index("notnull")] ?? 0) === 1,
    primaryKey: Number(row[index("pk")] ?? 0) > 0,
  }));
}

/** SQLite's own plan for a query — the source for the execution timeline. */
export function explain(db: SqlDatabase, sql: string): string[] {
  const trimmed = stripTrailingSemicolon(sql);
  if (!trimmed) return [];
  const set = query(db, `EXPLAIN QUERY PLAN ${trimmed};`);
  if (!set) return [];
  const detail = set.columns.indexOf("detail");
  return set.values.map((row) => String(row[detail === -1 ? 3 : detail] ?? ""));
}

export function quoteIdent(name: string): string {
  return `"${name.replace(/"/g, '""')}"`;
}

export function stripTrailingSemicolon(sql: string): string {
  return sql.trim().replace(/;+\s*$/, "");
}

/** True when the batch only reads. Decides whether the UI must refresh tables. */
export function isReadOnly(sql: string): boolean {
  return !/\b(insert|update|delete|drop|create|alter|replace|truncate|vacuum|attach|pragma)\b/i.test(
    sql,
  );
}

/**
 * Splits a batch into individual statements. Quote- and comment-aware, because
 * the seed script and lab snippets both contain semicolons inside strings and
 * `--` comments.
 */
export function splitStatements(sql: string): string[] {
  const statements: string[] = [];
  let current = "";
  let quote: "'" | '"' | null = null;
  let lineComment = false;
  let blockComment = false;

  for (let i = 0; i < sql.length; i += 1) {
    const char = sql[i];
    const next = sql[i + 1];

    if (lineComment) {
      current += char;
      if (char === "\n") lineComment = false;
      continue;
    }

    if (blockComment) {
      current += char;
      if (char === "*" && next === "/") {
        current += next;
        i += 1;
        blockComment = false;
      }
      continue;
    }

    if (quote) {
      current += char;
      // '' and "" are escaped quotes, not the end of the literal.
      if (char === quote) {
        if (next === quote) {
          current += next;
          i += 1;
        } else {
          quote = null;
        }
      }
      continue;
    }

    if (char === "-" && next === "-") {
      lineComment = true;
      current += char;
      continue;
    }
    if (char === "/" && next === "*") {
      blockComment = true;
      current += char;
      continue;
    }
    if (char === "'" || char === '"') {
      quote = char;
      current += char;
      continue;
    }
    if (char === ";") {
      if (current.trim()) statements.push(current.trim());
      current = "";
      continue;
    }

    current += char;
  }

  if (current.trim()) statements.push(current.trim());
  return statements;
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}

/** Locale-aware display for a cell, with NULL rendered as a distinct token. */
export function formatCell(value: SqlValue): string {
  if (value === null) return "NULL";
  if (typeof value === "number") {
    return Number.isInteger(value)
      ? value.toLocaleString("en-IN")
      : value.toLocaleString("en-IN", { maximumFractionDigits: 2 });
  }
  if (value instanceof Uint8Array) return `<blob ${value.length}b>`;
  return value;
}
