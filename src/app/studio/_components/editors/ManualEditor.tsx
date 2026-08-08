"use client";

import { PenLine } from "lucide-react";
import { useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";

import Textarea from "@/components/ui/textarea";
import type { QuestionEditorProps } from "../../_types";
import { EditorLabel, Field, NumberField } from "./fields";

/**
 * Essays and IELTS writing tasks, which have no answer key at all.
 *
 * What the teacher sets is the shape of the expected response and the rubric
 * they will mark against, so the rubric leads — it is the substance of the
 * question, not a footnote under two number fields as it was before. The
 * "nothing here is graded automatically" statement is the first thing on
 * screen, because a teacher who assumes otherwise finds out at the wrong time.
 */
export default function ManualEditor({
  control,
  name,
  disabled,
}: QuestionEditorProps) {
  const { t } = useTranslation();

  const minWords = useWatch({ control, name: `${name}.config.minWords` }) ?? null;
  const maxWords = useWatch({ control, name: `${name}.config.maxWords` }) ?? null;

  return (
    <div className="space-y-3">
      <p className="flex items-start gap-2 rounded-xl bg-muted px-3 py-2 text-2xs text-muted-foreground">
        <PenLine className="mt-px size-3.5 shrink-0" aria-hidden="true" />
        {t("root.tests.builder.manual.notice")}
      </p>

      <Field
        size="sm"
        label={t("root.tests.builder.manual.rubric")}
        hint={t("root.tests.builder.manual.rubricHint")}
      >
        <Textarea
          {...control.register(`${name}.config.rubric`)}
          rows={5}
          disabled={disabled}
          placeholder={t("root.tests.builder.manual.rubricPlaceholder")}
          className="py-2.5"
        />
      </Field>

      <div className="space-y-2">
        <EditorLabel
          hint={
            minWords || maxWords
              ? t("root.tests.builder.manual.rangeSummary", {
                  min: minWords ?? "—",
                  max: maxWords ?? "—",
                })
              : t("root.tests.builder.manual.rangeHint")
          }
        >
          {t("root.tests.builder.manual.range")}
        </EditorLabel>

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
      </div>
    </div>
  );
}
