"use client";

import { Plus, Shuffle } from "lucide-react";
import { useFieldArray } from "react-hook-form";
import { useTranslation } from "react-i18next";

import { TEST_LIMITS } from "@/app/(root)/_lib/tests.actions.schemas";
import { blankOption } from "@/app/(root)/_lib/test-form";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import type { QuestionEditorProps } from "../../_types";
import SortableList, { SortableRow } from "@/components/ui/SortableList";
import { EditorLabel, RowControls, RowTextInput } from "./fields";

/**
 * `ORDERING` questions, where the order shown here *is* the answer key and the
 * student sees the same items shuffled.
 *
 * There is nothing to mark correct, so the editor numbers the rows and makes
 * dragging them the primary action — this is the one question type where
 * reordering is not an editing convenience but the act of writing the answer.
 * The numbers are positions, not labels, so they recompute as rows move.
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
      <EditorLabel hint={t("root.tests.builder.ordering.hint")}>
        {t("root.tests.builder.ordering.title")}
      </EditorLabel>

      <SortableList
        ids={fields.map((field) => field.id)}
        onReorder={move}
        disabled={disabled}
        className="grid gap-1.5"
      >
        {fields.map((field, index) => (
          <SortableRow key={field.id} id={field.id} disabled={disabled}>
            {({ setNodeRef, style, handle, isDragging }) => (
              <div
                ref={setNodeRef}
                style={style}
                className={cn(
                  "flex items-center gap-2 rounded-xl border border-border bg-background px-2 py-1.5",
                  isDragging && "shadow-elev-3",
                )}
              >
                {handle}

                <span
                  aria-hidden="true"
                  className="numeric grid size-6 shrink-0 place-items-center rounded-[var(--radius-pill)] bg-[color-mix(in_srgb,var(--primary)_12%,transparent)] text-2xs font-semibold text-primary"
                >
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
              </div>
            )}
          </SortableRow>
        ))}
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
          {t("root.tests.builder.ordering.add")}
        </Button>

        <p className="inline-flex items-center gap-1.5 text-2xs text-muted-foreground">
          <Shuffle className="size-3" aria-hidden="true" />
          {t("root.tests.builder.ordering.shuffledNotice")}
        </p>
      </div>
    </div>
  );
}
