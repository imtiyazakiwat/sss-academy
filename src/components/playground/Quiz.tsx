"use client";

import { useState } from "react";

import type { QuizQuestion } from "@/content/labs";
import { cn } from "@/lib/cn";

/**
 * Dock quiz. Answering is single-shot and the explanation always appears —
 * including on a correct answer, because knowing *why* an answer is right is the
 * part that transfers to an interview.
 */
export function Quiz({ questions }: { questions: QuizQuestion[] }) {
  const [answers, setAnswers] = useState<Record<number, number>>({});

  if (questions.length === 0) {
    return (
      <p className="px-1 py-6 text-sm text-ink-400">
        This lab has no quiz. Use the challenges or interview questions instead.
      </p>
    );
  }

  const answered = Object.keys(answers).length;
  const correct = questions.filter((q, i) => answers[i] === q.answer).length;

  return (
    <div className="space-y-4">
      {answered > 0 ? (
        <p className="font-mono text-xs text-ink-400">
          {correct} / {answered} correct
        </p>
      ) : null}

      {questions.map((question, questionIndex) => {
        const chosen = answers[questionIndex];
        const done = chosen !== undefined;

        return (
          <fieldset
            key={question.question}
            className="rounded-xl border border-white/10 bg-white/[0.03] p-4"
          >
            <legend className="px-1 text-[0.8125rem] leading-relaxed font-medium text-white">
              {question.question}
            </legend>

            <div className="mt-3 space-y-1.5">
              {question.options.map((option, optionIndex) => {
                const isAnswer = optionIndex === question.answer;
                const isChosen = chosen === optionIndex;

                return (
                  <label
                    key={option}
                    className={cn(
                      "flex cursor-pointer items-start gap-2.5 rounded-lg border px-3 py-2 text-[0.8125rem] transition-colors",
                      !done && "border-white/10 hover:border-white/25 hover:bg-white/[0.04]",
                      done && isAnswer && "border-mint-500/50 bg-mint-500/12 text-white",
                      done &&
                        isChosen &&
                        !isAnswer &&
                        "border-ember-500/50 bg-ember-500/12 text-white",
                      done && !isAnswer && !isChosen && "border-white/8 text-ink-400",
                      done && "cursor-default",
                    )}
                  >
                    <input
                      type="radio"
                      name={`quiz-${questionIndex}`}
                      checked={isChosen}
                      disabled={done}
                      onChange={() =>
                        setAnswers((current) => ({
                          ...current,
                          [questionIndex]: optionIndex,
                        }))
                      }
                      className="mt-0.5 accent-violet-500"
                    />
                    <span className="min-w-0 flex-1 text-ink-100">{option}</span>
                    {done && isAnswer ? (
                      <span className="shrink-0 text-xs font-medium text-mint-100">
                        Correct
                      </span>
                    ) : null}
                  </label>
                );
              })}
            </div>

            {done ? (
              <p className="mt-3 border-t border-white/8 pt-3 text-[0.8125rem] leading-relaxed text-ink-300">
                {question.explain}
              </p>
            ) : null}
          </fieldset>
        );
      })}
    </div>
  );
}
