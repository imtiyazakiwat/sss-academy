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
      <p className="px-1 py-6 text-sm text-pg-dim">
        This lab has no quiz. Use the challenges or interview questions instead.
      </p>
    );
  }

  const answered = Object.keys(answers).length;
  const correct = questions.filter((q, i) => answers[i] === q.answer).length;

  return (
    <div className="space-y-4">
      {answered > 0 ? (
        <p className="font-mono text-xs text-pg-dim">
          {correct} / {answered} correct
        </p>
      ) : null}

      {questions.map((question, questionIndex) => {
        const chosen = answers[questionIndex];
        const done = chosen !== undefined;

        return (
          <fieldset
            key={question.question}
            className="rounded-xl border border-pg-line bg-pg-raised p-4"
          >
            <legend className="px-1 text-[0.8125rem] leading-relaxed font-medium text-pg-text">
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
                      !done &&
                        "border-pg-line hover:border-pg-line-strong hover:bg-pg-hover",
                      done &&
                        isAnswer &&
                        "border-pg-sky/55 bg-pg-sky-soft text-pg-text",
                      done &&
                        isChosen &&
                        !isAnswer &&
                        "border-pg-rose/55 bg-pg-rose-soft text-pg-text",
                      done && !isAnswer && !isChosen && "border-pg-line text-pg-dim",
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
                      className="mt-0.5 accent-[var(--pg-primary)]"
                    />
                    <span className="min-w-0 flex-1 text-pg-text">{option}</span>
                    {done && isAnswer ? (
                      <span className="shrink-0 text-xs font-medium text-pg-sky">
                        Correct
                      </span>
                    ) : null}
                  </label>
                );
              })}
            </div>

            {done ? (
              <p className="animate-pg-fade-in mt-3 border-t border-pg-line pt-3 text-[0.8125rem] leading-relaxed text-pg-dim">
                {question.explain}
              </p>
            ) : null}
          </fieldset>
        );
      })}
    </div>
  );
}
