"use client";

import { Check } from "lucide-react";
import { useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";
import type { QuestionEditorProps } from "../../_types";
import { EditorLabel } from "./fields";

/**
 * A closed option set: True / False, True / False / Not Given, Yes / No / Not
 * Given.
 *
 * These presets have no options to write. The exact wording *is* the question
 * type — a paper that says "Not Stated" is not an IELTS True/False/Not Given
 * question any more — so the old editor's three disabled text inputs with
 * up/down/remove buttons beside them were three rows of controls that could
 * never be used, wrapped around the one control that could.
 *
 * What is left is the only decision there is: which of the fixed answers is
 * correct. It renders as the same row of chips the student will be choosing
 * from, so the teacher marks the key by pressing the answer.
 */
export default function FixedChoiceEditor({
  control,
  setValue,
  name,
  disabled,
}: QuestionEditorProps) {
  const { t } = useTranslation();
  const options = useWatch({ control, name: `${name}.options` }) ?? [];

  const select = (index: number) => {
    options.forEach((_, position) => {
      setValue(`${name}.options.${position}.isCorrect`, position === index, {
        shouldDirty: true,
      });
    });
  };

  const hasAnswer = options.some((option) => option?.isCorrect);

  return (
    <div className="space-y-2">
      <EditorLabel hint={t("root.tests.builder.fixed.hint")}>
        {t("root.tests.builder.fixed.title")}
      </EditorLabel>

      <div
        role="radiogroup"
        aria-label={t("root.tests.builder.fixed.title")}
        className="flex flex-wrap gap-2"
      >
        {options.map((option, index) => {
          const isCorrect = Boolean(option?.isCorrect);

          return (
            <button
              key={`${option?.text ?? index}`}
              type="button"
              role="radio"
              aria-checked={isCorrect}
              disabled={disabled}
              onClick={() => select(index)}
              className={cn(
                "interactive-flat inline-flex cursor-pointer items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium outline-none",
                "focus-visible:ring-2 focus-visible:ring-ring/40 disabled:pointer-events-none disabled:opacity-55",
                isCorrect
                  ? "border-[color-mix(in_srgb,var(--success)_50%,transparent)] bg-[color-mix(in_srgb,var(--success)_12%,transparent)] text-success"
                  : "border-border bg-background text-foreground hover:border-primary/30 hover:bg-muted",
              )}
            >
              {/*
                The check is what carries "this is the key" — the tint alone
                would be a colour-only signal, which this product forbids for
                correctness (`docs/design/design-system.md` §3.3).
              */}
              <span
                aria-hidden="true"
                className={cn(
                  "grid size-4 place-items-center rounded-full border",
                  isCorrect
                    ? "border-success bg-success text-[var(--card)]"
                    : "border-border",
                )}
              >
                {isCorrect ? <Check className="size-2.5" strokeWidth={3} /> : null}
              </span>
              {option?.text}
            </button>
          );
        })}
      </div>

      {hasAnswer ? null : (
        <p className="text-2xs text-warning">
          {t("root.tests.builder.fixed.noneCorrect")}
        </p>
      )}
    </div>
  );
}
