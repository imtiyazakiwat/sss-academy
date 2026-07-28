"use client";

import { useEffect, useRef } from "react";

import { useDb, type LogKind } from "@/components/playground/DbProvider";
import { cn } from "@/lib/cn";

const KIND_STYLE: Record<LogKind, { prefix: string; className: string }> = {
  sql: { prefix: "›", className: "text-pg-iris" },
  info: { prefix: "·", className: "text-pg-dim" },
  ok: { prefix: "✓", className: "text-pg-sky" },
  warn: { prefix: "!", className: "text-pg-gold" },
  error: { prefix: "✗", className: "text-pg-rose" },
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
    <div className={cn("flex h-full min-h-0 flex-col", className)}>
      <div
        ref={scrollerRef}
        className="pg-scroll min-h-0 flex-1 overflow-auto rounded-xl border border-pg-line bg-pg-bg p-3"
      >
        {logs.length === 0 ? (
          <p className="text-sm text-pg-dim">
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
                <li key={line.id} className="animate-pg-fade-in flex gap-2.5">
                  <span className="shrink-0 text-[0.6875rem] text-pg-faint tabular-nums">
                    {line.at}
                  </span>
                  <span className={cn("shrink-0", style.className)}>
                    {style.prefix}
                  </span>
                  <span
                    className={cn(
                      "min-w-0 break-words whitespace-pre-wrap",
                      line.kind === "sql" ? "text-pg-text" : style.className,
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
        <div className="mt-2 flex shrink-0 justify-end">
          <button
            type="button"
            onClick={clearLogs}
            className="rounded-full border border-pg-line px-3 py-1 text-xs text-pg-dim transition-colors hover:border-pg-line-strong hover:text-pg-text"
          >
            Clear console
          </button>
        </div>
      ) : null}
    </div>
  );
}
