/**
 * Live database map.
 *
 * Everything here is read from SQLite at call time — `sqlite_master`,
 * `PRAGMA table_info` and `PRAGMA foreign_key_list` — never from a hard-coded
 * list. That is the difference between a diagram of the seed script and a
 * diagram of the database: a table a student creates mid-session shows up, a
 * table they drop disappears, and a column they add appears on the card.
 *
 * The curated groups in lab-seed are still used, but only for lane order and the
 * teaching note. They no longer decide what exists.
 */

import { TABLE_GROUPS } from "@/content/lab-seed";
import { read } from "@/lib/playground-store";
import { quoteIdent } from "@/lib/sqlite";

export interface DbColumn {
  name: string;
  type: string;
  pk: boolean;
  notNull: boolean;
  /** Set when a declared foreign key starts at this column. */
  references?: { table: string; column: string };
}

export interface DbTable {
  name: string;
  kind: "table" | "view";
  columns: DbColumn[];
  rows: number;
  group: string;
  note?: string;
  /** False for anything the learner created this session. */
  seeded: boolean;
}

export type EdgeKind = "declared" | "inferred" | "flow";

export interface DbEdge {
  id: string;
  from: string;
  fromColumn: string;
  to: string;
  toColumn: string;
  kind: EdgeKind;
  label: string;
}

export interface DatabaseMap {
  tables: DbTable[];
  edges: DbEdge[];
}

export const SESSION_GROUP = "Created in this session";

/**
 * ETL lineage the schema cannot declare.
 *
 * src → stg → tgt is a data flow, not a foreign key, so SQLite knows nothing
 * about it. It is curated here and drawn in its own style, clearly labelled, so
 * the map never implies the engine enforces it.
 */
const LINEAGE: { from: string; to: string; label: string }[] = [
  { from: "src_sales", to: "stg_sales", label: "extract → stage" },
  { from: "stg_sales", to: "tgt_sales", label: "stage → load" },
  { from: "orders", to: "fact_sales", label: "source → fact" },
];

const GROUP_ORDER = TABLE_GROUPS.map((group) => group.label);

function lookupSeed(name: string): { group: string; note: string } | null {
  for (const group of TABLE_GROUPS) {
    const table = group.tables.find((entry) => entry.name === name);
    if (table) return { group: group.label, note: table.note };
  }
  return null;
}

function readColumns(table: string): DbColumn[] {
  const info = read(`PRAGMA table_info(${quoteIdent(table)});`);
  if (!info) return [];

  const index = {
    name: info.columns.indexOf("name"),
    type: info.columns.indexOf("type"),
    notNull: info.columns.indexOf("notnull"),
    pk: info.columns.indexOf("pk"),
  };

  return info.values.map((row) => ({
    name: String(row[index.name] ?? ""),
    type: String(row[index.type] ?? "").toUpperCase(),
    notNull: Number(row[index.notNull] ?? 0) === 1,
    pk: Number(row[index.pk] ?? 0) > 0,
  }));
}

function readForeignKeys(
  table: string,
): { from: string; to: string; column: string; target: string }[] {
  const list = read(`PRAGMA foreign_key_list(${quoteIdent(table)});`);
  if (!list) return [];

  const index = {
    table: list.columns.indexOf("table"),
    from: list.columns.indexOf("from"),
    to: list.columns.indexOf("to"),
  };

  return list.values.map((row) => ({
    from: table,
    to: String(row[index.table] ?? ""),
    column: String(row[index.from] ?? ""),
    target: String(row[index.to] ?? ""),
  }));
}

function countRows(table: string): number {
  const set = read(`SELECT COUNT(*) FROM ${quoteIdent(table)};`);
  return Number(set?.values[0]?.[0] ?? 0);
}

export function readDatabaseMap(): DatabaseMap {
  const master = read(
    `SELECT name, type FROM sqlite_master
      WHERE type IN ('table','view') AND name NOT LIKE 'sqlite_%'
      ORDER BY name;`,
  );
  if (!master) return { tables: [], edges: [] };

  const tables: DbTable[] = [];
  const edges: DbEdge[] = [];
  const declaredPairs = new Set<string>();

  for (const row of master.values) {
    const name = String(row[0] ?? "");
    if (!name) continue;
    const kind = String(row[1] ?? "table") === "view" ? "view" : "table";
    const seed = lookupSeed(name);
    const columns = readColumns(name);

    if (kind === "table") {
      for (const fk of readForeignKeys(name)) {
        const column = columns.find((entry) => entry.name === fk.column);
        if (column) column.references = { table: fk.to, column: fk.target };
        declaredPairs.add(`${name}>${fk.to}`);
        edges.push({
          id: `declared:${name}.${fk.column}->${fk.to}.${fk.target}`,
          from: name,
          fromColumn: fk.column,
          to: fk.to,
          toColumn: fk.target,
          kind: "declared",
          label: fk.column,
        });
      }
    }

    tables.push({
      name,
      kind,
      columns,
      rows: countRows(name),
      group: seed?.group ?? SESSION_GROUP,
      note: seed?.note,
      seeded: Boolean(seed),
    });
  }

  const byName = new Map(tables.map((table) => [table.name, table]));

  /**
   * Single-column primary keys, for inferring the joins nobody declared.
   *
   * Keyed column name → every table claiming it, because two tables can both
   * call their key `customer_id`. Where that happens the name cannot identify a
   * target, so no edge is drawn: a map that guesses wrong is worse than one that
   * admits it does not know. Composite keys are skipped for the same reason —
   * one column of a two-column key does not identify a row.
   */
  const primaryKeys = new Map<string, Set<string>>();
  for (const table of tables) {
    const pks = table.columns.filter((column) => column.pk);
    if (pks.length !== 1) continue;
    const owners = primaryKeys.get(pks[0].name) ?? new Set<string>();
    owners.add(table.name);
    primaryKeys.set(pks[0].name, owners);
  }

  for (const table of tables) {
    for (const column of table.columns) {
      if (column.pk || column.references) continue;
      const owners = primaryKeys.get(column.name);
      if (!owners || owners.size !== 1) continue;
      const owner = [...owners][0];
      if (owner === table.name) continue;
      if (declaredPairs.has(`${table.name}>${owner}`)) continue;
      // Only key-shaped names, so a shared `city` never becomes a relationship.
      if (!/_(id|key)$/i.test(column.name)) continue;

      edges.push({
        id: `inferred:${table.name}.${column.name}->${owner}`,
        from: table.name,
        fromColumn: column.name,
        to: owner,
        toColumn: column.name,
        kind: "inferred",
        label: column.name,
      });
    }
  }

  for (const link of LINEAGE) {
    if (!byName.has(link.from) || !byName.has(link.to)) continue;
    edges.push({
      id: `flow:${link.from}->${link.to}`,
      from: link.from,
      fromColumn: "",
      to: link.to,
      toColumn: "",
      kind: "flow",
      label: link.label,
    });
  }

  return { tables, edges };
}

/* ------------------------------------------------------------------ *
 * Layout
 * ------------------------------------------------------------------ */

export const NODE_WIDTH = 232;
const NODE_HEADER = 52;
const ROW_HEIGHT = 17;
const NODE_PAD = 12;
export const MAX_VISIBLE_COLUMNS = 11;
const LANE_GAP = 108;
const NODE_GAP = 28;
const COLUMN_GAP = 26;
/**
 * A lane taller than this wraps into a second column.
 *
 * Six source tables stacked in one lane made the map about 1200px tall and 230px
 * wide per group, so fit-to-view opened at roughly a third scale — legible as
 * shapes, useless as a schema. Wrapping keeps the whole thing closer to the
 * shape of a screen.
 */
const MAX_LANE_HEIGHT = 760;

export interface LaidOutTable extends DbTable {
  x: number;
  y: number;
  width: number;
  height: number;
  /** Columns actually drawn on the card. */
  visibleColumns: DbColumn[];
  hiddenColumns: number;
}

export interface Layout {
  nodes: LaidOutTable[];
  lanes: { label: string; x: number; width: number }[];
  width: number;
  height: number;
}

export function nodeHeight(table: DbTable): number {
  const visible = Math.min(table.columns.length, MAX_VISIBLE_COLUMNS);
  const extra = table.columns.length > MAX_VISIBLE_COLUMNS ? ROW_HEIGHT : 0;
  return NODE_HEADER + NODE_PAD + visible * ROW_HEIGHT + extra + NODE_PAD;
}

/**
 * Lane layout: one column per curated group, in the order the data flows.
 *
 * A force simulation was the alternative and it was the wrong tool — the whole
 * point of these groups is that source, staging, warehouse and SCD are *stages*,
 * and a physics layout would scramble exactly the structure the lab is teaching.
 */
export function layoutDatabase(map: DatabaseMap): Layout {
  const groups = new Map<string, DbTable[]>();
  for (const table of map.tables) {
    const list = groups.get(table.group) ?? [];
    list.push(table);
    groups.set(table.group, list);
  }

  const order = [
    ...GROUP_ORDER.filter((label) => groups.has(label)),
    ...[...groups.keys()].filter((label) => !GROUP_ORDER.includes(label)),
  ];

  const nodes: LaidOutTable[] = [];
  const lanes: { label: string; x: number; width: number }[] = [];
  const TOP = 96;
  let x = 56;
  let tallest = 0;

  for (const label of order) {
    const members = groups.get(label) ?? [];
    let column = 0;
    let y = TOP;
    let laneWidth = NODE_WIDTH;

    for (const table of members) {
      const height = nodeHeight(table);

      // Wrap into the next column rather than growing the lane indefinitely.
      if (y > TOP && y + height > TOP + MAX_LANE_HEIGHT) {
        column += 1;
        y = TOP;
        laneWidth = (column + 1) * NODE_WIDTH + column * COLUMN_GAP;
      }

      nodes.push({
        ...table,
        x: x + column * (NODE_WIDTH + COLUMN_GAP),
        y,
        width: NODE_WIDTH,
        height,
        visibleColumns: table.columns.slice(0, MAX_VISIBLE_COLUMNS),
        hiddenColumns: Math.max(0, table.columns.length - MAX_VISIBLE_COLUMNS),
      });
      y += height + NODE_GAP;
      tallest = Math.max(tallest, y);
    }

    lanes.push({ label, x, width: laneWidth });
    x += laneWidth + LANE_GAP;
  }

  return {
    nodes,
    lanes,
    width: Math.max(x - LANE_GAP + 56, 800),
    height: Math.max(tallest + 48, 600),
  };
}

/** Anchor points for an edge, chosen so lines leave and enter on facing sides. */
export function edgeAnchors(
  from: LaidOutTable,
  to: LaidOutTable,
  fromColumn?: string,
): { x1: number; y1: number; x2: number; y2: number } {
  const columnIndex = fromColumn
    ? from.visibleColumns.findIndex((column) => column.name === fromColumn)
    : -1;
  const y1 =
    columnIndex >= 0
      ? from.y + NODE_HEADER + NODE_PAD + columnIndex * ROW_HEIGHT + ROW_HEIGHT / 2
      : from.y + from.height / 2;

  const leftToRight = to.x >= from.x + from.width;
  const rightToLeft = to.x + to.width <= from.x;

  if (leftToRight) {
    return {
      x1: from.x + from.width,
      y1,
      x2: to.x,
      y2: to.y + to.height / 2,
    };
  }
  if (rightToLeft) {
    return {
      x1: from.x,
      y1,
      x2: to.x + to.width,
      y2: to.y + to.height / 2,
    };
  }
  // Same lane: leave and re-enter on the right so the curve stays outside.
  return {
    x1: from.x + from.width,
    y1,
    x2: to.x + to.width,
    y2: to.y + to.height / 2,
  };
}

/** Horizontal cubic bezier — reads as a relationship, not a wire. */
export function edgePath(a: {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}): string {
  const delta = Math.max(36, Math.abs(a.x2 - a.x1) * 0.45);
  const c1 = a.x1 + (a.x2 >= a.x1 ? delta : -delta);
  const c2 = a.x2 - (a.x2 >= a.x1 ? delta : -delta);
  return `M ${a.x1} ${a.y1} C ${c1} ${a.y1}, ${c2} ${a.y2}, ${a.x2} ${a.y2}`;
}
