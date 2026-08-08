"use client";

import { AlertTriangle, ArrowRight, Plus } from "lucide-react";
import { Controller, useFieldArray, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";

import { TEST_LIMITS } from "@/app/(root)/_lib/tests.actions.schemas";
import { blankOption, optionLabel } from "@/app/(root)/_lib/test-form";
import { Button } from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { cn } from "@/lib/utils";
import type { QuestionEditorProps } from "../../_types";
import SortableList, { SortableRow } from "../SortableList";
import { EditorLabel, RowControls, RowTextInput } from "./fields";

export type MatchingEditorProps = QuestionEditorProps & {
  /**
   * Right-hand items the teacher can adopt with one press instead of typing —
   * the passage's paragraph labels, for matching headings. Empty for the plain
   * matching presets.
   */
  suggestions?: { key: string; text: string }[];
  /** Overrides the two column headings for a preset that names them differently. */
  labels?: { left: string; right: string };
};

/**
 * `MATCHING` questions, drawn as the two columns they actually are.
 *
 * The halves are stored differently and the editor has to make that legible:
 * left items are real options, each carrying the `matchKey` that is its answer;
 * right items are a keyed list in `config.rightItems`. What changed from the
 * previous version is the *pairing*. A `<Select>` per row meant the answer key
 * was eight dropdowns you had to open one at a time to read; here each left row
 * shows its key inline as a letter chip, so the whole key is readable at a
 * glance and a mis-wired row is visible without opening anything.
 *
 * A `matchKey` pointing at no right item is the most common way to publish a
 * broken matching question, so it is flagged on the row rather than only at
 * publish time.
 */
export default function MatchingEditor({
  control,
  setValue,
  name,
  spec,
  disabled,
  suggestions = [],
  labels,
}: MatchingEditorProps) {
  const { t } = useTranslation();

  const leftItems = useFieldArray({ control, name: `${name}.options` });
  const rightItems = useFieldArray({ control, name: `${name}.config.rightItems` });

  const options = useWatch({ control, name: `${name}.options` });
  const rights = useWatch({ control, name: `${name}.config.rightItems` });

  const rightKeys = (rights ?? [])
    .map((item) => item?.key)
    .filter((key): key is string => Boolean(key));

  const minPairs = Math.max(spec.minOptions ?? 2, 2);
  const maxPairs = Math.min(
    spec.maxOptions ?? TEST_LIMITS.optionsPerQuestion,
    TEST_LIMITS.optionsPerQuestion,
  );

  const unresolved = (options ?? []).some(
    (option) => option?.matchKey && !rightKeys.includes(option.matchKey),
  );

  /** Replaces the right column wholesale with the passage's paragraph labels. */
  const adoptSuggestions = () => {
    setValue(`${name}.config.rightItems`, suggestions, { shouldDirty: true });
  };

  return (
    <div className="space-y-3">
      <div className="grid gap-4 lg:grid-cols-2">
        {/* ---------------------------------------------------------------- */}
        {/* Left: the items students are matching                             */}
        {/* ---------------------------------------------------------------- */}
        <section className="space-y-2">
          <EditorLabel hint={t("root.tests.builder.matching.leftHint")}>
            {labels?.left ?? t("root.tests.builder.matching.leftTitle")}
          </EditorLabel>

          <SortableList
            ids={leftItems.fields.map((field) => field.id)}
            onReorder={leftItems.move}
            disabled={disabled}
            className="grid gap-1.5"
          >
            {leftItems.fields.map((field, index) => {
              const matchKey = options?.[index]?.matchKey ?? "";
              const isUnresolved = Boolean(matchKey) && !rightKeys.includes(matchKey);

              return (
                <SortableRow key={field.id} id={field.id} disabled={disabled}>
                  {({ setNodeRef, style, handle, isDragging }) => (
                    <div
                      ref={setNodeRef}
                      style={style}
                      className={cn(
                        "flex items-center gap-1.5 rounded-xl border bg-background px-2 py-1.5",
                        isUnresolved ? "border-destructive/45" : "border-border",
                        isDragging && "shadow-elev-3",
                      )}
                    >
                      {handle}

                      <RowTextInput
                        control={control}
                        name={`${name}.options.${index}.text`}
                        disabled={disabled}
                        placeholder={t("root.tests.builder.matching.leftPlaceholder")}
                        ariaLabel={t("root.tests.builder.matching.itemLabel", {
                          index: index + 1,
                        })}
                      />

                      <ArrowRight
                        className="size-3.5 shrink-0 text-muted-foreground"
                        aria-hidden="true"
                      />

                      <Controller
                        control={control}
                        name={`${name}.options.${index}.matchKey`}
                        render={({ field: keyField }) => (
                          <span className="flex shrink-0 flex-wrap gap-1">
                            {rightKeys.length === 0 ? (
                              <span className="text-2xs text-muted-foreground">
                                {t("root.tests.builder.matching.noKeys")}
                              </span>
                            ) : null}

                            {rightKeys.map((key) => {
                              const active = keyField.value === key;

                              return (
                                <button
                                  key={key}
                                  type="button"
                                  disabled={disabled}
                                  aria-pressed={active}
                                  aria-label={t("root.tests.builder.matching.matchWith", {
                                    index: index + 1,
                                    key,
                                  })}
                                  onClick={() => keyField.onChange(active ? "" : key)}
                                  className={cn(
                                    "min-w-6 cursor-pointer rounded-md border px-1.5 py-1 text-2xs font-semibold outline-none",
                                    "focus-visible:ring-2 focus-visible:ring-ring/40 disabled:pointer-events-none disabled:opacity-55",
                                    active
                                      ? "border-success bg-[color-mix(in_srgb,var(--success)_16%,transparent)] text-success"
                                      : "border-border bg-card text-muted-foreground hover:border-primary/30 hover:text-foreground",
                                  )}
                                >
                                  {key}
                                </button>
                              );
                            })}
                          </span>
                        )}
                      />

                      <RowControls
                        index={index}
                        count={leftItems.fields.length}
                        onMove={leftItems.move}
                        onRemove={leftItems.remove}
                        canRemove={leftItems.fields.length > minPairs}
                        disabled={disabled}
                        moveUpLabel={t("root.tests.builder.matching.moveUp")}
                        moveDownLabel={t("root.tests.builder.matching.moveDown")}
                        removeLabel={t("root.tests.builder.matching.remove")}
                      />
                    </div>
                  )}
                </SortableRow>
              );
            })}
          </SortableList>

          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={disabled || leftItems.fields.length >= maxPairs}
            onClick={() => leftItems.append(blankOption(leftItems.fields.length))}
          >
            <Plus className="size-3.5" />
            {t("root.tests.builder.matching.addLeft")}
          </Button>
        </section>

        {/* ---------------------------------------------------------------- */}
        {/* Right: the pool they choose from                                  */}
        {/* ---------------------------------------------------------------- */}
        <section className="space-y-2">
          <EditorLabel
            hint={t("root.tests.builder.matching.rightHint")}
            action={
              suggestions.length > 0 ? (
                <Button
                  type="button"
                  size="xs"
                  variant="ghost"
                  disabled={disabled}
                  onClick={adoptSuggestions}
                >
                  {t("root.tests.builder.matching.useParagraphs", {
                    count: suggestions.length,
                  })}
                </Button>
              ) : null
            }
          >
            {labels?.right ?? t("root.tests.builder.matching.rightTitle")}
          </EditorLabel>

          <SortableList
            ids={rightItems.fields.map((field) => field.id)}
            onReorder={rightItems.move}
            disabled={disabled}
            className="grid gap-1.5"
          >
            {rightItems.fields.map((field, index) => (
              <SortableRow key={field.id} id={field.id} disabled={disabled}>
                {({ setNodeRef, style, handle, isDragging }) => (
                  <div
                    ref={setNodeRef}
                    style={style}
                    className={cn(
                      "flex items-center gap-1.5 rounded-xl border border-border bg-background px-2 py-1.5",
                      isDragging && "shadow-elev-3",
                    )}
                  >
                    {handle}
                    <Input
                      {...control.register(`${name}.config.rightItems.${index}.key`)}
                      disabled={disabled}
                      placeholder={optionLabel(index)}
                      className="w-14 shrink-0 py-2 text-center font-semibold"
                      aria-label={t("root.tests.builder.matching.keyLabel", {
                        index: index + 1,
                      })}
                    />
                    <Input
                      {...control.register(`${name}.config.rightItems.${index}.text`)}
                      disabled={disabled}
                      placeholder={t("root.tests.builder.matching.rightPlaceholder")}
                      className="py-2"
                    />
                    <RowControls
                      index={index}
                      count={rightItems.fields.length}
                      onMove={rightItems.move}
                      onRemove={rightItems.remove}
                      canRemove={rightItems.fields.length > minPairs}
                      disabled={disabled}
                      moveUpLabel={t("root.tests.builder.matching.moveUp")}
                      moveDownLabel={t("root.tests.builder.matching.moveDown")}
                      removeLabel={t("root.tests.builder.matching.remove")}
                    />
                  </div>
                )}
              </SortableRow>
            ))}
          </SortableList>

          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={disabled || rightItems.fields.length >= maxPairs}
            onClick={() =>
              rightItems.append({
                key: optionLabel(rightItems.fields.length),
                text: "",
              })
            }
          >
            <Plus className="size-3.5" />
            {t("root.tests.builder.matching.addRight")}
          </Button>
        </section>
      </div>

      {unresolved ? (
        <p className="inline-flex items-start gap-1.5 text-2xs text-destructive">
          <AlertTriangle className="mt-px size-3.5 shrink-0" aria-hidden="true" />
          {t("root.tests.builder.matching.unresolved")}
        </p>
      ) : null}
    </div>
  );
}
