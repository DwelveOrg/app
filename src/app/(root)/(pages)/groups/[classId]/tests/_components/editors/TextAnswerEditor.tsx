"use client";

import { Plus } from "lucide-react";
import { Controller, useFieldArray } from "react-hook-form";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { Switch } from "@/components/ui/switch";
import type { QuestionEditorProps } from "../../_types";
import { NumberField, RowControls } from "./fields";

/**
 * The answer key for `TEXT` questions — short answers, gap fills, sentence and
 * summary completion.
 *
 * Several accepted answers are the norm, not the exception: IELTS marks both
 * "20th century" and "twentieth century" right, so the editor leads with a list
 * rather than a single box.
 */
export default function TextAnswerEditor({
  control,
  name,
  disabled,
}: QuestionEditorProps) {
  const { t } = useTranslation();
  const { fields, append, remove, move } = useFieldArray({
    control,
    name: `${name}.config.acceptedAnswers`,
  });

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <p className="text-xs font-medium text-[var(--foreground)]">
          {t("root.tests.builder.text.title")}
        </p>

        <div className="grid gap-2">
          {fields.map((field, index) => (
            <div
              key={field.id}
              className="flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 py-2"
            >
              <Input
                {...control.register(
                  `${name}.config.acceptedAnswers.${index}.value`,
                )}
                disabled={disabled}
                placeholder={t("root.tests.builder.text.placeholder")}
                className="py-2"
              />
              <RowControls
                index={index}
                count={fields.length}
                onMove={move}
                onRemove={remove}
                canRemove={fields.length > 1}
                disabled={disabled}
                moveUpLabel={t("root.tests.builder.text.moveUp")}
                moveDownLabel={t("root.tests.builder.text.moveDown")}
                removeLabel={t("root.tests.builder.text.remove")}
              />
            </div>
          ))}
        </div>

        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={disabled}
          onClick={() => append({ value: "" })}
        >
          <Plus className="h-3.5 w-3.5" />
          {t("root.tests.builder.text.add")}
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <NumberField
          control={control}
          name={`${name}.config.maxWords`}
          label={t("root.tests.builder.text.maxWords")}
          hint={t("root.tests.builder.text.maxWordsHint")}
          min={1}
          step={1}
          disabled={disabled}
        />

        <div className="flex items-end">
          <Controller
            control={control}
            name={`${name}.config.caseSensitive`}
            render={({ field }) => (
              <label className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 py-2.5">
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  disabled={disabled}
                />
                <span className="text-xs font-medium text-[var(--foreground)]">
                  {t("root.tests.builder.text.caseSensitive")}
                </span>
              </label>
            )}
          />
        </div>
      </div>
    </div>
  );
}
