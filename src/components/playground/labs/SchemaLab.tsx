"use client";

import { useState } from "react";

import { useDb, useQuery } from "@/components/playground/DbProvider";
import { LabIntro, Panel, PillButton, Stat } from "@/components/playground/LabChrome";
import { ResultTable } from "@/components/playground/ResultTable";
import type { Lab } from "@/content/labs";
import { quoteIdent } from "@/lib/sqlite";
import { cn } from "@/lib/cn";

interface Node {
  table: string;
  label: string;
  role: "fact" | "dimension" | "outrigger";
  x: number;
  y: number;
  width: number;
  height: number;
  /** Foreign key on the fact table, for the join description. */
  key?: string;
  /** Only rendered when snowflake mode is on. */
  snowflakeOnly?: boolean;
  /** Query this node's Run button executes, in star form. */
  query?: string;
  /** Query used instead when snowflaked. */
  snowflakeQuery?: string;
}

const FACT = { x: 320, y: 200, width: 190, height: 96 };

const NODES: Node[] = [
  {
    table: "fact_sales",
    label: "fact_sales",
    role: "fact",
    ...FACT,
  },
  {
    table: "dim_date",
    label: "dim_date",
    role: "dimension",
    x: 50,
    y: 40,
    width: 170,
    height: 78,
    key: "date_key",
    query: `SELECT d.month_number, d.month_name, d.quarter,
       SUM(f.amount) AS revenue,
       SUM(f.quantity) AS units
FROM fact_sales f
JOIN dim_date d ON d.date_key = f.date_key
GROUP BY d.month_number, d.month_name, d.quarter
ORDER BY d.month_number;`,
  },
  {
    table: "dim_customer",
    label: "dim_customer",
    role: "dimension",
    x: 50,
    y: 378,
    width: 170,
    height: 78,
    key: "customer_key",
    query: `SELECT dc.segment, dc.state,
       COUNT(DISTINCT dc.customer_key) AS customers,
       SUM(f.amount) AS revenue
FROM fact_sales f
JOIN dim_customer dc ON dc.customer_key = f.customer_key
GROUP BY dc.segment, dc.state
ORDER BY revenue DESC;`,
  },
  {
    table: "dim_product",
    label: "dim_product",
    role: "dimension",
    x: 610,
    y: 40,
    width: 170,
    height: 78,
    key: "product_key",
    query: `SELECT dp.category, dp.brand,
       SUM(f.quantity) AS units,
       SUM(f.amount) AS revenue
FROM fact_sales f
JOIN dim_product dp ON dp.product_key = f.product_key
GROUP BY dp.category, dp.brand
ORDER BY revenue DESC;`,
    snowflakeQuery: `SELECT cat.category_group, cat.category_name, br.brand_name, br.country,
       SUM(f.amount) AS revenue
FROM fact_sales f
JOIN dim_product dp  ON dp.product_key = f.product_key
JOIN dim_category cat ON cat.category_key = dp.category_key
JOIN dim_brand br     ON br.brand_key = dp.brand_key
GROUP BY cat.category_group, cat.category_name, br.brand_name, br.country
ORDER BY revenue DESC;`,
  },
  {
    table: "dim_category",
    label: "dim_category",
    role: "outrigger",
    x: 610,
    y: 250,
    width: 170,
    height: 66,
    snowflakeOnly: true,
    query: `SELECT category_group, category_name FROM dim_category ORDER BY category_group;`,
  },
  {
    table: "dim_brand",
    label: "dim_brand",
    role: "outrigger",
    x: 610,
    y: 366,
    width: 170,
    height: 66,
    snowflakeOnly: true,
    query: `SELECT brand_name, country FROM dim_brand ORDER BY brand_name;`,
  },
];

const centre = (node: { x: number; y: number; width: number; height: number }) => ({
  x: node.x + node.width / 2,
  y: node.y + node.height / 2,
});

/**
 * Interactive star / snowflake diagram.
 *
 * Hand-drawn SVG rather than a graph library: six nodes with a fixed layout do
 * not need force simulation, and this way the shape stays legible and the whole
 * thing costs nothing to load. Clicking a dimension highlights its edge, lists
 * its real columns from PRAGMA, and runs the join that uses it.
 */
export function SchemaLab({ lab }: { lab: Lab }) {
  const { run, status } = useDb();
  const [snowflake, setSnowflake] = useState(false);
  const [selected, setSelected] = useState("dim_customer");

  const visible = NODES.filter((node) => !node.snowflakeOnly || snowflake);
  // Selecting dim_product and then collapsing to star must not leave a dangling
  // selection, so fall back to the first visible node.
  const selectedNode = visible.find((node) => node.table === selected) ?? visible[0];
  const activeQuery =
    snowflake && selectedNode.snowflakeQuery
      ? selectedNode.snowflakeQuery
      : (selectedNode.query ?? null);

  const columns = useQuery(`PRAGMA table_info(${quoteIdent(selectedNode.table)});`);
  const rowCount = useQuery(`SELECT COUNT(*) FROM ${quoteIdent(selectedNode.table)};`);
  const grain = useQuery(
    `SELECT COUNT(*) AS fact_rows,
            COUNT(DISTINCT order_id) AS distinct_orders,
            ROUND(SUM(amount), 2) AS total_revenue
     FROM fact_sales;`,
  );

  /**
   * Referential integrity, expressed as row counts. If a join to a dimension
   * returns fewer rows than the fact table, that dimension is not conformed and
   * revenue is silently disappearing.
   */
  const integritySql = `SELECT
  (SELECT COUNT(*) FROM fact_sales) AS fact_rows,
  (SELECT COUNT(*) FROM fact_sales f
     JOIN dim_date d ON d.date_key = f.date_key) AS joined_to_date,
  (SELECT COUNT(*) FROM fact_sales f
     JOIN dim_customer dc ON dc.customer_key = f.customer_key) AS joined_to_customer,
  (SELECT COUNT(*) FROM fact_sales f
     JOIN dim_product dp ON dp.product_key = f.product_key) AS joined_to_product;`;
  const integrity = useQuery(integritySql);

  const joinCount = activeQuery
    ? (activeQuery.match(/\bJOIN\b/gi) ?? []).length
    : 0;

  const factRow = grain?.values[0] ?? [];

  return (
    <div className="space-y-5">
      <LabIntro lab={lab} />

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat
          label="Fact rows"
          value={Number(factRow[0] ?? 0)}
          hint="one per delivered order line"
        />
        <Stat
          label="Distinct orders"
          value={Number(factRow[1] ?? 0)}
          hint="matches fact rows — grain is clean"
          tone={Number(factRow[0]) === Number(factRow[1]) ? "good" : "bad"}
        />
        <Stat
          label="Total revenue"
          value={`₹${Number(factRow[2] ?? 0).toLocaleString("en-IN")}`}
          hint="SUM(amount) across the fact table"
        />
      </div>

      <Panel
        title={snowflake ? "Snowflake schema" : "Star schema"}
        subtitle={
          snowflake
            ? "dim_product is normalised into category and brand levels — two extra joins per query."
            : "Every dimension is one join from the fact table."
        }
        actions={
          <PillButton onClick={() => setSnowflake((on) => !on)}>
            {snowflake ? "Collapse to star" : "Snowflake dim_product"}
          </PillButton>
        }
      >
        <svg
          viewBox="0 0 830 480"
          className="w-full"
          role="img"
          aria-label={`${snowflake ? "Snowflake" : "Star"} schema diagram. fact_sales joined to ${visible
            .filter((node) => node.role !== "fact")
            .map((node) => node.table)
            .join(", ")}.`}
        >
          {/* Edges first, so nodes paint over the line ends. */}
          {visible
            .filter((node) => node.role === "dimension")
            .map((node) => {
              const from = centre(FACT);
              const to = centre(node);
              const active = selected === node.table;
              return (
                <g key={`edge-${node.table}`}>
                  <line
                    x1={from.x}
                    y1={from.y}
                    x2={to.x}
                    y2={to.y}
                    stroke={active ? "#d95d39" : "rgba(255,255,255,0.16)"}
                    strokeWidth={active ? 2.5 : 1.5}
                    className="transition-all duration-300"
                  />
                  <text
                    x={(from.x + to.x) / 2}
                    y={(from.y + to.y) / 2 - 8}
                    textAnchor="middle"
                    className={cn(
                      "font-mono text-[11px] transition-colors duration-300",
                      active ? "fill-ember-200" : "fill-ink-500",
                    )}
                  >
                    {node.key}
                  </text>
                </g>
              );
            })}

          {snowflake
            ? visible
                .filter((node) => node.role === "outrigger")
                .map((node) => {
                  const product = NODES.find((n) => n.table === "dim_product");
                  if (!product) return null;
                  const from = centre(product);
                  const to = centre(node);
                  return (
                    <line
                      key={`edge-${node.table}`}
                      x1={from.x}
                      y1={from.y}
                      x2={to.x}
                      y2={to.y}
                      stroke="rgba(169,194,177,0.45)"
                      strokeWidth={1.5}
                      strokeDasharray="5 4"
                    />
                  );
                })
            : null}

          {visible.map((node) => {
            const active = selected === node.table;
            const isFact = node.role === "fact";
            return (
              <g
                key={node.table}
                onClick={() => setSelected(node.table)}
                className="cursor-pointer"
                tabIndex={0}
                role="button"
                aria-pressed={active}
                aria-label={`${node.table}, ${node.role}`}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    setSelected(node.table);
                  }
                }}
              >
                <rect
                  x={node.x}
                  y={node.y}
                  width={node.width}
                  height={node.height}
                  rx={14}
                  className="transition-all duration-300"
                  fill={
                    isFact
                      ? "rgba(217,93,57,0.14)"
                      : active
                        ? "rgba(95,136,114,0.22)"
                        : "rgba(255,255,255,0.04)"
                  }
                  stroke={
                    isFact
                      ? "rgba(217,93,57,0.55)"
                      : active
                        ? "rgba(169,194,177,0.75)"
                        : "rgba(255,255,255,0.14)"
                  }
                  strokeWidth={active || isFact ? 2 : 1}
                />
                <text
                  x={node.x + node.width / 2}
                  y={node.y + 28}
                  textAnchor="middle"
                  className="fill-white font-mono text-[13px] font-medium"
                >
                  {node.label}
                </text>
                <text
                  x={node.x + node.width / 2}
                  y={node.y + 48}
                  textAnchor="middle"
                  className={cn(
                    "text-[10px] uppercase",
                    isFact ? "fill-ember-200" : "fill-ink-400",
                  )}
                  style={{ letterSpacing: "0.12em" }}
                >
                  {node.role}
                </text>
                {isFact ? (
                  <text
                    x={node.x + node.width / 2}
                    y={node.y + 72}
                    textAnchor="middle"
                    className="fill-ink-300 font-mono text-[10px]"
                  >
                    quantity · amount
                  </text>
                ) : null}
              </g>
            );
          })}
        </svg>
      </Panel>

      <div className="grid gap-5 xl:grid-cols-12">
        <Panel
          title={selectedNode.table}
          subtitle={`${Number(rowCount?.values[0]?.[0] ?? 0).toLocaleString("en-IN")} rows · click any box in the diagram`}
          className="xl:col-span-5"
        >
          <ul className="space-y-1">
            {(columns?.values ?? []).map((row) => {
              const name = String(row[1] ?? "");
              const type = String(row[2] ?? "");
              const isKey = name.endsWith("_key");
              return (
                <li
                  key={name}
                  className={cn(
                    "flex items-baseline justify-between gap-3 rounded-lg px-2.5 py-1.5 font-mono text-[0.75rem]",
                    isKey ? "bg-violet-500/12 text-violet-100" : "text-ink-200",
                  )}
                >
                  <span>{name}</span>
                  <span className="text-ink-500">{type}</span>
                </li>
              );
            })}
          </ul>
        </Panel>

        <Panel
          title="The query this dimension serves"
          subtitle={`${joinCount} ${joinCount === 1 ? "join" : "joins"} in ${snowflake ? "snowflake" : "star"} form`}
          className="xl:col-span-7"
          actions={
            activeQuery ? (
              <PillButton
                tone="primary"
                onClick={() => run(activeQuery)}
                disabled={status !== "ready"}
              >
                Run query
              </PillButton>
            ) : undefined
          }
        >
          {activeQuery ? (
            <>
              <pre className="overflow-x-auto rounded-lg bg-navy-950/70 p-3 font-mono text-[0.75rem] leading-relaxed text-ink-200">
                {activeQuery}
              </pre>
              {selectedNode.table === "dim_product" ? (
                <p className="mt-3 text-[0.8125rem] leading-relaxed text-ink-400">
                  {snowflake
                    ? "Three joins instead of one, and the category group is now available. That is the snowflake trade-off in a single query."
                    : "One join, and category and brand are right there on the dimension. Redundant in storage, cheap at query time."}
                </p>
              ) : null}
            </>
          ) : (
            <p className="text-sm text-ink-400">
              Select a dimension to see the join it participates in.
            </p>
          )}
        </Panel>
      </div>

      <Panel
        title="Conformed dimension check"
        subtitle="Every fact row must resolve to exactly one row in each dimension — otherwise the join silently drops or duplicates revenue."
        actions={
          <PillButton onClick={() => run(integritySql)} disabled={status !== "ready"}>
            Run integrity check
          </PillButton>
        }
      >
        <ResultTable set={integrity} />
      </Panel>
    </div>
  );
}
