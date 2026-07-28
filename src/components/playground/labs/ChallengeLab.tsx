"use client";

import { useMemo, useState } from "react";

import { useDb } from "@/components/playground/DbProvider";
import { LabIntro, LabScroll, Panel, PillButton } from "@/components/playground/LabChrome";
import { ResultTable } from "@/components/playground/ResultTable";
import { SqlEditor } from "@/components/playground/SqlEditor";
import { TableExplorer } from "@/components/playground/TableExplorer";
import { useSchema } from "@/components/playground/useSchema";
import type { Lab } from "@/content/labs";
import type { ResultSet, SqlValue } from "@/lib/sqlite";
import { cn } from "@/lib/cn";

type Status = "unsolved" | "solved" | "wrong" | "error";

interface Attempt {
  status: Status;
  message: string;
  mine: ResultSet | null;
  expected: ResultSet | null;
  error?: string;
}

/** Cell comparison as text: 100 and '100' should not fail a student. */
function cellKey(value: SqlValue): string {
  if (value === null) return "\u0000NULL";
  if (typeof value === "number") {
    return Number.isInteger(value) ? String(value) : value.toFixed(4);
  }
  if (value instanceof Uint8Array) return `blob:${value.length}`;
  return value.trim();
}

function rowKey(row: SqlValue[]): string {
  return row.map(cellKey).join("\u0001");
}

/**
 * Compares a student's result set against the reference query's.
 *
 * Grading on result sets rather than on query text is the whole point: any
 * correct approach passes, which is how SQL actually works. Row order is only
 * enforced when the question asked for a sort.
 */
function compare(
  mine: ResultSet | null,
  expected: ResultSet | null,
  orderMatters: boolean,
): { ok: boolean; message: string } {
  if (!expected) return { ok: false, message: "The reference query failed to run." };
  if (!mine) {
    return {
      ok: false,
      message: "Your statement returned no result set. A challenge needs a SELECT.",
    };
  }

  if (mine.columns.length !== expected.columns.length) {
    return {
      ok: false,
      message: `Expected ${expected.columns.length} column${expected.columns.length === 1 ? "" : "s"}, got ${mine.columns.length}.`,
    };
  }
  if (mine.values.length !== expected.values.length) {
    return {
      ok: false,
      message: `Expected ${expected.values.length} row${expected.values.length === 1 ? "" : "s"}, got ${mine.values.length}.`,
    };
  }

  const mineKeys = mine.values.map(rowKey);
  const expectedKeys = expected.values.map(rowKey);

  if (orderMatters) {
    const firstDifference = mineKeys.findIndex((key, i) => key !== expectedKeys[i]);
    if (firstDifference !== -1) {
      return {
        ok: false,
        message: `Row ${firstDifference + 1} does not match. This question asked for a specific order, so ORDER BY matters here.`,
      };
    }
    return { ok: true, message: "Correct — values and order both match." };
  }

  const sortedMine = [...mineKeys].sort();
  const sortedExpected = [...expectedKeys].sort();
  const mismatch = sortedMine.findIndex((key, i) => key !== sortedExpected[i]);
  if (mismatch !== -1) {
    return {
      ok: false,
      message: "Right shape, wrong values. Compare your rows against the expected set below.",
    };
  }

  return { ok: true, message: "Correct — the rows match, in any order." };
}

export function ChallengeLab({ lab }: { lab: Lab }) {
  const { run, read, running, status, setStage } = useDb();
  const schema = useSchema();
  const challenges = lab.challenges ?? [];

  const [index, setIndex] = useState(0);
  const [sql, setSql] = useState(challenges[0]?.starter ?? "");
  const [attempts, setAttempts] = useState<Record<number, Attempt>>({});
  const [tries, setTries] = useState<Record<number, number>>({});
  const [showHint, setShowHint] = useState(false);
  const [showSolution, setShowSolution] = useState(false);

  const challenge = challenges[index];
  const attempt = attempts[index];
  const solvedCount = useMemo(
    () => Object.values(attempts).filter((a) => a.status === "solved").length,
    [attempts],
  );

  const select = (next: number) => {
    setIndex(next);
    setSql(attempts[next]?.status === "solved" ? sql : challenges[next]?.starter ?? "");
    setShowHint(false);
    setShowSolution(false);
  };

  const check = () => {
    if (!challenge || status !== "ready") return;

    const outcome = run(sql);
    if (!outcome) return;

    if (outcome.error) {
      setAttempts((current) => ({
        ...current,
        [index]: {
          status: "error",
          message: "Your SQL did not run. Fix the error and try again.",
          mine: null,
          expected: null,
          error: outcome.error,
        },
      }));
      return;
    }

    const mine = outcome.sets[0] ?? null;
    const expected = read(challenge.solution);
    const { ok, message } = compare(mine, expected, challenge.orderMatters ?? false);

    setTries((current) => ({ ...current, [index]: (current[index] ?? 0) + 1 }));
    setAttempts((current) => ({
      ...current,
      [index]: {
        status: ok ? "solved" : "wrong",
        message,
        mine,
        expected: ok ? null : expected,
      },
    }));
  };

  if (!challenge) {
    return <LabIntro lab={lab} />;
  }

  const attemptCount = tries[index] ?? 0;

  return (
    <LabScroll>
      <LabIntro lab={lab} />

      <div className="grid gap-5 xl:grid-cols-12">
        <div className="space-y-4 xl:col-span-8">
          <Panel
            title={`Challenge ${index + 1} of ${challenges.length}`}
            subtitle={`${solvedCount} solved`}
            actions={
              <>
                <PillButton onClick={() => select(Math.max(index - 1, 0))} disabled={index === 0}>
                  Previous
                </PillButton>
                <PillButton
                  onClick={() => select(Math.min(index + 1, challenges.length - 1))}
                  disabled={index === challenges.length - 1}
                >
                  Next
                </PillButton>
              </>
            }
          >
            <p className="text-[0.9375rem] leading-relaxed text-pg-text">
              {challenge.prompt}
            </p>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <PillButton onClick={() => setShowHint((on) => !on)}>
                {showHint ? "Hide hint" : "Show hint"}
              </PillButton>
              {attemptCount >= 2 || attempt?.status === "solved" ? (
                <PillButton onClick={() => setShowSolution((on) => !on)}>
                  {showSolution ? "Hide reference answer" : "Show reference answer"}
                </PillButton>
              ) : (
                <span className="text-[0.6875rem] text-pg-faint">
                  Reference answer unlocks after two attempts
                </span>
              )}
            </div>

            {showHint ? (
              <p className="mt-3 rounded-lg bg-pg-iris-soft px-3.5 py-2.5 text-[0.8125rem] leading-relaxed text-pg-iris">
                {challenge.hint}
              </p>
            ) : null}

            {showSolution ? (
              <pre className="mt-3 overflow-x-auto rounded-lg bg-pg-bg p-3 font-mono text-[0.75rem] leading-relaxed text-pg-text">
                {challenge.solution}
              </pre>
            ) : null}
          </Panel>

          <SqlEditor
            value={sql}
            onChange={setSql}
            onRun={check}
            schema={schema}
            running={running}
            runLabel="Check answer"
            rows={10}
            label={`Challenge ${index + 1} SQL editor`}
          />

          {attempt ? (
            <div
              className={cn(
                "rounded-2xl border px-4 py-3.5",
                attempt.status === "solved" && "border-pg-sky/45 bg-pg-sky-soft",
                attempt.status === "wrong" && "border-pg-gold/40 bg-pg-gold-soft",
                attempt.status === "error" && "border-pg-rose/45 bg-pg-rose-soft",
              )}
            >
              <p
                className={cn(
                  "text-[0.9375rem] font-medium",
                  attempt.status === "solved" && "text-pg-sky",
                  attempt.status === "wrong" && "text-pg-gold",
                  attempt.status === "error" && "text-pg-rose",
                )}
              >
                {attempt.status === "solved" ? "Passed" : attempt.status === "error" ? "SQL error" : "Not yet"}
              </p>
              <p className="mt-1 text-[0.8125rem] leading-relaxed text-pg-text">
                {attempt.message}
              </p>
              {attempt.error ? (
                <p className="mt-2 font-mono text-[0.75rem] text-pg-rose">
                  {attempt.error}
                </p>
              ) : null}

              {attempt.expected ? (
                <div className="mt-3">
                  <p className="mb-1.5 text-[0.75rem] font-medium text-pg-dim">
                    Expected result
                  </p>
                  <ResultTable set={attempt.expected} maxRows={30} />
                </div>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className="space-y-4 xl:col-span-4">
          <Panel title="All challenges" bodyClassName="p-2.5">
            <ol className="space-y-1">
              {challenges.map((item, itemIndex) => {
                const state = attempts[itemIndex]?.status;
                return (
                  <li key={item.prompt}>
                    <button
                      type="button"
                      onClick={() => select(itemIndex)}
                      className={cn(
                        "flex w-full items-start gap-2.5 rounded-lg px-3 py-2 text-left transition-colors",
                        itemIndex === index
                          ? "bg-pg-iris-soft text-pg-text"
                          : "text-pg-dim hover:bg-pg-hover hover:text-pg-text",
                      )}
                    >
                      <span
                        aria-hidden="true"
                        className={cn(
                          "mt-1.5 size-1.5 shrink-0 rounded-full",
                          state === "solved" && "bg-pg-sky",
                          state === "wrong" && "bg-pg-gold",
                          state === "error" && "bg-pg-rose",
                          !state && "bg-pg-hover",
                        )}
                      />
                      <span className="min-w-0 flex-1 text-[0.8125rem] leading-relaxed">
                        {item.prompt.length > 74
                          ? `${item.prompt.slice(0, 74)}…`
                          : item.prompt}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ol>
          </Panel>

          <Panel title="Live database" bodyClassName="p-3">
            <TableExplorer
              className="h-80"
              onSelect={(statement) => setSql(statement)}
              onOpenMap={() => setStage("map")}
            />
          </Panel>
        </div>
      </div>
    </LabScroll>
  );
}
