"use client";

import { useMemo, useState } from "react";

import { LabIntro, Panel, PillButton } from "@/components/playground/LabChrome";
import { courses } from "@/content/courses";
import { interviewQuestions, type Lab } from "@/content/labs";
import { cn } from "@/lib/cn";

/**
 * Interview Mode. Answers stay hidden until asked for, one at a time, because
 * reading a good answer feels like knowing it and is not the same thing.
 */
export function InterviewLab({ lab }: { lab: Lab }) {
  const [filter, setFilter] = useState<string>("all");
  const [revealed, setRevealed] = useState<Set<number>>(new Set());

  const filters = useMemo(() => {
    const slugs = Array.from(
      new Set(interviewQuestions.map((question) => question.courseSlug)),
    );
    return slugs.map((slug) => ({
      slug,
      title: courses.find((course) => course.slug === slug)?.title ?? slug,
      count: interviewQuestions.filter((q) => q.courseSlug === slug).length,
    }));
  }, []);

  const visible = useMemo(
    () =>
      interviewQuestions
        .map((question, index) => ({ question, index }))
        .filter(
          ({ question }) => filter === "all" || question.courseSlug === filter,
        ),
    [filter],
  );

  const toggle = (index: number) => {
    setRevealed((current) => {
      const next = new Set(current);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const revealAll = () => setRevealed(new Set(visible.map(({ index }) => index)));
  const hideAll = () => setRevealed(new Set());

  const random = () => {
    if (visible.length === 0) return;
    const pick = visible[Math.floor(Math.random() * visible.length)];
    setRevealed(new Set());
    document
      .getElementById(`interview-${pick.index}`)
      ?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  return (
    <div className="space-y-5">
      <LabIntro lab={lab} />

      <Panel
        title={`${visible.length} question${visible.length === 1 ? "" : "s"}`}
        subtitle="Say your answer out loud, then reveal."
        actions={
          <>
            <PillButton onClick={random}>Random</PillButton>
            <PillButton onClick={revealAll}>Reveal all</PillButton>
            <PillButton onClick={hideAll} disabled={revealed.size === 0}>
              Hide all
            </PillButton>
          </>
        }
      >
        <div className="flex flex-wrap gap-1.5">
          <FilterChip
            label={`All (${interviewQuestions.length})`}
            active={filter === "all"}
            onClick={() => setFilter("all")}
          />
          {filters.map((item) => (
            <FilterChip
              key={item.slug}
              label={`${item.title} (${item.count})`}
              active={filter === item.slug}
              onClick={() => setFilter(item.slug)}
            />
          ))}
        </div>

        <ol className="mt-4 space-y-2">
          {visible.map(({ question, index }) => {
            const open = revealed.has(index);
            const course = courses.find((c) => c.slug === question.courseSlug);

            return (
              <li
                key={question.question}
                id={`interview-${index}`}
                className={cn(
                  "overflow-hidden rounded-xl border transition-colors",
                  open ? "border-white/20 bg-white/[0.04]" : "border-white/8",
                )}
              >
                <button
                  type="button"
                  onClick={() => toggle(index)}
                  aria-expanded={open}
                  className="flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-white/[0.03]"
                >
                  <span className="mt-0.5 font-mono text-[0.6875rem] text-ink-500">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[0.9375rem] leading-relaxed font-medium text-white">
                      {question.question}
                    </span>
                    {course ? (
                      <span className="mt-1 block text-[0.6875rem] uppercase tracking-[0.08em] text-violet-300">
                        {course.title}
                      </span>
                    ) : null}
                  </span>
                  <span className="shrink-0 rounded-full border border-white/15 px-2.5 py-1 text-[0.625rem] font-medium text-ink-300">
                    {open ? "Hide" : "Show answer"}
                  </span>
                </button>

                {open ? (
                  <p className="border-t border-white/8 px-4 py-3.5 text-[0.875rem] leading-relaxed text-ink-200">
                    {question.answer}
                  </p>
                ) : null}
              </li>
            );
          })}
        </ol>
      </Panel>
    </div>
  );
}

function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
        active
          ? "bg-violet-500/25 text-white"
          : "border border-white/12 text-ink-300 hover:border-white/25 hover:text-white",
      )}
    >
      {label}
    </button>
  );
}
