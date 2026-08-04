"use client";

import { useTranslation } from "react-i18next";

import type { QuestionEditorProps } from "../../_types";
import { NumberField } from "./fields";

/**
 * The answer key for `NUMERIC` questions, including the SAT student-produced
 * response (grid-in).
 *
 * A tolerance and an accepted range are both offered because they answer
 * different questions: tolerance forgives rounding around one right answer, a
 * range accepts any value in an interval.
 */
export default function NumericEditor({
  control,
  name,
  disabled,
}: QuestionEditorProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-3">
      <p className="text-xs font-medium text-foreground">
        {t("root.tests.builder.numeric.title")}
      </p>

      <div className="grid gap-3 sm:grid-cols-2">
        <NumberField
          control={control}
          name={`${name}.config.answer`}
          label={t("root.tests.builder.numeric.answer")}
          placeholder={t("root.tests.builder.numeric.answerPlaceholder")}
          step={0.01}
          disabled={disabled}
        />
        <NumberField
          control={control}
          name={`${name}.config.tolerance`}
          label={t("root.tests.builder.numeric.tolerance")}
          hint={t("root.tests.builder.numeric.toleranceHint")}
          min={0}
          step={0.01}
          disabled={disabled}
        />
      </div>

      <fieldset className="rounded-xl border border-border bg-background p-3">
        <legend className="px-1 text-2xs font-medium text-muted-foreground">
          {t("root.tests.builder.numeric.rangeTitle")}
        </legend>
        <div className="grid gap-3 sm:grid-cols-2">
          <NumberField
            control={control}
            name={`${name}.config.rangeMin`}
            label={t("root.tests.builder.numeric.rangeMin")}
            step={0.01}
            disabled={disabled}
          />
          <NumberField
            control={control}
            name={`${name}.config.rangeMax`}
            label={t("root.tests.builder.numeric.rangeMax")}
            step={0.01}
            disabled={disabled}
          />
        </div>
        <p className="mt-2 text-2xs text-muted-foreground">
          {t("root.tests.builder.numeric.rangeHint")}
        </p>
      </fieldset>
    </div>
  );
}
