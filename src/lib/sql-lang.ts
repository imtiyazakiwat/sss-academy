/**
 * A small SQL language layer: tokeniser, formatter and completion vocabulary.
 *
 * Deliberately not Monaco. The editor needs highlighting, line numbers,
 * autocomplete and a formatter — about 250 lines of work — where Monaco would
 * add several megabytes to a page whose stated budget is a two-second load, and
 * it would be the heaviest thing in a codebase that hand-rolls its own class
 * combiner. This keeps the playground instant and offline-capable.
 */

export type TokenKind =
  | "keyword"
  | "type"
  | "function"
  | "string"
  | "number"
  | "comment"
  | "operator"
  | "punctuation"
  | "identifier"
  | "whitespace";

export interface Token {
  kind: TokenKind;
  value: string;
}

/** Clause-level words the formatter breaks lines on. */
const MAJOR_KEYWORDS = [
  "SELECT",
  "FROM",
  "WHERE",
  "GROUP BY",
  "HAVING",
  "ORDER BY",
  "LIMIT",
  "OFFSET",
  "UNION ALL",
  "UNION",
  "EXCEPT",
  "INTERSECT",
  "INSERT INTO",
  "VALUES",
  "UPDATE",
  "SET",
  "DELETE FROM",
  "WITH",
];

const JOIN_KEYWORDS = [
  "LEFT OUTER JOIN",
  "RIGHT OUTER JOIN",
  "FULL OUTER JOIN",
  "LEFT JOIN",
  "RIGHT JOIN",
  "FULL JOIN",
  "INNER JOIN",
  "CROSS JOIN",
  "JOIN",
];

const KEYWORDS = new Set([
  "ADD", "ALL", "ALTER", "AND", "AS", "ASC", "AUTOINCREMENT", "BEGIN", "BETWEEN",
  "BY", "CASE", "CAST", "CHECK", "COLLATE", "COMMIT", "CONSTRAINT", "CREATE",
  "CROSS", "CURRENT", "DEFAULT", "DELETE", "DESC", "DISTINCT", "DROP", "ELSE",
  "END", "ESCAPE", "EXCEPT", "EXISTS", "EXPLAIN", "FOLLOWING", "FOREIGN", "FROM",
  "FULL", "GROUP", "HAVING", "IF", "IN", "INDEX", "INNER", "INSERT", "INTERSECT",
  "INTO", "IS", "JOIN", "KEY", "LEFT", "LIKE", "LIMIT", "NATURAL", "NOT", "NULL",
  "NULLS", "OFFSET", "ON", "OR", "ORDER", "OUTER", "OVER", "PARTITION", "PRAGMA",
  "PRECEDING", "PRIMARY", "RECURSIVE", "REFERENCES", "RENAME", "REPLACE",
  "RETURNING", "RIGHT", "ROLLBACK", "ROW", "ROWS", "SELECT", "SET", "TABLE",
  "THEN", "TRANSACTION", "UNBOUNDED", "UNION", "UNIQUE", "UPDATE", "USING",
  "VALUES", "VIEW", "WHEN", "WHERE", "WINDOW", "WITH",
]);

const TYPES = new Set([
  "BLOB", "BOOLEAN", "CHAR", "DATE", "DATETIME", "DECIMAL", "DOUBLE", "FLOAT",
  "INT", "INTEGER", "NUMERIC", "REAL", "SMALLINT", "TEXT", "TIME", "TIMESTAMP",
  "VARCHAR",
]);

const FUNCTIONS = new Set([
  "ABS", "AVG", "COALESCE", "COUNT", "CUME_DIST", "DATE", "DATETIME",
  "DENSE_RANK", "FIRST_VALUE", "GROUP_CONCAT", "IFNULL", "INSTR", "JULIANDAY",
  "LAG", "LAST_VALUE", "LEAD", "LENGTH", "LOWER", "LTRIM", "MAX", "MIN",
  "NTILE", "NULLIF", "PERCENT_RANK", "PRINTF", "RANDOM", "RANK", "REPLACE",
  "ROUND", "ROW_NUMBER", "RTRIM", "STRFTIME", "SUBSTR", "SUM", "TIME", "TOTAL",
  "TRIM", "TYPEOF", "UPPER",
]);

const WORD_START = /[A-Za-z_]/;
const WORD_PART = /[A-Za-z0-9_$]/;
const DIGIT = /[0-9]/;

/**
 * Tokenises SQL for display. Lossless — concatenating every token's value
 * returns the input exactly, which is what lets the highlight layer sit
 * pixel-aligned under a transparent textarea.
 */
export function tokenize(sql: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;

  const push = (kind: TokenKind, value: string) => {
    const last = tokens[tokens.length - 1];
    if (last && last.kind === kind && kind === "whitespace") {
      last.value += value;
      return;
    }
    tokens.push({ kind, value });
  };

  while (i < sql.length) {
    const char = sql[i];

    if (char === "-" && sql[i + 1] === "-") {
      const end = sql.indexOf("\n", i);
      const stop = end === -1 ? sql.length : end;
      push("comment", sql.slice(i, stop));
      i = stop;
      continue;
    }

    if (char === "/" && sql[i + 1] === "*") {
      const end = sql.indexOf("*/", i + 2);
      const stop = end === -1 ? sql.length : end + 2;
      push("comment", sql.slice(i, stop));
      i = stop;
      continue;
    }

    if (char === "'" || char === '"' || char === "`") {
      let j = i + 1;
      while (j < sql.length) {
        if (sql[j] === char) {
          if (sql[j + 1] === char) {
            j += 2;
            continue;
          }
          j += 1;
          break;
        }
        j += 1;
      }
      // Double-quoted text is an identifier in SQL, not a string literal.
      push(char === "'" ? "string" : "identifier", sql.slice(i, j));
      i = j;
      continue;
    }

    if (DIGIT.test(char) || (char === "." && DIGIT.test(sql[i + 1] ?? ""))) {
      let j = i;
      while (j < sql.length && /[0-9._eE]/.test(sql[j])) j += 1;
      push("number", sql.slice(i, j));
      i = j;
      continue;
    }

    if (WORD_START.test(char)) {
      let j = i;
      while (j < sql.length && WORD_PART.test(sql[j])) j += 1;
      const word = sql.slice(i, j);
      const upper = word.toUpperCase();

      // A word immediately followed by "(" reads as a call, which catches
      // user-defined and less common functions too.
      let k = j;
      while (k < sql.length && /\s/.test(sql[k])) k += 1;
      const isCall = sql[k] === "(";

      if (KEYWORDS.has(upper)) push("keyword", word);
      else if (TYPES.has(upper)) push("type", word);
      else if (FUNCTIONS.has(upper) || isCall) push("function", word);
      else push("identifier", word);

      i = j;
      continue;
    }

    if (/\s/.test(char)) {
      let j = i;
      while (j < sql.length && /\s/.test(sql[j])) j += 1;
      push("whitespace", sql.slice(i, j));
      i = j;
      continue;
    }

    if ("+-*/%<>=!|&~".includes(char)) {
      let j = i;
      while (j < sql.length && "+-*/%<>=!|&~".includes(sql[j])) j += 1;
      push("operator", sql.slice(i, j));
      i = j;
      continue;
    }

    push("punctuation", char);
    i += 1;
  }

  return tokens;
}

/**
 * Opinionated, single-pass formatter: one clause per line, joins on their own
 * line, and the body of a parenthesised subquery indented one level.
 *
 * It works on the token stream rather than with regexes, so semicolons and
 * keywords inside string literals and comments are left alone.
 */
export function formatSql(sql: string): string {
  const tokens = tokenize(sql).filter((token) => token.kind !== "whitespace");
  if (tokens.length === 0) return sql;

  const words = tokens.map((token) =>
    token.kind === "keyword" || token.kind === "type"
      ? { ...token, value: token.value.toUpperCase() }
      : token,
  );

  let out = "";
  let depth = 0;
  let atLineStart = true;

  /**
   * What each open bracket is for.
   *
   *   inline — a function call or a type width: `SUM(amount)`, `VARCHAR(50)`
   *   block  — a subquery, which gets its own indented lines
   *   list   — a definition list, which breaks after every comma
   *
   * Without the distinction a pasted one-line CREATE TABLE stayed one line
   * however many times you pressed Format, which is the whole reason anyone
   * reaches for the formatter after pasting.
   */
  const parens: ("inline" | "block" | "list")[] = [];
  /** Set when a statement header wants its next bracket treated as a list. */
  let listPending = false;

  const indent = () => "  ".repeat(Math.max(depth, 0));
  const newline = () => {
    out = out.replace(/[ \t]+$/, "");
    out += `\n${indent()}`;
    atLineStart = true;
  };
  const write = (text: string, spaceBefore = true) => {
    if (!atLineStart && spaceBefore) out += " ";
    out += text;
    atLineStart = false;
  };

  /** Longest multi-word keyword phrase starting at `index`, if any. */
  const matchPhrase = (index: number, phrases: string[]): string | null => {
    for (const phrase of phrases) {
      const parts = phrase.split(" ");
      const candidate = words
        .slice(index, index + parts.length)
        .map((token) => token.value.toUpperCase());
      if (
        candidate.length === parts.length &&
        candidate.every((value, k) => value === parts[k])
      ) {
        return phrase;
      }
    }
    return null;
  };

  for (let i = 0; i < words.length; i += 1) {
    const token = words[i];
    const value = token.value;

    if (token.kind === "comment") {
      if (!atLineStart) newline();
      write(value, false);
      newline();
      continue;
    }

    if (value === "(") {
      // A call or a type width binds tight to the name before it: SUM(amount),
      // VARCHAR(50). Everything else reads better with a space: VALUES (…).
      const previous = words[i - 1];
      // A definition list always takes a space — `CREATE TABLE t (` — even
      // though the tokeniser sees `t(` and calls it a function.
      const tight =
        !listPending &&
        (previous?.kind === "function" || previous?.kind === "type");
      write("(", !tight && !atLineStart && !/\($/.test(out.trimEnd()));

      const next = words[i + 1];
      const isSubquery =
        next && ["SELECT", "WITH", "VALUES"].includes(next.value.toUpperCase());

      if (listPending) {
        parens.push("list");
        listPending = false;
        depth += 1;
        newline();
      } else if (isSubquery) {
        parens.push("block");
        depth += 1;
        newline();
      } else {
        parens.push("inline");
      }
      continue;
    }

    if (value === ")") {
      // Close on its own line only if this bracket opened one.
      if (parens.pop() !== "inline") {
        depth = Math.max(depth - 1, 0);
        newline();
      }
      write(")", false);
      continue;
    }

    if (value === ";") {
      write(";", false);
      parens.length = 0;
      listPending = false;
      if (i < words.length - 1) {
        depth = 0;
        newline();
        newline();
      }
      continue;
    }

    if (value === ",") {
      write(",", false);
      // One column, constraint or tuple per line inside a definition list.
      if (parens[parens.length - 1] === "list") newline();
      continue;
    }

    if (token.kind === "keyword") {
      // CREATE or ALTER TABLE: the next top-level bracket is a column list, so
      // it breaks one per line. Checked on TABLE rather than on CREATE so that
      // `CREATE TEMP TABLE` and `IF NOT EXISTS` need no special casing. Index
      // and view brackets are left inline — they are short by nature.
      if (
        value === "TABLE" &&
        parens.length === 0 &&
        words
          .slice(Math.max(0, i - 3), i)
          .some((word) => ["CREATE", "ALTER"].includes(word.value.toUpperCase()))
      ) {
        listPending = true;
      }

      const major = matchPhrase(i, MAJOR_KEYWORDS);
      if (major) {
        if (out.trim()) newline();
        write(major, false);
        i += major.split(" ").length - 1;
        continue;
      }

      const join = matchPhrase(i, JOIN_KEYWORDS);
      if (join) {
        if (out.trim()) newline();
        write(join, false);
        i += join.split(" ").length - 1;
        continue;
      }

      if (["AND", "OR"].includes(value) && depth === 0 && out.includes("\n")) {
        newline();
        write(`  ${value}`, false);
        continue;
      }
    }

    write(value, !/[(.]$/.test(out) && value !== ".");
    if (value === ".") atLineStart = false;
  }

  return out
    .split("\n")
    .map((line) => line.replace(/\s+$/, ""))
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export interface Completion {
  label: string;
  detail: string;
  kind: "keyword" | "function" | "table" | "column";
}

/**
 * Builds the completion vocabulary from the live schema, so suggestions are
 * always the tables and columns that actually exist rather than a static list.
 */
export function buildCompletions(
  schema: Record<string, string[]>,
): Completion[] {
  const items: Completion[] = [];

  for (const [table, columns] of Object.entries(schema)) {
    items.push({ label: table, detail: `table · ${columns.length} columns`, kind: "table" });
  }

  const seen = new Map<string, string[]>();
  for (const [table, columns] of Object.entries(schema)) {
    for (const column of columns) {
      const owners = seen.get(column) ?? [];
      owners.push(table);
      seen.set(column, owners);
    }
  }
  for (const [column, owners] of seen) {
    items.push({
      label: column,
      detail:
        owners.length > 3
          ? `column · ${owners.length} tables`
          : `column · ${owners.join(", ")}`,
      kind: "column",
    });
  }

  for (const keyword of KEYWORDS) {
    items.push({ label: keyword, detail: "keyword", kind: "keyword" });
  }
  for (const fn of FUNCTIONS) {
    items.push({ label: `${fn}(`, detail: "function", kind: "function" });
  }

  return items;
}

/** Ranks completions for a prefix: exact start beats substring, tables first. */
export function filterCompletions(
  completions: Completion[],
  prefix: string,
  limit = 8,
): Completion[] {
  if (!prefix) return [];
  const needle = prefix.toLowerCase();
  const weight: Record<Completion["kind"], number> = {
    table: 0,
    column: 1,
    function: 2,
    keyword: 3,
  };

  return completions
    .map((item) => {
      const label = item.label.toLowerCase();
      if (label === needle) return null;
      const index = label.indexOf(needle);
      if (index === -1) return null;
      return { item, score: index === 0 ? 0 : 1, index };
    })
    .filter((entry): entry is { item: Completion; score: number; index: number } =>
      Boolean(entry),
    )
    .sort(
      (a, b) =>
        a.score - b.score ||
        weight[a.item.kind] - weight[b.item.kind] ||
        a.item.label.length - b.item.label.length ||
        a.item.label.localeCompare(b.item.label),
    )
    .slice(0, limit)
    .map((entry) => entry.item);
}

/** The identifier fragment immediately left of the caret. */
export function wordBeforeCaret(value: string, caret: number): string {
  let start = caret;
  while (start > 0 && WORD_PART.test(value[start - 1])) start -= 1;
  return value.slice(start, caret);
}

/** True when the caret sits inside a string literal or comment. */
export function inLiteralOrComment(value: string, caret: number): boolean {
  const before = value.slice(0, caret);
  const lastNewline = before.lastIndexOf("\n");
  const line = before.slice(lastNewline + 1);
  if (line.includes("--")) return true;

  const singles = (before.match(/'/g) ?? []).length;
  if (singles % 2 === 1) return true;

  const openBlock = before.lastIndexOf("/*");
  const closeBlock = before.lastIndexOf("*/");
  return openBlock > closeBlock;
}
