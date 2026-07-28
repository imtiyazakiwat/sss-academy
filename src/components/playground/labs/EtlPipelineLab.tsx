"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useDb, useQuery } from "@/components/playground/DbProvider";
import { LabIntro, LabScroll, Panel, PillButton, Stat } from "@/components/playground/LabChrome";
import { ResultTable } from "@/components/playground/ResultTable";
import type { Lab } from "@/content/labs";
import { cn } from "@/lib/cn";

interface Stage {
  id: string;
  label: string;
  /** One line on what this stage is for. */
  detail: string;
  /** Executed in order. Read-only stages just report. */
  statements: string[];
  /** Console line written before the statements run. */
  say: string;
}

/**
 * The job. Every statement here is the real thing that runs — there is no
 * separate "animation script" that could drift from the SQL.
 *
 * The job is idempotent by construction: the staging and load stages both begin
 * by clearing their target. That is what makes Step back safe — it simply
 * replays the job from the top up to the previous stage rather than pretending
 * to reverse an UPDATE.
 */
const STAGES: Stage[] = [
  {
    id: "extract",
    label: "Extract",
    detail: "Read the source extract and record the control count",
    say: "Connecting to source system…",
    statements: [
      `SELECT COUNT(*) AS extracted_rows,
       MIN(sale_date) AS first_date,
       MAX(sale_date) AS last_date
FROM src_sales;`,
    ],
  },
  {
    id: "stage",
    label: "Stage",
    detail: "Land the extract in staging as-is — no cleaning yet",
    say: "Truncating staging and landing raw rows…",
    statements: [
      `DELETE FROM stg_sales;`,
      `INSERT INTO stg_sales (cid, customer_name, product, amount, sale_date, reject_reason)
SELECT cid, customer_name, product, amount, sale_date, NULL
FROM src_sales;`,
    ],
  },
  {
    id: "validate",
    label: "Validate",
    detail: "Mark every row that breaks a rule, with the reason",
    say: "Applying validation rules…",
    statements: [
      `UPDATE stg_sales
SET reject_reason = 'NULL business key'
WHERE cid IS NULL;`,
      `UPDATE stg_sales
SET reject_reason = 'NULL customer name'
WHERE reject_reason IS NULL AND customer_name IS NULL;`,
      `UPDATE stg_sales
SET reject_reason = 'NULL amount'
WHERE reject_reason IS NULL AND amount IS NULL;`,
      `UPDATE stg_sales
SET reject_reason = 'Negative amount'
WHERE reject_reason IS NULL
  AND CAST(REPLACE(amount, ',', '') AS REAL) < 0;`,
      `UPDATE stg_sales
SET reject_reason = 'Orphan customer id'
WHERE reject_reason IS NULL
  AND cid NOT IN (SELECT customer_id FROM customer);`,
      `UPDATE stg_sales
SET reject_reason = 'Duplicate on business key'
WHERE reject_reason IS NULL
  AND rowid IN (
    SELECT later.rowid
    FROM stg_sales later
    WHERE EXISTS (
      SELECT 1 FROM stg_sales earlier
      WHERE earlier.cid = later.cid
        AND earlier.product = later.product
        AND earlier.sale_date = later.sale_date
        AND earlier.rowid < later.rowid
    )
  );`,
    ],
  },
  {
    id: "transform",
    label: "Transform",
    detail: "Conform names to master data, strip formatting, standardise dates",
    say: "Cleaning the rows that passed validation…",
    statements: [
      `UPDATE stg_sales
SET customer_name = COALESCE(
      (SELECT c.customer_name FROM customer c WHERE c.customer_id = stg_sales.cid),
      TRIM(customer_name)
    ),
    product = TRIM(product),
    amount = CAST(REPLACE(amount, ',', '') AS REAL),
    sale_date = CASE
      WHEN sale_date LIKE '____/__/__' THEN REPLACE(sale_date, '/', '-')
      ELSE sale_date
    END
WHERE reject_reason IS NULL;`,
    ],
  },
  {
    id: "load",
    label: "Load",
    detail: "Publish the clean rows to the target; rejects stay behind",
    say: "Loading target table…",
    statements: [
      `DELETE FROM tgt_sales;`,
      `INSERT INTO tgt_sales (cid, customer_name, product, amount, sale_date)
SELECT cid, customer_name, product, amount, sale_date
FROM stg_sales
WHERE reject_reason IS NULL;`,
    ],
  },
  {
    id: "reconcile",
    label: "Reconcile",
    detail: "Account for every row: extracted = loaded + rejected",
    say: "Reconciling control counts…",
    statements: [
      `SELECT
  (SELECT COUNT(*) FROM src_sales) AS extracted,
  (SELECT COUNT(*) FROM stg_sales) AS staged,
  (SELECT COUNT(*) FROM stg_sales WHERE reject_reason IS NOT NULL) AS rejected,
  (SELECT COUNT(*) FROM tgt_sales) AS loaded,
  (SELECT COUNT(*) FROM src_sales)
    - (SELECT COUNT(*) FROM stg_sales WHERE reject_reason IS NOT NULL)
    - (SELECT COUNT(*) FROM tgt_sales) AS unexplained;`,
    ],
  },
];

const STEP_MS = 950;

export function EtlPipelineLab({ lab }: { lab: Lab }) {
  const { run, log, status, setDockTab } = useDb();

  /** Stages finished so far. */
  const [completed, setCompleted] = useState(0);
  /** Stage currently executing, or null between steps. */
  const [active, setActive] = useState<number | null>(null);
  const [auto, setAuto] = useState(false);
  const [inspect, setInspect] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const done = completed >= STAGES.length;

  /** Executes one stage's statements against the live database. */
  const execute = useCallback(
    (index: number) => {
      const stage = STAGES[index];
      if (!stage) return;
      log("info", `[${stage.id}] ${stage.say}`);
      for (const statement of stage.statements) {
        run(statement, { keepTab: true });
      }
    },
    [log, run],
  );

  /** Replays the job from the top up to (but excluding) `target`. */
  const replayTo = useCallback(
    (target: number) => {
      for (let index = 0; index < target; index += 1) {
        execute(index);
      }
    },
    [execute],
  );

  const stepForward = useCallback(() => {
    if (status !== "ready" || completed >= STAGES.length) return;
    const index = completed;
    setActive(index);
    execute(index);
    setCompleted(index + 1);
    setInspect(index);
    if (index + 1 === STAGES.length) {
      log("ok", "Job completed.");
      setAuto(false);
    }
  }, [completed, execute, log, status]);

  const stepBack = useCallback(() => {
    if (completed === 0) return;
    setAuto(false);
    const target = completed - 1;
    log("info", `Stepping back — replaying the job through ${target} ${target === 1 ? "stage" : "stages"}.`);
    replayTo(target);
    setCompleted(target);
    setInspect(Math.max(target - 1, 0));
    setActive(null);
  }, [completed, log, replayTo]);

  const restart = useCallback(() => {
    setAuto(false);
    setCompleted(0);
    setActive(null);
    setInspect(0);
    log("info", "Job reset. Press Run job to start again.");
  }, [log]);

  // Auto-advance loop. A single timeout per step, cleared on pause or unmount.
  useEffect(() => {
    if (!auto || done || status !== "ready") return;
    timer.current = setTimeout(() => {
      setActive(null);
      stepForward();
    }, STEP_MS);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [auto, completed, done, status, stepForward]);

  const startJob = () => {
    if (done) restart();
    setDockTab("console");
    log("info", "=== ETL job started ===");
    setAuto(true);
  };

  const counts = usePipelineCounts();
  const rejects = useQuery(
    completed >= 3
      ? `SELECT cid, customer_name, product, amount, sale_date, reject_reason
         FROM stg_sales
         WHERE reject_reason IS NOT NULL
         ORDER BY reject_reason, rowid;`
      : null,
  );

  const inspected = STAGES[inspect];
  const progress = Math.round((completed / STAGES.length) * 100);

  return (
    <LabScroll>
      <LabIntro lab={lab} />

      <Panel
        title="Job control"
        subtitle={
          done
            ? "Job complete. Step back through the stages, or reset the database to restore the original defects."
            : `${completed} of ${STAGES.length} stages complete`
        }
        actions={
          <>
            {auto ? (
              <PillButton onClick={() => setAuto(false)}>Pause</PillButton>
            ) : (
              <PillButton
                tone="primary"
                onClick={startJob}
                disabled={status !== "ready"}
              >
                {completed === 0 ? "Run ETL job" : done ? "Run again" : "Resume"}
              </PillButton>
            )}
            <PillButton onClick={stepBack} disabled={completed === 0}>
              Step back
            </PillButton>
            <PillButton
              onClick={() => {
                setAuto(false);
                setActive(null);
                stepForward();
              }}
              disabled={done || status !== "ready"}
            >
              Next step
            </PillButton>
            <PillButton onClick={restart} disabled={completed === 0}>
              Restart
            </PillButton>
          </>
        }
      >
        <div
          className="h-1.5 overflow-hidden rounded-full bg-pg-hover"
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="ETL job progress"
        >
          <div
            className="h-full rounded-full bg-gradient-to-r from-violet-500 to-ember-500 transition-[width] duration-500 ease-[var(--ease-out-expo)]"
            style={{ width: `${progress}%` }}
          />
        </div>

        <ol className="mt-4 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
          {STAGES.map((stage, index) => {
            const state =
              index < completed ? "done" : index === active ? "running" : "pending";
            return (
              <li key={stage.id}>
                <button
                  type="button"
                  onClick={() => setInspect(index)}
                  aria-current={index === inspect ? "step" : undefined}
                  className={cn(
                    "w-full rounded-xl border px-3.5 py-3 text-left transition-colors",
                    index === inspect
                      ? "border-pg-iris/50 bg-pg-iris-soft"
                      : "border-pg-line bg-pg-raised hover:border-pg-line-strong",
                  )}
                >
                  <div className="flex items-center gap-2">
                    <StageDot state={state} />
                    <span className="min-w-0 flex-1 truncate text-[0.8125rem] font-medium text-pg-text">
                      {index + 1}. {stage.label}
                    </span>
                    {state === "done" ? (
                      <span className="shrink-0 font-mono text-[0.625rem] text-pg-sky">
                        OK
                      </span>
                    ) : null}
                  </div>

                  <p className="mt-1.5 text-[0.6875rem] leading-relaxed text-pg-dim">
                    {stage.detail}
                  </p>

                  <div className="mt-2 h-1 overflow-hidden rounded-full bg-pg-hover">
                    <div
                      className={cn(
                        "h-full rounded-full transition-[width] duration-700 ease-[var(--ease-out-expo)]",
                        state === "done" && "w-full bg-pg-sky",
                        state === "running" && "w-2/3 bg-pg-rose",
                        state === "pending" && "w-0",
                      )}
                    />
                  </div>
                </button>
              </li>
            );
          })}
        </ol>
      </Panel>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Extracted" value={counts.extracted} hint="rows in src_sales" />
        <Stat
          label="Staged"
          value={counts.staged}
          hint="rows landed in stg_sales"
          tone={counts.staged > 0 ? "neutral" : "warn"}
        />
        <Stat
          label="Rejected"
          value={counts.rejected}
          tone={counts.rejected > 0 ? "bad" : "neutral"}
          hint="failed a validation rule"
        />
        <Stat
          label="Loaded"
          value={counts.loaded}
          tone={
            counts.loaded > 0 && counts.unexplained === 0 && completed >= 6
              ? "good"
              : "neutral"
          }
          hint="rows published to tgt_sales"
        />
      </div>

      {completed >= 6 ? (
        <div
          className={cn(
            "rounded-2xl border px-4 py-3.5",
            counts.unexplained === 0
              ? "border-pg-sky/40 bg-pg-sky-soft"
              : "border-pg-rose/45 bg-pg-rose-soft",
          )}
        >
          <p
            className={cn(
              "text-[0.9375rem] font-medium",
              counts.unexplained === 0 ? "text-pg-sky" : "text-pg-rose",
            )}
          >
            {counts.unexplained === 0
              ? "Reconciled — every extracted row is either loaded or explained by a reject reason."
              : `${counts.unexplained} rows are unaccounted for. That is the defect.`}
          </p>
          <p className="mt-1 font-mono text-[0.75rem] text-pg-dim">
            {counts.extracted} extracted = {counts.loaded} loaded + {counts.rejected}{" "}
            rejected {counts.unexplained === 0 ? "✓" : `+ ${counts.unexplained} missing`}
          </p>
        </div>
      ) : null}

      <div className="grid gap-5 xl:grid-cols-2">
        <Panel
          title={`Stage ${inspect + 1}: ${inspected.label}`}
          subtitle="The exact SQL this stage executes"
        >
          <div className="space-y-2.5">
            {inspected.statements.map((statement, index) => (
              <div key={index} className="overflow-hidden rounded-xl border border-pg-line">
                <pre className="overflow-x-auto bg-pg-bg p-3 font-mono text-[0.75rem] leading-relaxed text-pg-text">
                  {statement}
                </pre>
              </div>
            ))}
          </div>
          <PillButton
            className="mt-3"
            onClick={() => {
              inspected.statements.forEach((statement) => run(statement));
            }}
            disabled={status !== "ready"}
          >
            Run this stage on its own
          </PillButton>
        </Panel>

        <Panel
          title="Reject table"
          subtitle={
            completed >= 3
              ? "Rows held back by validation, with the rule each one broke"
              : "Appears once the validation stage has run"
          }
        >
          {completed >= 3 ? (
            <ResultTable
              set={rejects}
              flagRow={() => "bad"}
              animate
              empty="No rejects."
            />
          ) : (
            <p className="py-6 text-sm text-pg-dim">
              Run the job as far as stage 3 and every rejected row shows up here with
              its reason.
            </p>
          )}
        </Panel>
      </div>
    </LabScroll>
  );
}

/** Live control counts, re-read whenever the database changes. */
function usePipelineCounts() {
  const set = useQuery(
    `SELECT
       (SELECT COUNT(*) FROM src_sales) AS extracted,
       (SELECT COUNT(*) FROM stg_sales) AS staged,
       (SELECT COUNT(*) FROM stg_sales WHERE reject_reason IS NOT NULL) AS rejected,
       (SELECT COUNT(*) FROM tgt_sales) AS loaded;`,
  );

  return useMemo(() => {
    const row = set?.values[0] ?? [];
    const extracted = Number(row[0] ?? 0);
    const staged = Number(row[1] ?? 0);
    const rejected = Number(row[2] ?? 0);
    const loaded = Number(row[3] ?? 0);
    return {
      extracted,
      staged,
      rejected,
      loaded,
      unexplained: extracted - rejected - loaded,
    };
  }, [set]);
}

function StageDot({ state }: { state: "pending" | "running" | "done" }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "size-2 shrink-0 rounded-full",
        state === "done" && "bg-pg-sky",
        state === "running" && "animate-pulse bg-pg-rose",
        state === "pending" && "bg-pg-hover",
      )}
    />
  );
}
