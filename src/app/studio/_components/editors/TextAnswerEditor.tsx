"use client";

import { Controller, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";

import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import type { QuestionEditorProps } from "../../_types";
import { WORD_LIMIT_PRESETS } from "../../_lib/questionPresentation";
import { ChipListInput, EditorLabel, NumberField } from "./fields";

/**
 * The `TEXT` answer key: a set of accepted answers.
 *
 * Several accepted answers is the norm rather than the exception — IELTS marks
 * both "20th century" and "twentieth century" right — so this leads with the
 * list, and the list is chips because the values are two or three words each.
 *
 * `wordLimits` turns on the completion-task presets. They exist because the
 * instruction on a real paper is one of three fixed sentences, all of which mean
 * a `maxWords` value, and typing "2" into a number field is not how a teacher
 * thinks about "NO MORE THAN TWO WORDS".
 */
export default function TextAnswerEditor({
  control,
  setValue,
  name,
  disabled,
  wordLimits = false,
}: QuestionEditorProps & { wordLimits?: boolean }) {
  const { t } = useTranslation();

  const accepted = useWatch({ control, name: `${name}.config.acceptedAnswers` }) ?? [];
  const maxWords = useWatch({ control, name: `${name}.config.maxWords` }) ?? null;

  const values = accepted
    .map((entry) => entry?.value ?? "")
    .filter((value) => value.length > 0);

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <EditorLabel hint={t("root.tests.builder.text.hint")}>
          {t("root.tests.builder.text.title")}
        </EditorLabel>

        <ChipListInput
          values={values}
          disabled={disabled}
          placeholder={t("root.tests.builder.text.placeholder")}
          addLabel={t("root.tests.builder.text.add")}
          emptyLabel={t("root.tests.builder.text.empty")}
          removeLabel={(value) => t("root.tests.builder.text.remove", { value })}
          onChange={(next) =>
            setValue(
              `${name}.config.acceptedAnswers`,
              next.map((value) => ({ value })),
              { shouldDirty: true },
            )
          }
        />
      </div>

      {wordLimits ? (
        <div className="space-y-2">
          <EditorLabel hint={t("root.tests.builder.text.wordLimitHint")}>
            {t("root.tests.builder.text.wordLimit")}
          </EditorLabel>

          <div className="flex flex-wrap gap-1.5">
            {WORD_LIMIT_PRESETS.map((preset) => {
              const active = maxWords === preset.maxWords;

              return (
                <button
                  key={preset.key}
                  type="button"
                  disabled={disabled}
                  aria-pressed={active}
                  onClick={() =>
                    setValue(
                      `${name}.config.maxWords`,
                      active ? null : preset.maxWords,
                      { shouldDirty: true },
                    )
                  }
                  className={cn(
                    "interactive-flat cursor-pointer rounded-lg border px-2.5 py-1.5 text-2xs font-medium outline-none",
                    "focus-visible:ring-2 focus-visible:ring-ring/40 disabled:pointer-events-none disabled:opacity-55",
                    active
                      ? "border-primary/45 bg-accent text-accent-foreground"
                      : "border-border bg-background text-muted-foreground hover:border-primary/25 hover:text-foreground",
                  )}
                >
                  {t(`root.tests.builder.text.limits.${preset.key}`)}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2">
        {wordLimits ? null : (
          <NumberField
            control={control}
            name={`${name}.config.maxWords`}
            label={t("root.tests.builder.text.maxWords")}
            hint={t("root.tests.builder.text.maxWordsHint")}
            min={1}
            step={1}
            disabled={disabled}
          />
        )}

        <Controller
          control={control}
          name={`${name}.config.caseSensitive`}
          render={({ field }) => (
            <label className="flex items-center justify-between gap-3 self-end rounded-xl border border-border bg-background px-3 py-2">
              <span className="min-w-0">
                <span className="block text-xs font-medium text-foreground">
                  {t("root.tests.builder.text.caseSensitive")}
                </span>
                <span className="block text-2xs text-muted-foreground">
                  {t("root.tests.builder.text.caseSensitiveHint")}
                </span>
              </span>
              <Switch
                checked={Boolean(field.value)}
                onCheckedChange={field.onChange}
                disabled={disabled}
                aria-label={t("root.tests.builder.text.caseSensitive")}
              />
            </label>
          )}
        />
      </div>
    </div>
  );
}
