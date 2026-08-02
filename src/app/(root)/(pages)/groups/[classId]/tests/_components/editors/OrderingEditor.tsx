"use client";

import { ListOrdered, Plus } from "lucide-react";
import { useFieldArray } from "react-hook-form";
import { useTranslation } from "react-i18next";

import { TEST_LIMITS } from "@/app/(root)/_lib/tests.actions.schemas";
import { Button } from "@/components/ui/Button";
import type { QuestionEditorProps } from "../../_types";
import { blankOption } from "../../_lib/testForm";
import { RowControls, RowTextInput } from "./fields";

/**
 * `ORDERING` questions store their answer key as position: the order shown here
 * *is* the correct order, and the student sees it shuffled at render time.
 * There is nothing to mark correct, so the editor numbers the rows instead.
 */
export default function OrderingEditor({
  control,
  name,
  spec,
  disabled,
}: QuestionEditorProps) {
  const { t } = useTranslation();
  const { fields, append, remove, move } = useFieldArray({
    control,
    name: `${name}.options`,
  });

  const minOptions = Math.max(spec.minOptions ?? 2, 2);
  const maxOptions = Math.min(
    spec.maxOptions ?? TEST_LIMITS.optionsPerQuestion,
    TEST_LIMITS.optionsPerQuestion,
  );

  return (
    <div className="space-y-2">
      <p className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--foreground)]">
        <ListOrdered
          className="h-3.5 w-3.5 text-[var(--muted-foreground)]"
          aria-hidden="true"
        />
        {t("root.tests.builder.ordering.title")}
      </p>

      <ol className="grid gap-2">
        {fields.map((field, index) => (
          <li
            key={field.id}
            className="flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 py-2"
          >
            <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[color-mix(in_srgb,var(--primary)_12%,transparent)] text-[11px] font-semibold text-[var(--primary)]">
              {index + 1}
            </span>
            <RowTextInput
              control={control}
              name={`${name}.options.${index}.text`}
              disabled={disabled}
              placeholder={t("root.tests.builder.ordering.placeholder")}
              ariaLabel={t("root.tests.builder.ordering.itemLabel", {
                index: index + 1,
              })}
            />
            <RowControls
              index={index}
              count={fields.length}
              onMove={move}
              onRemove={remove}
              canRemove={fields.length > minOptions}
              disabled={disabled}
              moveUpLabel={t("root.tests.builder.ordering.moveUp")}
              moveDownLabel={t("root.tests.builder.ordering.moveDown")}
              removeLabel={t("root.tests.builder.ordering.remove")}
            />
          </li>
        ))}
      </ol>

      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={disabled || fields.length >= maxOptions}
        onClick={() => append(blankOption(fields.length))}
      >
        <Plus className="h-3.5 w-3.5" />
        {t("root.tests.builder.ordering.add")}
      </Button>

      <p className="text-[11px] text-[var(--muted-foreground)]">
        {t("root.tests.builder.ordering.hint")}
      </p>
    </div>
  );
}
