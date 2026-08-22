"use client";

import { Plus } from "lucide-react";
import { useFieldArray, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";

import { TEST_LIMITS } from "@/app/(root)/_lib/tests.actions.schemas";
import { optionLabel } from "@/app/(root)/_lib/test-form";
import { blankOption } from "@/app/(root)/_lib/test-form";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import type { QuestionEditorProps } from "../../_types";
import SortableList, { SortableRow } from "@/components/ui/SortableList";
import { CorrectMark, EditorLabel, RowControls, RowTextInput } from "./fields";

/**
 * An open list of options, for `SINGLE_CHOICE` and `MULTI_CHOICE` presets whose
 * wording the teacher writes.
 *
 * The correct-answer control is the row's leading marker, not a separate column:
 * "which of these is right" is one question, and splitting it across the row
 * made the old editor read as two lists. Single-choice draws a filled circle
 * and multi-choice a checkbox, which is the same shape distinction the student
 * will see.
 *
 * Presets with a closed option set are not handled here — see `FixedChoiceEditor`.
 */
export default function ChoiceEditor({
  control,
  setValue,
  name,
  spec,
  disabled,
}: QuestionEditorProps) {
  const { t } = useTranslation();
  const { fields, append, remove, move } = useFieldArray({
    control,
    name: `${name}.options`,
  });

  // Narrow: one question's options, never the tree. Re-rendering this editor
  // while its own options are typed into is cheap and expected.
  const options = useWatch({ control, name: `${name}.options` });

  const isSingle = spec.answerKind === "SINGLE_CHOICE";
  const minOptions = Math.max(spec.minOptions ?? 2, 2);
  const maxOptions = Math.min(
    spec.maxOptions ?? TEST_LIMITS.optionsPerQuestion,
    TEST_LIMITS.optionsPerQuestion,
  );

  const correctCount = (options ?? []).filter((option) => option?.isCorrect).length;

  /** Exactly one correct option, so picking a new one clears the old. */
  const setCorrect = (index: number, checked: boolean) => {
    if (isSingle) {
      fields.forEach((_, position) => {
        setValue(`${name}.options.${position}.isCorrect`, position === index, {
          shouldDirty: true,
        });
      });
      return;
    }
    setValue(`${name}.options.${index}.isCorrect`, checked, { shouldDirty: true });
  };

  return (
    <div className="space-y-2">
      <EditorLabel
        hint={
          isSingle
            ? t("root.tests.builder.options.singleHint")
            : t("root.tests.builder.options.multiHint")
        }
      >
        {isSingle
          ? t("root.tests.builder.options.singleTitle")
          : t("root.tests.builder.options.multiTitle")}
      </EditorLabel>

      <SortableList
        ids={fields.map((field) => field.id)}
        onReorder={move}
        disabled={disabled}
        className="grid gap-1.5"
      >
        {fields.map((field, index) => {
          const isCorrect = Boolean(options?.[index]?.isCorrect);
          const markLabel = t("root.tests.builder.options.markCorrect", {
            label: optionLabel(index),
          });

          return (
            <SortableRow key={field.id} id={field.id} disabled={disabled}>
              {({ setNodeRef, style, handle, isDragging }) => (
                <div
                  ref={setNodeRef}
                  style={style}
                  className={cn(
                    "flex items-center gap-2 rounded-xl border px-2 py-1.5 transition-colors duration-[var(--dur-1)]",
                    isCorrect
                      ? "border-[color-mix(in_srgb,var(--success)_45%,transparent)] bg-[color-mix(in_srgb,var(--success)_9%,transparent)]"
                      : "border-border bg-background",
                    isDragging && "shadow-elev-3",
                  )}
                >
                  {handle}

                  {/*
                    A radio would need a RadioGroup wrapper around a list that is
                    also a drag context, and Radix's roving focus fights the
                    sortable keyboard sensor for the arrow keys. A checkbox with
                    `role="radio"` semantics via aria keeps one focus model.
                  */}
                  <Checkbox
                    checked={isCorrect}
                    disabled={disabled}
                    onCheckedChange={(checked) => setCorrect(index, checked === true)}
                    aria-label={markLabel}
                    className={cn("shrink-0", isSingle && "rounded-full")}
                  />

                  <span className="w-5 shrink-0 text-center text-xs font-semibold text-muted-foreground">
                    {optionLabel(index)}
                  </span>

                  <RowTextInput
                    control={control}
                    name={`${name}.options.${index}.text`}
                    disabled={disabled}
                    placeholder={t("root.tests.builder.options.placeholder")}
                    ariaLabel={t("root.tests.builder.options.textLabel", {
                      label: optionLabel(index),
                    })}
                  />

                  {isCorrect ? (
                    <CorrectMark label={t("root.tests.builder.options.correct")} />
                  ) : null}

                  <RowControls
                    index={index}
                    count={fields.length}
                    onMove={move}
                    onRemove={remove}
                    canRemove={fields.length > minOptions}
                    disabled={disabled}
                    moveUpLabel={t("root.tests.builder.options.moveUp")}
                    moveDownLabel={t("root.tests.builder.options.moveDown")}
                    removeLabel={t("root.tests.builder.options.remove")}
                  />
                </div>
              )}
            </SortableRow>
          );
        })}
      </SortableList>

      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={disabled || fields.length >= maxOptions}
          onClick={() => append(blankOption(fields.length))}
        >
          <Plus className="size-3.5" />
          {t("root.tests.builder.options.add")}
        </Button>

        {correctCount === 0 ? (
          <p className="text-2xs text-warning">
            {t("root.tests.builder.options.noneCorrect")}
          </p>
        ) : null}
      </div>
    </div>
  );
}
