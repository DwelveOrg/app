"use client";

import { Check, X } from "lucide-react";
import { useTranslation } from "react-i18next";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { readAnswer, type MatchingAnswer } from "@/lib/tests/answers";
import { cn } from "@/lib/utils";
import type { QuestionRenderProps } from "../types";

/**
 * Matching: each item on the left takes a key from the shared pool on the right.
 *
 * The pool is listed once, above, rather than repeated inside every dropdown's
 * option text. A matching-headings question has eight headings of a dozen words
 * each; putting them in the select would make a control the student has to open
 * to read, eight times, for one question.
 *
 * So the select carries the **key** — A, B, C — and the legend above says what
 * each key is. That is also how the question is printed on a real paper, which
 * matters more than it sounds: a student who has practised on paper should not
 * have to learn a second layout to sit the same exam here.
 */
export default function MatchingInput({
  question,
  mode,
  value,
  onChange,
  result,
  disabled,
}: QuestionRenderProps) {
  const { t } = useTranslation();
  const readOnly = mode !== "answer" || disabled;

  const rightItems = question.config?.rightItems ?? [];
  const pairs = (readAnswer("MATCHING", value) as MatchingAnswer | null)?.pairs ?? [];
  const chosen = new Map(pairs.map((pair) => [pair.optionId, pair.key]));

  const key = new Map(correctPairs(result?.correctValue));
  const showKey = mode === "review" && result?.correctValue !== undefined;

  const setPair = (optionId: string, pairKey: string) => {
    if (readOnly || !onChange) return;

    const next = new Map(chosen);

    /*
     * Each key may be used once, and picking one that is already taken moves
     * it rather than duplicating it.
     *
     * This is not a UI preference — the backend's answer validator rejects a
     * matching value with a repeated key outright, so a paper that allowed one
     * would fail every autosave from that moment on and the student would have
     * no way to tell what was wrong. Moving the key is also what a student
     * doing this on paper would do: an answer written in the wrong row gets
     * crossed out of it.
     */
    for (const [existingOptionId, existingKey] of next) {
      if (existingKey === pairKey && existingOptionId !== optionId) {
        next.delete(existingOptionId);
      }
    }

    next.set(optionId, pairKey);

    onChange({
      // Ordered by the left column so the saved value is stable regardless of
      // which row the student filled first.
      pairs: question.options
        .filter((option) => next.get(option.id))
        .map((option) => ({ optionId: option.id, key: next.get(option.id) as string })),
    });
  };

  return (
    <div className="space-y-3">
      {rightItems.length > 0 ? (
        <ul className="space-y-1 rounded-xl border border-border bg-muted/50 p-3">
          {rightItems.map((item) => (
            <li key={item.key} className="flex gap-2 text-13 text-foreground">
              <span
                aria-hidden="true"
                className="inline-flex size-5 shrink-0 items-center justify-center rounded bg-card text-2xs font-semibold text-muted-foreground"
              >
                {item.key}
              </span>
              <span className="min-w-0">{item.text}</span>
            </li>
          ))}
        </ul>
      ) : null}

      <ul className="divide-y divide-border rounded-xl border border-border">
        {question.options.map((option) => {
          const picked = chosen.get(option.id) ?? "";
          const expected = key.get(option.id);
          const right = showKey && expected != null && picked === expected;
          const wrong = showKey && picked !== "" && expected != null && picked !== expected;

          return (
            <li key={option.id} className="flex flex-wrap items-center gap-3 p-3">
              <span className="min-w-0 flex-1 text-15 text-foreground">{option.text}</span>

              <Select
                value={picked}
                disabled={readOnly}
                onValueChange={(next) => setPair(option.id, next)}
              >
                <SelectTrigger
                  className={cn(
                    "w-24 shrink-0",
                    right && "border-success/50",
                    wrong && "border-destructive/50",
                  )}
                  aria-label={t("exam.paper.matchLabel", { item: option.text })}
                >
                  <SelectValue placeholder={t("exam.paper.pick")} />
                </SelectTrigger>
                <SelectContent>
                  {rightItems.map((item) => (
                    <SelectItem key={item.key} value={item.key}>
                      {item.key}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {right ? (
                <Check className="size-4 shrink-0 text-success" aria-hidden="true" />
              ) : null}
              {wrong ? (
                <span className="inline-flex shrink-0 items-center gap-1 text-2xs font-semibold text-destructive">
                  <X className="size-3.5" aria-hidden="true" />
                  {t("exam.paper.expected", { key: expected })}
                </span>
              ) : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function correctPairs(correctValue: unknown): [string, string][] {
  if (!correctValue || typeof correctValue !== "object") return [];
  const pairs = (correctValue as { pairs?: unknown }).pairs;
  if (!Array.isArray(pairs)) return [];

  return pairs.flatMap((pair) => {
    if (!pair || typeof pair !== "object") return [];
    const { optionId, key } = pair as { optionId?: unknown; key?: unknown };
    return typeof optionId === "string" && typeof key === "string"
      ? ([[optionId, key]] as [string, string][])
      : [];
  });
}
