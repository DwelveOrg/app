"use client";

import { Check } from "lucide-react";
import { useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";

import { optionLabel } from "@/app/(root)/_lib/test-form";
import Textarea from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { QuestionEditorProps } from "../../_types";
import { EditorLabel } from "./fields";

/**
 * The SAT answer board: exactly four lettered choices, laid out two by two.
 *
 * `SAT_RW_MCQ` and `SAT_MATH_MCQ` declare `minOptions: 4, maxOptions: 4`, so
 * there is nothing to add or remove and the count is not negotiable. Rendering
 * them as a vertical list with "Add option" underneath — which is what the
 * generic choice editor does — offered an action the format forbids and looked
 * nothing like the paper.
 *
 * The letter is the answer key on a real SAT sheet, so it leads each cell and
 * pressing it marks the key. Choices get a textarea rather than an input
 * because SAT Reading & Writing options are frequently full sentences.
 */
export default function LetteredGridEditor({
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

  const correctIndex = options.findIndex((option) => option?.isCorrect);

  return (
    <div className="space-y-2">
      <EditorLabel
        hint={
          correctIndex >= 0
            ? t("root.tests.builder.lettered.answerIs", {
                label: optionLabel(correctIndex),
              })
            : t("root.tests.builder.lettered.hint")
        }
      >
        {t("root.tests.builder.lettered.title")}
      </EditorLabel>

      <div className="grid gap-2 sm:grid-cols-2">
        {options.map((option, index) => {
          const isCorrect = Boolean(option?.isCorrect);
          const label = optionLabel(index);

          return (
            <div
              key={index}
              className={cn(
                "flex gap-2 rounded-xl border p-2 transition-colors duration-[var(--dur-1)]",
                isCorrect
                  ? "border-[color-mix(in_srgb,var(--success)_45%,transparent)] bg-[color-mix(in_srgb,var(--success)_9%,transparent)]"
                  : "border-border bg-background",
              )}
            >
              <button
                type="button"
                role="radio"
                aria-checked={isCorrect}
                disabled={disabled}
                onClick={() => select(index)}
                aria-label={t("root.tests.builder.options.markCorrect", { label })}
                className={cn(
                  "grid size-8 shrink-0 cursor-pointer place-items-center rounded-lg border text-sm font-semibold outline-none",
                  "focus-visible:ring-2 focus-visible:ring-ring/40 disabled:pointer-events-none disabled:opacity-55",
                  isCorrect
                    ? "border-success bg-success text-[var(--card)]"
                    : "border-border bg-card text-muted-foreground hover:border-primary/35 hover:text-foreground",
                )}
              >
                {isCorrect ? <Check className="size-4" strokeWidth={3} /> : label}
              </button>

              <Textarea
                {...control.register(`${name}.options.${index}.text`)}
                rows={2}
                disabled={disabled}
                fieldSize="md"
                placeholder={t("root.tests.builder.lettered.placeholder", { label })}
                aria-label={t("root.tests.builder.options.textLabel", { label })}
                className="min-h-0 resize-y py-1.5"
              />
            </div>
          );
        })}
      </div>

      {correctIndex >= 0 ? null : (
        <p className="text-2xs text-warning">
          {t("root.tests.builder.options.noneCorrect")}
        </p>
      )}
    </div>
  );
}
