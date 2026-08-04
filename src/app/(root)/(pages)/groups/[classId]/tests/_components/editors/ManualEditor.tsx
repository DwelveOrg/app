"use client";

import { PenLine } from "lucide-react";
import { useTranslation } from "react-i18next";

import Textarea from "@/components/ui/textarea";
import type { QuestionEditorProps } from "../../_types";
import { Field, NumberField } from "./fields";

/**
 * `MANUAL` questions — essays and IELTS writing tasks — have no answer key.
 * What the teacher sets is the shape of the expected response and the rubric
 * they will mark against, so the editor says plainly that nothing here is
 * graded automatically.
 */
export default function ManualEditor({
  control,
  name,
  disabled,
}: QuestionEditorProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-3">
      <p className="inline-flex items-center gap-1.5 text-xs font-medium text-foreground">
        <PenLine className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
        {t("root.tests.builder.manual.title")}
      </p>

      <div className="grid gap-3 sm:grid-cols-2">
        <NumberField
          control={control}
          name={`${name}.config.minWords`}
          label={t("root.tests.builder.manual.minWords")}
          min={1}
          step={1}
          disabled={disabled}
        />
        <NumberField
          control={control}
          name={`${name}.config.maxWords`}
          label={t("root.tests.builder.manual.maxWords")}
          min={1}
          step={1}
          disabled={disabled}
        />
      </div>

      <Field
        label={t("root.tests.builder.manual.rubric")}
        hint={t("root.tests.builder.manual.rubricHint")}
      >
        <Textarea
          {...control.register(`${name}.config.rubric`)}
          rows={4}
          disabled={disabled}
          placeholder={t("root.tests.builder.manual.rubricPlaceholder")}
          className="py-2.5"
        />
      </Field>
    </div>
  );
}
