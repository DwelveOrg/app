"use client";

import { Check, X } from "lucide-react";
import { useTranslation } from "react-i18next";

import { optionLabel } from "@/app/(root)/_lib/test-form";
import {
  readAnswer,
  type MultiChoiceAnswer,
  type SingleChoiceAnswer,
} from "@/lib/tests/answers";
import { cn } from "@/lib/utils";
import type { QuestionRenderProps } from "../types";

/**
 * One choice question — single or multiple.
 *
 * The row is the target, not the little circle beside it. A student answering
 * forty questions on a phone should not have to hit a 16px radio, and a native
 * `<label>` wrapping a visually-hidden input gets the whole row for free
 * without reimplementing keyboard behaviour, which is the part hand-rolled
 * "clickable div" options always lose.
 *
 * In review mode the same rows carry the marks: a tick on the right answer, a
 * cross on a wrong one the student chose. Never colour alone — the design
 * system's rule about correct/incorrect exists because this component is
 * exactly where a colour-blind student would be told nothing at all
 * (`docs/design/design-system.md` §3.3).
 */
export default function ChoiceInput({
  question,
  mode,
  value,
  onChange,
  result,
  disabled,
  multiple,
  struckOptionIds,
}: QuestionRenderProps & { multiple: boolean }) {
  const { t } = useTranslation();
  const readOnly = mode !== "answer" || disabled;

  const chosen = new Set(
    multiple
      ? (readAnswer("MULTI_CHOICE", value) as MultiChoiceAnswer | null)?.optionIds ?? []
      : [(readAnswer("SINGLE_CHOICE", value) as SingleChoiceAnswer | null)?.optionId].filter(
          Boolean,
        ),
  );

  const correct = new Set(
    correctIds(result?.correctValue, multiple),
  );
  const showKey = mode === "review" && result?.correctValue !== undefined;

  const toggle = (optionId: string) => {
    if (readOnly || !onChange) return;

    if (!multiple) {
      onChange({ optionId });
      return;
    }

    const next = new Set(chosen);
    if (next.has(optionId)) next.delete(optionId);
    else next.add(optionId);
    // Ordered by the option list rather than by click order, so a saved answer
    // is stable and two students who picked the same options store the same
    // value — which is what makes the distractor counts comparable.
    onChange({
      optionIds: question.options
        .filter((option) => next.has(option.id))
        .map((option) => option.id),
    });
  };

  return (
    <ul className="space-y-2" role={multiple ? "group" : undefined}>
      {question.options.map((option, index) => {
        const picked = chosen.has(option.id);
        const isKey = showKey && correct.has(option.id);
        const wrongPick = showKey && picked && !correct.has(option.id);
        const struck = struckOptionIds?.has(option.id) ?? false;

        return (
          <li key={option.id}>
            <label
              className={cn(
                "interactive-flat flex cursor-pointer items-start gap-3 rounded-xl border p-3 outline-none",
                "focus-within:ring-2 focus-within:ring-ring/40",
                readOnly && "cursor-default",
                picked && !showKey
                  ? "border-primary/45 bg-accent"
                  : "border-border bg-card",
                !readOnly && !picked && "hover:border-primary/25 hover:bg-muted",
                isKey && "border-success/50 bg-[color-mix(in_srgb,var(--success)_8%,transparent)]",
                wrongPick &&
                  "border-destructive/50 bg-[color-mix(in_srgb,var(--destructive)_7%,transparent)]",
                struck && "opacity-55",
              )}
            >
              <input
                type={multiple ? "checkbox" : "radio"}
                name={question.id}
                value={option.id}
                checked={picked}
                disabled={readOnly}
                onChange={() => toggle(option.id)}
                className="sr-only"
              />

              <span
                aria-hidden="true"
                className={cn(
                  "mt-px grid size-6 shrink-0 place-items-center border text-2xs font-semibold",
                  multiple ? "rounded-md" : "rounded-full",
                  picked
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-muted text-muted-foreground",
                  struck && "line-through",
                )}
              >
                {option.label || optionLabel(index)}
              </span>

              <span
                className={cn(
                  "exam-prose min-w-0 flex-1 text-15 text-foreground",
                  struck && "line-through decoration-2",
                )}
              >
                {option.text}
              </span>

              {/* Icon plus words, so the mark survives a greyscale printout. */}
              {isKey ? (
                <span className="mt-px inline-flex shrink-0 items-center gap-1 text-2xs font-semibold text-success">
                  <Check className="size-3.5" aria-hidden="true" />
                  {t("exam.paper.correctAnswer")}
                </span>
              ) : null}
              {wrongPick ? (
                <span className="mt-px inline-flex shrink-0 items-center gap-1 text-2xs font-semibold text-destructive">
                  <X className="size-3.5" aria-hidden="true" />
                  {t("exam.paper.yourAnswer")}
                </span>
              ) : null}
            </label>
          </li>
        );
      })}
    </ul>
  );
}

/** Reads the key out of whichever choice shape the server sent. */
function correctIds(correctValue: unknown, multiple: boolean): string[] {
  if (!correctValue || typeof correctValue !== "object") return [];
  const record = correctValue as Record<string, unknown>;

  if (multiple && Array.isArray(record.optionIds)) {
    return record.optionIds.filter((id): id is string => typeof id === "string");
  }
  return typeof record.optionId === "string" ? [record.optionId] : [];
}
