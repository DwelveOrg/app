"use client";

import { Check, Plus } from "lucide-react";
import { useFieldArray, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";

import { TEST_LIMITS } from "@/app/(root)/_lib/tests.actions.schemas";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";
import type { QuestionEditorProps } from "../../_types";
import { blankOption, optionLabel } from "../../_lib/testForm";
import { RowControls, RowTextInput } from "./fields";

/**
 * The answer key for `SINGLE_CHOICE` and `MULTI_CHOICE` questions, stored on
 * `TestQuestionOption.isCorrect`.
 *
 * Presets that declare `fixedOptions` (True / False / Not Given, Yes / No / Not
 * Given) get their option texts locked: the wording is what makes the question
 * type what it is, and a typo in it would silently change the exam.
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
  const hasFixedOptions = Boolean(spec.fixedOptions?.length);
  const minOptions = Math.max(spec.minOptions ?? 2, 2);
  const maxOptions = Math.min(
    spec.maxOptions ?? TEST_LIMITS.optionsPerQuestion,
    TEST_LIMITS.optionsPerQuestion,
  );

  const correctIndex = (options ?? []).findIndex((option) => option?.isCorrect);
  const correctCount = (options ?? []).filter((option) => option?.isCorrect).length;

  /** Exactly one correct option, so picking a new one clears the old. */
  const selectSingle = (index: number) => {
    fields.forEach((_, position) => {
      setValue(`${name}.options.${position}.isCorrect`, position === index, {
        shouldDirty: true,
      });
    });
  };

  const toggleMulti = (index: number, checked: boolean) => {
    setValue(`${name}.options.${index}.isCorrect`, checked, { shouldDirty: true });
  };

  const addOption = () => append(blankOption(fields.length));

  const rows = fields.map((field, index) => {
    const isCorrect = Boolean(options?.[index]?.isCorrect);

    return (
      <div
        key={field.id}
        className={cn(
          "flex items-center gap-2 rounded-xl border px-3 py-2 transition",
          isCorrect
            ? "border-[color-mix(in_srgb,var(--success)_45%,transparent)] bg-[color-mix(in_srgb,var(--success)_10%,transparent)]"
            : "border-border bg-background",
        )}
      >
        {isSingle ? (
          <RadioGroupItem
            value={String(index)}
            disabled={disabled}
            aria-label={t("root.tests.builder.options.markCorrect", {
              label: optionLabel(index),
            })}
          />
        ) : (
          <Checkbox
            checked={isCorrect}
            disabled={disabled}
            onCheckedChange={(checked) => toggleMulti(index, checked === true)}
            aria-label={t("root.tests.builder.options.markCorrect", {
              label: optionLabel(index),
            })}
          />
        )}

        <span className="w-5 shrink-0 text-center text-xs font-semibold text-muted-foreground">
          {optionLabel(index)}
        </span>

        <RowTextInput
          control={control}
          name={`${name}.options.${index}.text`}
          disabled={disabled || hasFixedOptions}
          placeholder={t("root.tests.builder.options.placeholder")}
          ariaLabel={t("root.tests.builder.options.textLabel", {
            label: optionLabel(index),
          })}
        />

        {/*
          Correctness is never signalled by colour alone: the tint above is
          paired with this check and its text label.
        */}
        {isCorrect ? (
          <span className="inline-flex shrink-0 items-center gap-1 text-2xs font-semibold text-success">
            <Check className="h-3.5 w-3.5" aria-hidden="true" />
            {t("root.tests.builder.options.correct")}
          </span>
        ) : null}

        {hasFixedOptions ? null : (
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
        )}
      </div>
    );
  });

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-foreground">
        {isSingle
          ? t("root.tests.builder.options.singleTitle")
          : t("root.tests.builder.options.multiTitle")}
      </p>

      {isSingle ? (
        <RadioGroup
          value={correctIndex >= 0 ? String(correctIndex) : ""}
          onValueChange={(value) => selectSingle(Number(value))}
          disabled={disabled}
        >
          {rows}
        </RadioGroup>
      ) : (
        <div className="grid gap-2">{rows}</div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        {hasFixedOptions ? (
          <p className="text-2xs text-muted-foreground">
            {t("root.tests.builder.options.fixedHint")}
          </p>
        ) : (
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={disabled || fields.length >= maxOptions}
            onClick={addOption}
          >
            <Plus className="h-3.5 w-3.5" />
            {t("root.tests.builder.options.add")}
          </Button>
        )}

        {correctCount === 0 ? (
          <p className="text-2xs text-warning">
            {t("root.tests.builder.options.noneCorrect")}
          </p>
        ) : null}
      </div>
    </div>
  );
}
