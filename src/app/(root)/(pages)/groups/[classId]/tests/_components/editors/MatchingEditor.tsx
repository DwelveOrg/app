"use client";

import { AlertTriangle, Plus } from "lucide-react";
import { Controller, useFieldArray, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";

import { TEST_LIMITS } from "@/app/(root)/_lib/tests.actions.schemas";
import { Button } from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { QuestionEditorProps } from "../../_types";
import { blankOption, optionLabel } from "../../_lib/testForm";
import { RowControls, RowTextInput } from "./fields";

/**
 * `MATCHING` questions — matching headings, information, and features.
 *
 * The two halves are stored differently, and the editor shows why: the left
 * items are real options (each carrying the `matchKey` that is its answer),
 * while the right items are a list in `config.rightItems`. A `matchKey` that
 * points at no right item is the single most common way to publish a broken
 * matching question, so it is flagged inline rather than only at publish time.
 */
export default function MatchingEditor({
  control,
  name,
  spec,
  disabled,
}: QuestionEditorProps) {
  const { t } = useTranslation();

  const leftItems = useFieldArray({ control, name: `${name}.options` });
  const rightItems = useFieldArray({ control, name: `${name}.config.rightItems` });

  // Narrow to this question: the pairing UI genuinely needs the live values.
  const options = useWatch({ control, name: `${name}.options` });
  const rights = useWatch({ control, name: `${name}.config.rightItems` });

  const rightKeys = (rights ?? []).map((item) => item?.key).filter(Boolean) as string[];
  const minPairs = Math.max(spec.minOptions ?? 2, 2);
  const maxPairs = Math.min(
    spec.maxOptions ?? TEST_LIMITS.optionsPerQuestion,
    TEST_LIMITS.optionsPerQuestion,
  );

  const addLeftItem = () => leftItems.append(blankOption(leftItems.fields.length));

  const addRightItem = () => {
    rightItems.append({ key: optionLabel(rightItems.fields.length), text: "" });
  };

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <section className="space-y-2">
        <p className="text-xs font-medium text-foreground">
          {t("root.tests.builder.matching.leftTitle")}
        </p>

        <div className="grid gap-2">
          {leftItems.fields.map((field, index) => {
            const matchKey = options?.[index]?.matchKey ?? "";
            const isUnresolved = Boolean(matchKey) && !rightKeys.includes(matchKey);

            return (
              <div
                key={field.id}
                className="flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2"
              >
                <RowTextInput
                  control={control}
                  name={`${name}.options.${index}.text`}
                  disabled={disabled}
                  placeholder={t("root.tests.builder.matching.leftPlaceholder")}
                  ariaLabel={t("root.tests.builder.matching.itemLabel", {
                    index: index + 1,
                  })}
                />

                <Controller
                  control={control}
                  name={`${name}.options.${index}.matchKey`}
                  render={({ field: selectField }) => (
                    <Select
                      value={selectField.value || undefined}
                      onValueChange={selectField.onChange}
                      disabled={disabled || rightKeys.length === 0}
                    >
                      <SelectTrigger
                        className="w-24 shrink-0"
                        aria-label={t("root.tests.builder.matching.matchFor", {
                          index: index + 1,
                        })}
                        aria-invalid={isUnresolved}
                      >
                        <SelectValue
                          placeholder={t("root.tests.builder.matching.pick")}
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {rightKeys.map((key) => (
                          <SelectItem key={key} value={key}>
                            {key}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
            );
          })}
        </div>

        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={disabled || leftItems.fields.length >= maxPairs}
          onClick={addLeftItem}
        >
          <Plus className="h-3.5 w-3.5" />
          {t("root.tests.builder.matching.addLeft")}
        </Button>
      </section>

      <section className="space-y-2">
        <p className="text-xs font-medium text-foreground">
          {t("root.tests.builder.matching.rightTitle")}
        </p>

        <div className="grid gap-2">
          {rightItems.fields.map((field, index) => (
            <div
              key={field.id}
              className="flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2"
            >
              <Input
                {...control.register(`${name}.config.rightItems.${index}.key`)}
                disabled={disabled}
                placeholder={t("root.tests.builder.matching.keyPlaceholder")}
                className="w-20 shrink-0 py-2 text-center font-semibold"
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
          ))}
        </div>

        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={disabled || rightItems.fields.length >= maxPairs}
          onClick={addRightItem}
        >
          <Plus className="h-3.5 w-3.5" />
          {t("root.tests.builder.matching.addRight")}
        </Button>
      </section>

      {(options ?? []).some(
        (option) => option?.matchKey && !rightKeys.includes(option.matchKey),
      ) ? (
        <p className="inline-flex items-start gap-1.5 text-2xs text-warning lg:col-span-2">
          <AlertTriangle className="mt-px h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          {t("root.tests.builder.matching.unresolved")}
        </p>
      ) : null}
    </div>
  );
}
