"use client";

import { useMemo, useState, type ReactNode } from "react";

import { useDb, useQuery } from "@/components/playground/DbProvider";
import { LabIntro, LabScroll, Panel, PillButton } from "@/components/playground/LabChrome";
import { ResultTable, type RowFlag } from "@/components/playground/ResultTable";
import type { Lab } from "@/content/labs";

const SEGMENTS = ["Retail", "Corporate", "SMB", "Enterprise"];

/** Months from Jan 2024 to Dec 2026 — the timeline slider's domain. */
const TIMELINE = Array.from({ length: 36 }, (_, index) => {
  const year = 2024 + Math.floor(index / 12);
  const month = (index % 12) + 1;
  return `${year}-${String(month).padStart(2, "0")}-01`;
});

/** Single-quote escaping. Values come from selects, but correctness is cheap. */
function lit(value: string): string {
  return `'${value.replace(/'/g, "''")}'`;
}

export function ScdLab({ lab }: { lab: Lab }) {
  const { run, log, status, setDockTab } = useDb();

  const [customerId, setCustomerId] = useState(1);
  const [attribute, setAttribute] = useState<"city" | "segment">("city");
  const [newValue, setNewValue] = useState("Bengaluru");
  const [effective, setEffective] = useState("2025-10-01");
  const [timelineIndex, setTimelineIndex] = useState(21); // Oct 2025
  const [justChanged, setJustChanged] = useState(false);

  const cities = useQuery("SELECT DISTINCT city FROM customer ORDER BY city;");
  const cityOptions = useMemo(
    () => (cities?.values.map((row) => String(row[0])) ?? []).concat("Hyderabad", "Chennai"),
    [cities],
  );

  const customers = useQuery(
    `SELECT customer_id, customer_name FROM dim_customer_scd
     WHERE is_current = 1 ORDER BY customer_id;`,
  );

  const currentRow = useQuery(
    `SELECT customer_key, customer_name, city, segment, start_date
     FROM dim_customer_scd
     WHERE customer_id = ${customerId} AND is_current = 1;`,
  );

  const history = useQuery(
    `SELECT customer_key, version, city, segment, start_date, end_date, is_current
     FROM dim_customer_scd
     WHERE customer_id = ${customerId}
     ORDER BY version;`,
  );

  const type1 = useQuery(
    `SELECT customer_key, customer_name, city, segment, updated_on
     FROM dim_customer_type1 WHERE customer_id = ${customerId};`,
  );

  const type3 = useQuery(
    `SELECT customer_key, customer_name, city, previous_city, segment, previous_segment, effective_date
     FROM dim_customer_type3 WHERE customer_id = ${customerId};`,
  );

  const asOfDate = TIMELINE[timelineIndex];
  const asOf = useQuery(
    `SELECT customer_id, customer_name, city, segment, start_date, end_date, version
     FROM dim_customer_scd
     WHERE ${lit(asOfDate)} BETWEEN start_date AND end_date
     ORDER BY customer_id;`,
  );

  const current = currentRow?.values[0];
  const currentValue = current
    ? String(current[attribute === "city" ? 2 : 3] ?? "")
    : "";
  const currentStart = current ? String(current[4] ?? "") : "";

  const noChange = currentValue === newValue;
  const badDate = Boolean(currentStart) && effective <= currentStart;
  const blocked = status !== "ready" || noChange || badDate;

  const statements = useMemo(() => {
    const column = attribute;
    const value = lit(newValue);
    const eff = lit(effective);

    return {
      type2Expire: `-- Type 2, step 1: close the version that is current
UPDATE dim_customer_scd
SET end_date = date(${eff}, '-1 day'),
    is_current = 0
WHERE customer_id = ${customerId}
  AND is_current = 1;`,
      type2Insert: `-- Type 2, step 2: open a new version with a fresh surrogate key
INSERT INTO dim_customer_scd
  (customer_id, customer_name, city, segment, start_date, end_date, is_current, version)
SELECT customer_id,
       customer_name,
       ${column === "city" ? value : "city"},
       ${column === "segment" ? value : "segment"},
       ${eff},
       '9999-12-31',
       1,
       version + 1
FROM dim_customer_scd
WHERE customer_id = ${customerId}
ORDER BY version DESC
LIMIT 1;`,
      type1: `-- Type 1: overwrite in place. The previous value is gone.
UPDATE dim_customer_type1
SET ${column} = ${value},
    updated_on = ${eff}
WHERE customer_id = ${customerId};`,
      type3: `-- Type 3: shift the old value into its parallel column
UPDATE dim_customer_type3
SET previous_${column} = ${column},
    ${column} = ${value},
    effective_date = ${eff}
WHERE customer_id = ${customerId};`,
    };
  }, [attribute, customerId, effective, newValue]);

  const applyChange = () => {
    if (blocked) return;
    setDockTab("console");
    log(
      "info",
      `Applying ${attribute} change for customer ${customerId}: ${currentValue || "—"} → ${newValue}, effective ${effective}.`,
    );
    run(statements.type2Expire, { keepTab: true });
    run(statements.type2Insert, { keepTab: true });
    run(statements.type1, { keepTab: true });
    run(statements.type3, { keepTab: true });
    log("ok", "All three dimension types updated. Compare what each one remembers.");
    setJustChanged(true);
    // Move the timeline to the change date so the effect is immediately visible.
    const index = TIMELINE.findIndex((date) => date >= effective);
    if (index >= 0) setTimelineIndex(index);
  };

  const valueOptions = attribute === "city" ? cityOptions : SEGMENTS;

  return (
    <LabScroll>
      <LabIntro lab={lab} />

      <Panel
        title="Make a change"
        subtitle="One change, applied to all three SCD types at once, as real SQL."
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Customer">
            <select
              value={customerId}
              onChange={(event) => setCustomerId(Number(event.target.value))}
              className="w-full rounded-lg border border-pg-line-strong bg-pg-bg px-3 py-2 text-[0.8125rem] text-pg-text"
            >
              {(customers?.values ?? []).map((row) => (
                <option key={String(row[0])} value={Number(row[0])}>
                  {row[0]} · {row[1]}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Attribute">
            <select
              value={attribute}
              onChange={(event) => {
                const next = event.target.value as "city" | "segment";
                setAttribute(next);
                setNewValue(next === "city" ? "Bengaluru" : "Corporate");
              }}
              className="w-full rounded-lg border border-pg-line-strong bg-pg-bg px-3 py-2 text-[0.8125rem] text-pg-text"
            >
              <option value="city">city</option>
              <option value="segment">segment</option>
            </select>
          </Field>

          <Field label="New value">
            <select
              value={newValue}
              onChange={(event) => setNewValue(event.target.value)}
              className="w-full rounded-lg border border-pg-line-strong bg-pg-bg px-3 py-2 text-[0.8125rem] text-pg-text"
            >
              {valueOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Effective from">
            <input
              type="date"
              value={effective}
              min="2024-01-02"
              max="2026-12-31"
              onChange={(event) => setEffective(event.target.value)}
              className="w-full rounded-lg border border-pg-line-strong bg-pg-bg px-3 py-2 font-mono text-[0.8125rem] text-pg-text"
            />
          </Field>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <PillButton tone="primary" onClick={applyChange} disabled={blocked}>
            Apply change
          </PillButton>

          <p className="text-[0.8125rem] text-pg-dim">
            {noChange ? (
              <span className="text-pg-gold">
                {attribute} is already {newValue} — change detection would find nothing
                to do, so no new version is written.
              </span>
            ) : badDate ? (
              <span className="text-pg-gold">
                Effective date must be after {currentStart}, when the current version
                opened.
              </span>
            ) : (
              <>
                {currentValue || "—"} → <span className="text-pg-text">{newValue}</span>{" "}
                from {effective}
              </>
            )}
          </p>
        </div>
      </Panel>

      <div className="grid gap-5 xl:grid-cols-3">
        <Panel
          title="Type 2 — full history"
          subtitle="A new row per change; the old one is closed, never touched again."
          className="xl:col-span-3"
        >
          <ResultTable
            set={history}
            animate={justChanged}
            flagRow={(row, columns): RowFlag => {
              const isCurrent = Number(row[columns.indexOf("is_current")] ?? 0) === 1;
              return isCurrent ? "good" : null;
            }}
            flagCell={(value, column): RowFlag =>
              column === "end_date" && value === "9999-12-31" ? "good" : null
            }
          />
          <div className="mt-3 grid gap-2.5 lg:grid-cols-2">
            <pre className="overflow-x-auto rounded-lg bg-pg-bg p-3 font-mono text-[0.75rem] leading-relaxed text-pg-text">
              {statements.type2Expire}
            </pre>
            <pre className="overflow-x-auto rounded-lg bg-pg-bg p-3 font-mono text-[0.75rem] leading-relaxed text-pg-text">
              {statements.type2Insert}
            </pre>
          </div>
        </Panel>

        <Panel
          title="Type 1 — overwrite"
          subtitle="One row, always current. History is unrecoverable."
        >
          <ResultTable set={type1} animate={justChanged} />
          <pre className="mt-3 overflow-x-auto rounded-lg bg-pg-bg p-3 font-mono text-[0.75rem] leading-relaxed text-pg-text">
            {statements.type1}
          </pre>
        </Panel>

        <Panel
          title="Type 3 — one previous value"
          subtitle="Enough for current-vs-previous, and no more."
          className="xl:col-span-2"
        >
          <ResultTable
            set={type3}
            animate={justChanged}
            flagCell={(value, column): RowFlag =>
              column.startsWith("previous_") && value !== null ? "warn" : null
            }
          />
          <pre className="mt-3 overflow-x-auto rounded-lg bg-pg-bg p-3 font-mono text-[0.75rem] leading-relaxed text-pg-text">
            {statements.type3}
          </pre>
        </Panel>
      </div>

      <Panel
        title="Timeline — query the dimension as of any date"
        subtitle="This is what history actually buys you: a correct answer to a question about the past."
      >
        <label
          htmlFor="scd-timeline"
          className="block font-mono text-[0.8125rem] text-pg-text"
        >
          As of {asOfDate}
        </label>
        <input
          id="scd-timeline"
          type="range"
          min={0}
          max={TIMELINE.length - 1}
          value={timelineIndex}
          onChange={(event) => setTimelineIndex(Number(event.target.value))}
          className="mt-2 w-full accent-[var(--pg-primary)]"
        />
        <div className="mt-1 flex justify-between font-mono text-[0.625rem] text-pg-faint">
          {[2024, 2025, 2026].map((year) => (
            <span key={year}>{year}</span>
          ))}
        </div>

        <pre className="mt-3 overflow-x-auto rounded-lg bg-pg-bg p-3 font-mono text-[0.75rem] leading-relaxed text-pg-text">
          {`SELECT customer_id, customer_name, city, segment, start_date, end_date, version
FROM dim_customer_scd
WHERE '${asOfDate}' BETWEEN start_date AND end_date
ORDER BY customer_id;`}
        </pre>

        <div className="mt-3">
          <ResultTable
            set={asOf}
            flagRow={(row, columns): RowFlag => {
              const version = Number(row[columns.indexOf("version")] ?? 1);
              return version > 1 ? "good" : null;
            }}
          />
        </div>
        <p className="mt-2 text-[0.8125rem] leading-relaxed text-pg-dim">
          Rows highlighted in green are on their second version or later — the
          dimension is returning what was true on {asOfDate}, not what is true today.
          Type 1 and Type 3 cannot answer this query at all.
        </p>
      </Panel>
    </LabScroll>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[0.6875rem] uppercase tracking-[0.08em] text-pg-faint">
        {label}
      </span>
      {children}
    </label>
  );
}
