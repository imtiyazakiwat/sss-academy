"use client";

import { useCallback, useState } from "react";

import { useDb, useQuery } from "@/components/playground/DbProvider";
import {
  LabIntro,
  LabScroll,
  Panel,
  PillButton,
  Stat,
} from "@/components/playground/LabChrome";
import { ResultTable } from "@/components/playground/ResultTable";
import { SchemaMap } from "@/components/playground/SchemaMap";
import type { Lab } from "@/content/labs";
import type { DbTable } from "@/lib/db-map";
import { quoteIdent } from "@/lib/sqlite";
import { cn } from "@/lib/cn";

const STAR_GROUP = "Warehouse — star schema";
const SNOWFLAKE_GROUP = "Snowflake extension";

/** The join each dimension exists to serve, in star and snowflake form. */
const QUERIES: Record<string, { star: string; snowflake?: string }> = {
  dim_date: {
    star: `SELECT d.month_number, d.month_name, d.quarter,
       SUM(f.amount) AS revenue,
       SUM(f.quantity) AS units
FROM fact_sales f
JOIN dim_date d ON d.date_key = f.date_key
GROUP BY d.month_number, d.month_name, d.quarter
ORDER BY d.month_number;`,
  },
  dim_customer: {
    star: `SELECT dc.segment, dc.state,
       COUNT(DISTINCT dc.customer_key) AS customers,
       SUM(f.amount) AS revenue
FROM fact_sales f
JOIN dim_customer dc ON dc.customer_key = f.customer_key
GROUP BY dc.segment, dc.state
ORDER BY revenue DESC;`,
  },
  dim_product: {
    star: `SELECT dp.category, dp.brand,
       SUM(f.quantity) AS units,
       SUM(f.amount) AS revenue
FROM fact_sales f
JOIN dim_product dp ON dp.product_key = f.product_key
GROUP BY dp.category, dp.brand
ORDER BY revenue DESC;`,
    snowflake: `SELECT cat.category_group, cat.category_name, br.brand_name, br.country,
       SUM(f.amount) AS revenue
FROM fact_sales f
JOIN dim_product dp  ON dp.product_key = f.product_key
JOIN dim_category cat ON cat.category_key = dp.category_key
JOIN dim_brand br     ON br.brand_key = dp.brand_key
GROUP BY cat.category_group, cat.category_name, br.brand_name, br.country
ORDER BY revenue DESC;`,
  },
  dim_category: {
    star: `SELECT category_group, category_name FROM dim_category ORDER BY category_group;`,
  },
  dim_brand: {
    star: `SELECT brand_name, country FROM dim_brand ORDER BY brand_name;`,
  },
  fact_sales: {
    star: `SELECT order_id, date_key, customer_key, product_key, quantity, amount
FROM fact_sales
ORDER BY amount DESC
LIMIT 20;`,
  },
};

/**
 * Star and snowflake, on the live canvas.
 *
 * This used to be a hand-drawn SVG with six hard-coded nodes. It is now the real
 * schema map narrowed to the warehouse lanes, so the boxes carry actual columns
 * and the lines are the actual foreign keys SQLite has registered — and the
 * snowflake toggle genuinely brings the outrigger tables into the picture rather
 * than revealing decorations. Everything below the canvas still reads from PRAGMA.
 */
export function SchemaLab({ lab }: { lab: Lab }) {
  const { run, status } = useDb();
  const [snowflake, setSnowflake] = useState(false);
  const [selected, setSelected] = useState("dim_customer");

  const filter = useCallback(
    (table: DbTable) =>
      table.group === STAR_GROUP ||
      (snowflake && table.group === SNOWFLAKE_GROUP),
    [snowflake],
  );

  const entry = QUERIES[selected];
  const activeQuery = snowflake && entry?.snowflake ? entry.snowflake : entry?.star;

  const columns = useQuery(`PRAGMA table_info(${quoteIdent(selected)});`);
  const rowCount = useQuery(`SELECT COUNT(*) FROM ${quoteIdent(selected)};`);
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

  const joinCount = activeQuery ? (activeQuery.match(/\bJOIN\b/gi) ?? []).length : 0;
  const factRow = grain?.values[0] ?? [];

  return (
    <LabScroll>
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
        bodyClassName="p-0"
        actions={
          <PillButton onClick={() => setSnowflake((on) => !on)}>
            {snowflake ? "Collapse to star" : "Snowflake dim_product"}
          </PillButton>
        }
      >
        <div className="h-[30rem] overflow-hidden">
          <SchemaMap
            embedded
            tableFilter={filter}
            onSelectionChange={(table) => {
              if (table) setSelected(table);
            }}
            onPeek={(table) =>
              run(`SELECT * FROM ${quoteIdent(table)} LIMIT 50;`, {
                label: `Peek ${table}`,
              })
            }
            toolbarNote="Click a table to inspect it below · drag to arrange · ⌘/ctrl + scroll to zoom"
          />
        </div>
      </Panel>

      <div className="grid gap-5 xl:grid-cols-12">
        <Panel
          title={selected}
          subtitle={`${Number(rowCount?.values[0]?.[0] ?? 0).toLocaleString("en-IN")} rows · click any card on the canvas`}
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
                    isKey ? "bg-pg-gold-soft text-pg-gold" : "text-pg-text",
                  )}
                >
                  <span>{name}</span>
                  <span className="text-pg-faint">{type}</span>
                </li>
              );
            })}
          </ul>
        </Panel>

        <Panel
          title="The query this table serves"
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
              <pre className="pg-scroll overflow-x-auto rounded-lg bg-pg-bg p-3 font-mono text-[0.75rem] leading-relaxed text-pg-text">
                {activeQuery}
              </pre>
              {selected === "dim_product" ? (
                <p className="mt-3 text-[0.8125rem] leading-relaxed text-pg-dim">
                  {snowflake
                    ? "Three joins instead of one, and the category group is now available. That is the snowflake trade-off in a single query."
                    : "One join, and category and brand are right there on the dimension. Redundant in storage, cheap at query time."}
                </p>
              ) : null}
            </>
          ) : (
            <p className="text-sm text-pg-dim">
              No worked query for {selected} yet. Open the SQL playground lab and
              write one against it.
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
    </LabScroll>
  );
}
