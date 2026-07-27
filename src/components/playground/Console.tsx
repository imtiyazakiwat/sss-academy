"use client";

import { useEffect, useRef } from "react";

import { useDb, type LogKind } from "@/components/playground/DbProvider";
import { cn } from "@/lib/cn";

const KIND_STYLE: Record<LogKind, { prefix: string; className: string }> = {
  sql: { prefix: "›", className: "text-violet-200" },
  info: { prefix: "·", className: "text-ink-300" },
  ok: { prefix: "✓", className: "text-mint-100" },
  warn: { prefix: "!", className: "text-amber-200" },
  error: { prefix: "✗", className: "text-ember-200" },
};

/**
 * Job console. Everything the labs execute is logged here, so a class can
 * always answer "what did that button actually run?".
 */
export function Console({ className }: { className?: string }) {
  const { logs, clearLogs } = useDb();
  const endRef = useRef<HTMLDivElement>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);

  // Follow the tail, but only when the reader is already at the bottom —
  // yanking the view while someone reads back through a job log is hostile.
  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const distance =
      scroller.scrollHeight - scroller.scrollTop - scroller.clientHeight;
    if (distance < 80) {
      endRef.current?.scrollIntoView({ block: "end" });
    }
  }, [logs]);

  return (
    <div className={cn("flex h-full flex-col", className)}>
      <div
        ref={scrollerRef}
        className="flex-1 overflow-auto rounded-xl border border-white/10 bg-navy-950/60 p-3"
      >
        {logs.length === 0 ? (
          <p className="text-sm text-ink-400">
            Nothing has run yet. Every statement any lab executes shows up here.
          </p>
        ) : (
          <ol
            aria-live="polite"
            aria-atomic="false"
            className="space-y-0.5 font-mono text-[0.8125rem] leading-relaxed"
          >
            {logs.map((line) => {
              const style = KIND_STYLE[line.kind];
              return (
                <li key={line.id} className="flex gap-2.5">
                  <span className="shrink-0 text-[0.6875rem] text-ink-600 tabular-nums">
                    {line.at}
                  </span>
                  <span className={cn("shrink-0", style.className)}>
                    {style.prefix}
                  </span>
                  <span
                    className={cn(
                      "min-w-0 break-words whitespace-pre-wrap",
                      line.kind === "sql" ? "text-ink-200" : style.className,
                    )}
                  >
                    {line.text}
                  </span>
                </li>
              );
            })}
          </ol>
        )}
        <div ref={endRef} />
      </div>

      {logs.length > 0 ? (
        <div className="mt-2 flex justify-end">
          <button
            type="button"
            onClick={clearLogs}
            className="rounded-full border border-white/15 px-3 py-1 text-xs text-ink-300 transition-colors hover:border-white/30 hover:text-white"
          >
            Clear console
          </button>
        </div>
      ) : null}
    </div>
  );
}
