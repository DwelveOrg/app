"use client";

import { useCallback } from "react";
import { ArrowDown, ArrowUp, Layers, Plus, Trash2 } from "lucide-react";
import {
  Controller,
  useFieldArray,
  type Control,
  type UseFormSetValue,
} from "react-hook-form";
import { useTranslation } from "react-i18next";

import {
  TEST_LIMITS,
  type TestBuilderForm,
} from "@/app/(root)/_lib/tests.actions.schemas";
import { Button } from "@/components/ui/Button";
import Field from "@/components/ui/Field";
import Input from "@/components/ui/Input";
import Surface from "@/components/ui/Surface";
import Textarea from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { BuilderCatalog, GroupFieldName, SectionFieldName } from "../_types";
import { SECTION_KINDS, sectionAnchorId } from "../_constants";
import { createGroupDraft } from "../_lib/testForm";
import { NumberField } from "./editors/fields";
import QuestionGroupCard from "./QuestionGroupCard";

type SectionCardProps = {
  control: Control<TestBuilderForm>;
  setValue: UseFormSetValue<TestBuilderForm>;
  name: SectionFieldName;
  sectionIndex: number;
  count: number;
  sectionId: string;
  testId: string;
  catalog: BuilderCatalog;
  flaggedIds: Set<string>;
  disabled?: boolean;
  /** 1-based first question number of a group, across the whole test. */
  startNumberFor: (groupIndex: number) => number;
  onMove: (from: number, to: number) => void;
  onRemove: (index: number) => void;
  onStructureChange: () => void;
};

/**
 * One section of a test, holding its question groups.
 *
 * Every test has at least one section and one group even when the teacher never
 * asked for them — the backend creates the implicit ones so there is one read
 * path, one save path, and one future grader. For a format whose blueprint sets
 * `hidesStructure` (a simple quiz), that machinery is collapsed entirely and the
 * teacher just sees questions.
 */
export default function SectionCard({
  control,
  setValue,
  name,
  sectionIndex,
  count,
  sectionId,
  testId,
  catalog,
  flaggedIds,
  disabled,
  startNumberFor,
  onMove,
  onRemove,
  onStructureChange,
}: SectionCardProps) {
  const { t } = useTranslation();
  const { fields, append, remove, move } = useFieldArray({
    control,
    name: `${name}.groups`,
  });

  const { hidesStructure, allowsCustomSections } = catalog.blueprint;

  const handleMoveGroup = useCallback(
    (from: number, to: number) => {
      move(from, to);
      onStructureChange();
    },
    [move, onStructureChange],
  );

  const handleRemoveGroup = useCallback(
    (index: number) => {
      remove(index);
      onStructureChange();
    },
    [remove, onStructureChange],
  );

  const addGroup = () => {
    append(createGroupDraft());
    onStructureChange();
  };

  const groups = fields.map((field, groupIndex) => (
    <QuestionGroupCard
      key={field.id}
      control={control}
      setValue={setValue}
      name={`${name}.groups.${groupIndex}` as GroupFieldName}
      sectionIndex={sectionIndex}
      groupIndex={groupIndex}
      count={fields.length}
      groupId={field.serverId}
      testId={testId}
      catalog={catalog}
      startNumber={startNumberFor(groupIndex)}
      flaggedIds={flaggedIds}
      disabled={disabled}
      onMove={handleMoveGroup}
      onRemove={handleRemoveGroup}
      onStructureChange={onStructureChange}
    />
  ));

  if (hidesStructure) {
    return <div className="space-y-4">{groups}</div>;
  }

  const isFlagged = Boolean(sectionId) && flaggedIds.has(sectionId);

  return (
    /*
     * Depth ladder for the builder (design-system §4): **the section is the only card.** Its groups
     * are full-bleed bands separated by hairlines and its questions are flat rows — not a box in a
     * box in a box, which is the nesting the design system rules out outright. The card edge, the
     * band rule, and the row rule are three different weights of the same idea, so hierarchy comes
     * from rhythm rather than from three competing borders at three competing radii.
     */
    <Surface
      as="section"
      padding="lg"
      id={sectionId ? sectionAnchorId(sectionId) : undefined}
      className={cn(
        "scroll-mt-24",
        isFlagged ? "border-destructive ring-2 ring-destructive/25" : undefined,
      )}
    >
      <header className="flex flex-wrap items-start gap-3">
        <span
          aria-hidden="true"
          className="mt-1 grid size-10 shrink-0 place-items-center rounded-xl bg-[color-mix(in_srgb,var(--primary)_12%,transparent)] text-primary"
        >
          <Layers className="size-[18px]" />
        </span>

        <div className="min-w-0 flex-1">
          <Controller
            control={control}
            name={`${name}.title`}
            render={({ field, fieldState }) => (
              <>
                <Input
                  {...field}
                  disabled={disabled}
                  placeholder={t("root.tests.builder.section.titlePlaceholder")}
                  aria-label={t("root.tests.builder.section.title")}
                  aria-invalid={Boolean(fieldState.error)}
                  className="py-2 text-base font-semibold"
                />
                {fieldState.error ? (
                  <p className="mt-1 text-2xs text-destructive">
                    {t("root.tests.builder.section.titleRequired")}
                  </p>
                ) : null}
              </>
            )}
          />
        </div>

        <div className="flex items-center gap-1">
          <Button
            type="button"
            size="icon-sm"
            variant="ghost"
            disabled={disabled || sectionIndex === 0}
            aria-label={t("root.tests.builder.section.moveUp")}
            onClick={() => onMove(sectionIndex, sectionIndex - 1)}
          >
            <ArrowUp className="size-3.5" />
          </Button>
          <Button
            type="button"
            size="icon-sm"
            variant="ghost"
            disabled={disabled || sectionIndex >= count - 1}
            aria-label={t("root.tests.builder.section.moveDown")}
            onClick={() => onMove(sectionIndex, sectionIndex + 1)}
          >
            <ArrowDown className="size-3.5" />
          </Button>
          <Button
            type="button"
            size="icon-sm"
            variant="ghost"
            disabled={disabled || count <= 1}
            aria-label={t("root.tests.builder.section.remove")}
            className="text-muted-foreground hover:text-destructive"
            onClick={() => onRemove(sectionIndex)}
          >
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      </header>

      <div className="mt-4 grid gap-3 sm:grid-cols-[12rem_10rem_minmax(0,1fr)]">
        {allowsCustomSections ? (
          <Controller
            control={control}
            name={`${name}.kind`}
            render={({ field }) => (
              <Field size="sm" label={t("root.tests.builder.section.kind")}>
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={disabled}
                >
                  <SelectTrigger aria-label={t("root.tests.builder.section.kind")}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SECTION_KINDS.map((kind) => (
                      <SelectItem key={kind} value={kind}>
                        {t(`root.tests.sectionKinds.${kind}`, {
                          defaultValue: kind,
                        })}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            )}
          />
        ) : (
          // The format fixes its section kinds, so this is shown, not chosen.
          <Controller
            control={control}
            name={`${name}.kind`}
            render={({ field }) => (
              <div>
                <span className="mb-1.5 block text-xs font-medium text-foreground">
                  {t("root.tests.builder.section.kind")}
                </span>
                <p className="rounded-xl border border-border bg-muted px-3 py-2.5 text-sm text-muted-foreground">
                  {t(`root.tests.sectionKinds.${field.value}`, {
                    defaultValue: field.value,
                  })}
                </p>
              </div>
            )}
          />
        )}

        <NumberField
          control={control}
          name={`${name}.durationMinutes`}
          label={t("root.tests.builder.section.duration")}
          min={1}
          step={1}
          disabled={disabled}
        />

        <Field
          size="sm"
          htmlFor={`section-${sectionIndex}-instructions`}
          label={t("root.tests.builder.section.instructions")}
        >
          <Textarea
            {...control.register(`${name}.instructions`)}
            id={`section-${sectionIndex}-instructions`}
            rows={2}
            disabled={disabled}
            placeholder={t("root.tests.builder.section.instructionsPlaceholder")}
            className="py-2.5"
          />
        </Field>
      </div>

      {/*
        Bands run full-bleed to the card edge (`-mx-5`/`-mx-6` cancels the Surface's own padding),
        so the rule between two groups reads as a division of the section rather than as the top
        of yet another box.
      */}
      <div className="mt-6 -mx-5 sm:-mx-6">{groups}</div>

      <Button
        type="button"
        variant="outline"
        size="sm"
        className="mt-5"
        disabled={disabled || fields.length >= TEST_LIMITS.groupsPerSection}
        onClick={addGroup}
      >
        <Plus className="size-3.5" />
        {t("root.tests.builder.section.addGroup")}
      </Button>
    </Surface>
  );
}
