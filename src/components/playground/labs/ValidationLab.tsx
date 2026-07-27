"use client";

import { useMemo, useState } from "react";

import { useDb, useQuery } from "@/components/playground/DbProvider";
import { LabIntro, Panel, PillButton } from "@/components/playground/LabChrome";
import { ResultTable, type RowFlag } from "@/components/playground/ResultTable";
import type { Lab } from "@/content/labs";
import type { QueryOutcome, ResultSet, SqlValue } from "@/lib/sqlite";
import { cn } from "@/lib/cn";

type Verdict = "pass" | "fail" | "inspect";

interface Check {
  id: string;
  title: string;
  /** Why a tester runs this, in one line. */
  why: string;
  sql: string;
  /** Second query, where the check is genuinely two-directional. */
  sqlB?: string;
  labelA?: string;
  labelB?: string;
  /**
   * zero-rows  — any row returned is a defect
   * equal      — the first row's columns must all match
   * inspect    — no automatic verdict; the tester reads it
   */
  expect: "zero-rows" | "equal" | "inspect";
  /** Rendered instead of a result grid, for checks that compare structure. */
  custom?: "metadata";
}

/**
 * The declared source-to-target mapping. In real work this comes from the
 * mapping document, and the whole point of column-mapping validation is to test
 * the build against it rather than against what the build happens to do.
 */
const MAPPING = [
  { source: "cid", target: "cid", rule: "Cast to INTEGER; reject if null" },
  {
    source: "customer_name",
    target: "customer_name",
    rule: "Trim, conform to customer master",
  },
  { source: "product", target: "product", rule: "Trim" },
  {
    source: "amount",
    target: "amount",
    rule: "Strip thousands separator, cast to REAL, reject negatives",
  },
  {
    source: "sale_date",
    target: "sale_date",
    rule: "Normalise YYYY/MM/DD to YYYY-MM-DD",
  },
];

const CHECKS: Check[] = [
  {
    id: "metadata",
    title: "Metadata validation",
    why: "Structure before content: a wrong type or a missing column corrupts even perfectly clean data.",
    sql: `PRAGMA table_info(src_sales);`,
    expect: "inspect",
    custom: "metadata",
  },
  {
    id: "count",
    title: "Record count reconciliation",
    why: "The cheapest check there is, and the one that catches a truncated or partial load.",
    sql: `SELECT
  (SELECT COUNT(*) FROM src_sales) AS source_rows,
  (SELECT COUNT(*) FROM tgt_sales) AS target_rows,
  (SELECT COUNT(*) FROM src_sales) - (SELECT COUNT(*) FROM tgt_sales) AS difference;`,
    expect: "equal",
  },
  {
    id: "duplicates",
    title: "Duplicate check",
    why: "Duplicates on the declared business key double every measure downstream.",
    sql: `SELECT cid, product, sale_date, COUNT(*) AS copies
FROM src_sales
GROUP BY cid, product, sale_date
HAVING COUNT(*) > 1
ORDER BY copies DESC;`,
    expect: "zero-rows",
  },
  {
    id: "nulls",
    title: "NULL validation",
    why: "Mandatory columns are defined by the mapping document, not by preference.",
    sql: `SELECT src_id, cid, customer_name, product, amount, sale_date
FROM src_sales
WHERE cid IS NULL
   OR customer_name IS NULL
   OR amount IS NULL
   OR sale_date IS NULL
ORDER BY src_id;`,
    expect: "zero-rows",
  },
  {
    id: "domain",
    title: "Datatype & domain check",
    why: "typeof() exposes what is really stored. Everything arrives as text, and one amount will refuse to cast at all.",
    sql: `SELECT typeof(amount) AS amount_stored_as,
       COUNT(*) AS rows,
       SUM(CASE WHEN amount LIKE '%,%' THEN 1 ELSE 0 END) AS with_separator,
       SUM(CASE WHEN CAST(REPLACE(amount, ',', '') AS REAL) < 0 THEN 1 ELSE 0 END) AS negatives,
       SUM(CASE WHEN sale_date NOT LIKE '____-__-__' THEN 1 ELSE 0 END) AS bad_date_format
FROM src_sales
GROUP BY 1
ORDER BY rows DESC;`,
    expect: "inspect",
  },
  {
    id: "mapping",
    title: "Transformation check",
    why: "Recompute the expected value independently; never verify the ETL with the ETL's own logic.",
    sql: `SELECT s.src_id,
       s.amount AS source_amount,
       CAST(REPLACE(s.amount, ',', '') AS REAL) AS expected_amount,
       t.amount AS target_amount
FROM src_sales s
LEFT JOIN tgt_sales t
  ON t.cid = CAST(s.cid AS INTEGER)
 AND t.product = TRIM(s.product)
WHERE t.sale_id IS NOT NULL
  AND ROUND(t.amount, 2) <> ROUND(CAST(REPLACE(s.amount, ',', '') AS REAL), 2)
ORDER BY s.src_id;`,
    expect: "zero-rows",
  },
  {
    id: "minus",
    title: "MINUS validation",
    why: "Run both directions: one finds rows that failed to load, the other finds rows the source never sent.",
    labelA: "Source MINUS target — missing from the load",
    labelB: "Target MINUS source — never sent by the source",
    sql: `SELECT CAST(cid AS INTEGER) AS cid, TRIM(product) AS product
FROM src_sales
WHERE cid IS NOT NULL
EXCEPT
SELECT cid, product FROM tgt_sales;`,
    sqlB: `SELECT cid, product FROM tgt_sales
EXCEPT
SELECT CAST(cid AS INTEGER) AS cid, TRIM(product) AS product
FROM src_sales
WHERE cid IS NOT NULL;`,
    expect: "zero-rows",
  },
];

export function ValidationLab({ lab }: { lab: Lab }) {
  const { run, status } = useDb();
  const [results, setResults] = useState<
    Record<string, { a: QueryOutcome | null; b: QueryOutcome | null }>
  >({});
  const [open, setOpen] = useState<string>("metadata");

  const runCheck = (check: Check) => {
    if (status !== "ready") return;
    setOpen(check.id);
    const a = run(check.sql, { keepTab: true });
    const b = check.sqlB ? run(check.sqlB, { keepTab: true }) : null;
    setResults((current) => ({ ...current, [check.id]: { a, b } }));
  };

  const runAll = () => {
    CHECKS.forEach(runCheck);
    setOpen("minus");
  };

  const summary = useMemo(() => {
    let pass = 0;
    let fail = 0;
    for (const check of CHECKS) {
      const outcome = results[check.id];
      if (!outcome) continue;
      const verdict = judge(check, outcome.a, outcome.b);
      if (verdict === "pass") pass += 1;
      if (verdict === "fail") fail += 1;
    }
    return { pass, fail, run: Object.keys(results).length };
  }, [results]);

  return (
    <div className="space-y-5">
      <LabIntro lab={lab} />

      <Panel
        title="Test plan"
        subtitle={
          summary.run === 0
            ? `${CHECKS.length} checks, each one a real query against the seeded defects`
            : `${summary.run} of ${CHECKS.length} run · ${summary.pass} passed · ${summary.fail} failed`
        }
        actions={
          <PillButton tone="primary" onClick={runAll} disabled={status !== "ready"}>
            Run all checks
          </PillButton>
        }
        bodyClassName="p-2.5"
      >
        <ol className="space-y-1.5">
          {CHECKS.map((check, index) => {
            const outcome = results[check.id];
            const verdict = outcome ? judge(check, outcome.a, outcome.b) : null;
            const expanded = open === check.id;

            return (
              <li
                key={check.id}
                className={cn(
                  "overflow-hidden rounded-xl border transition-colors",
                  expanded ? "border-white/20 bg-white/[0.04]" : "border-white/8",
                )}
              >
                <div className="flex items-stretch">
                  <button
                    type="button"
                    onClick={() => setOpen(expanded ? "" : check.id)}
                    aria-expanded={expanded}
                    className="flex min-w-0 flex-1 items-center gap-3 px-3.5 py-2.5 text-left transition-colors hover:bg-white/[0.03]"
                  >
                    <span className="font-mono text-[0.6875rem] text-ink-500">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[0.875rem] font-medium text-white">
                        {check.title}
                      </span>
                      <span className="mt-0.5 block text-[0.6875rem] leading-relaxed text-ink-400">
                        {check.why}
                      </span>
                    </span>
                    <VerdictBadge verdict={verdict} />
                  </button>

                  <button
                    type="button"
                    onClick={() => runCheck(check)}
                    disabled={status !== "ready"}
                    className="shrink-0 border-l border-white/8 px-3 text-xs font-medium text-ink-300 transition-colors hover:bg-white/[0.06] hover:text-white disabled:opacity-50"
                  >
                    Run
                  </button>
                </div>

                {expanded ? (
                  <div className="space-y-3 border-t border-white/8 p-3.5">
                    <pre className="overflow-x-auto rounded-lg bg-navy-950/70 p-3 font-mono text-[0.75rem] leading-relaxed text-ink-200">
                      {check.sql}
                    </pre>

                    {check.custom === "metadata" ? (
                      <MetadataComparison />
                    ) : outcome ? (
                      <div className="space-y-3">
                        {check.labelA ? (
                          <p className="text-[0.75rem] font-medium text-ink-300">
                            {check.labelA}
                          </p>
                        ) : null}
                        <ResultTable
                          set={outcome.a?.sets[0] ?? null}
                          error={outcome.a?.error}
                          flagRow={rowFlagger(check)}
                          flagCell={cellFlagger(check)}
                          animate
                        />

                        {check.sqlB ? (
                          <>
                            <pre className="overflow-x-auto rounded-lg bg-navy-950/70 p-3 font-mono text-[0.75rem] leading-relaxed text-ink-200">
                              {check.sqlB}
                            </pre>
                            {check.labelB ? (
                              <p className="text-[0.75rem] font-medium text-ink-300">
                                {check.labelB}
                              </p>
                            ) : null}
                            <ResultTable
                              set={outcome.b?.sets[0] ?? null}
                              error={outcome.b?.error}
                              flagRow={rowFlagger(check)}
                              animate
                            />
                          </>
                        ) : null}

                        <Interpretation check={check} outcome={outcome} />
                      </div>
                    ) : (
                      <p className="text-sm text-ink-400">
                        Press Run to execute this check against the live database.
                      </p>
                    )}
                  </div>
                ) : null}
              </li>
            );
          })}
        </ol>
      </Panel>
    </div>
  );
}

/* ---------------------------------------------------------------
   Verdicts
   --------------------------------------------------------------- */

function judge(
  check: Check,
  a: QueryOutcome | null,
  b: QueryOutcome | null,
): Verdict {
  if (check.expect === "inspect") return "inspect";
  if (!a || a.error) return "fail";

  if (check.expect === "zero-rows") {
    const rowsA = a.sets[0]?.values.length ?? 0;
    const rowsB = b?.sets[0]?.values.length ?? 0;
    return rowsA + rowsB === 0 ? "pass" : "fail";
  }

  // "equal": every column in the first row must agree.
  const row = a.sets[0]?.values[0];
  if (!row) return "fail";
  const difference = Number(row[row.length - 1] ?? 0);
  return difference === 0 ? "pass" : "fail";
}

function VerdictBadge({ verdict }: { verdict: Verdict | null }) {
  if (!verdict) {
    return (
      <span className="shrink-0 rounded-full bg-white/8 px-2.5 py-1 text-[0.625rem] font-medium text-ink-400">
        Not run
      </span>
    );
  }
  const map = {
    pass: { label: "Pass", className: "bg-mint-500/20 text-mint-100" },
    fail: { label: "Defect", className: "bg-ember-500/20 text-ember-100" },
    inspect: { label: "Review", className: "bg-amber-400/20 text-amber-100" },
  } as const;
  const { label, className } = map[verdict];
  return (
    <span
      className={cn(
        "shrink-0 rounded-full px-2.5 py-1 text-[0.625rem] font-medium",
        className,
      )}
    >
      {label}
    </span>
  );
}

function Interpretation({
  check,
  outcome,
}: {
  check: Check;
  outcome: { a: QueryOutcome | null; b: QueryOutcome | null };
}) {
  const verdict = judge(check, outcome.a, outcome.b);
  const rowsA = outcome.a?.sets[0]?.values.length ?? 0;
  const rowsB = outcome.b?.sets[0]?.values.length ?? 0;

  let text: string;
  if (verdict === "pass") {
    text =
      check.expect === "equal"
        ? "Counts agree. Reconciliation passes."
        : "Zero rows returned, which is what a passing check looks like.";
  } else if (verdict === "inspect") {
    text =
      "No automatic verdict on this one — read the rows and compare them to the mapping document.";
  } else if (check.id === "minus") {
    text = `${rowsA} row${rowsA === 1 ? "" : "s"} missing from the target and ${rowsB} row${rowsB === 1 ? "" : "s"} in the target that the source never sent. Two separate defects with two different root causes.`;
  } else if (check.expect === "equal") {
    const row = outcome.a?.sets[0]?.values[0] ?? [];
    text = `Source and target differ by ${Number(row[row.length - 1] ?? 0)} rows. Every one of them has to be explained by a reject reason before this is signed off.`;
  } else {
    text = `${rowsA} row${rowsA === 1 ? "" : "s"} failed. Each one needs a defect or a documented exception.`;
  }

  return (
    <p
      className={cn(
        "rounded-lg px-3.5 py-2.5 text-[0.8125rem] leading-relaxed",
        verdict === "pass" && "bg-mint-500/10 text-mint-100",
        verdict === "fail" && "bg-ember-500/10 text-ember-100",
        verdict === "inspect" && "bg-amber-400/8 text-amber-100",
      )}
    >
      {text}
    </p>
  );
}

function rowFlagger(check: Check) {
  if (check.expect !== "zero-rows") return undefined;
  return (): RowFlag => "bad";
}

function cellFlagger(check: Check) {
  if (check.id !== "nulls") return undefined;
  return (value: SqlValue): RowFlag => (value === null ? "bad" : null);
}

/* ---------------------------------------------------------------
   Metadata comparison
   --------------------------------------------------------------- */

/**
 * Source and target structure side by side, driven by PRAGMA table_info on both
 * tables plus the declared mapping. Green means the column exists on both sides;
 * amber means the type differs and a cast is therefore mandatory.
 */
function MetadataComparison() {
  const source = useQuery("PRAGMA table_info(src_sales);");
  const target = useQuery("PRAGMA table_info(tgt_sales);");

  const sourceTypes = columnTypes(source);
  const targetTypes = columnTypes(target);

  return (
    <div className="space-y-3">
      <ul className="space-y-1.5">
        {MAPPING.map((row) => {
          const from = sourceTypes[row.source];
          const to = targetTypes[row.target];
          const missing = !from || !to;
          const mismatch = !missing && from !== to;

          return (
            <li
              key={row.source}
              className={cn(
                "grid items-center gap-2 rounded-lg border px-3 py-2 sm:grid-cols-[1fr_auto_1fr_1.4fr]",
                missing && "border-ember-500/40 bg-ember-500/10",
                mismatch && "border-amber-400/35 bg-amber-400/8",
                !missing && !mismatch && "border-mint-500/30 bg-mint-500/8",
              )}
            >
              <span className="font-mono text-[0.75rem] text-ink-100">
                src_sales.{row.source}
                <span className="ml-1.5 text-ink-400">{from ?? "missing"}</span>
              </span>
              <span aria-hidden="true" className="text-ink-400">
                →
              </span>
              <span className="font-mono text-[0.75rem] text-ink-100">
                tgt_sales.{row.target}
                <span className="ml-1.5 text-ink-400">{to ?? "missing"}</span>
              </span>
              <span
                className={cn(
                  "text-[0.6875rem] leading-relaxed",
                  missing && "text-ember-100",
                  mismatch && "text-amber-100",
                  !missing && !mismatch && "text-mint-100",
                )}
              >
                {missing
                  ? "Column not found on one side"
                  : mismatch
                    ? `Type differs — ${row.rule}`
                    : row.rule}
              </span>
            </li>
          );
        })}
      </ul>

      <p className="rounded-lg bg-amber-400/8 px-3.5 py-2.5 text-[0.8125rem] leading-relaxed text-amber-100">
        Every source column arrives as TEXT because the extract is a flat file, so
        each mapping into the typed target needs an explicit cast. Skip it and the
        engine stores what it was given: land this extract in stg_sales as-is and 20
        amounts convert to REAL, while &quot;63,000&quot; stays text in a REAL column
        because it is not a number. Nothing errors. The data is simply wrong.
      </p>
    </div>
  );
}

function columnTypes(set: ResultSet | null): Record<string, string> {
  if (!set) return {};
  const nameIndex = set.columns.indexOf("name");
  const typeIndex = set.columns.indexOf("type");
  const map: Record<string, string> = {};
  for (const row of set.values) {
    map[String(row[nameIndex] ?? "")] = String(row[typeIndex] ?? "");
  }
  return map;
}
