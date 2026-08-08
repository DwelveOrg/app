"use client";

import { useCallback } from "react";
import { ArrowDown, ArrowUp, Layers, Plus, Trash2 } from "lucide-react";
import {
  Controller,
  useFieldArray,
  type Control,
  type UseFormGetValues,
  type UseFormSetValue,
} from "react-hook-form";
import { useTranslation } from "react-i18next";

import type { TestBuilderForm } from "@/app/(root)/_lib/tests.actions.schemas";
import { TEST_LIMITS } from "@/app/(root)/_lib/tests.actions.schemas";
import { createGroupDraft } from "@/app/(root)/_lib/test-form";
import { SECTION_KINDS, sectionAnchorId } from "@/app/(root)/_constants/tests";
import { humanizeToken } from "@/app/(root)/_lib/test-labels";
import { Button } from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Surface from "@/components/ui/Surface";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { BuilderCatalog, GroupFieldName, SectionFieldName } from "../_types";
import QuestionGroupBand from "./QuestionGroupBand";

type SectionCardProps = {
  control: Control<TestBuilderForm>;
  setValue: UseFormSetValue<TestBuilderForm>;
  getValues: UseFormGetValues<TestBuilderForm>;
  name: SectionFieldName;
  sectionIndex: number;
  sectionCount: number;
  sectionId: string;
  testId: string;
  catalog: BuilderCatalog;
  flaggedIds: ReadonlySet<string>;
  disabled?: boolean;
  /** The 1-based number of a group's first question, across the whole test. */
  startNumberFor: (groupIndex: number) => number;
  onMove: (from: number, to: number) => void;
  onRemove: (index: number) => void;
  onStructureChange: () => void;
};

/**
 * A section — the only card in the builder tree.
 *
 * Section → group → question is the deepest hierarchy in the product, and the
 * design system rules out nesting cards outright. The resolution is documented
 * as the worked example in `docs/design/design-system.md` §4: the section is the
 * one `Surface`, a group is a full-bleed band inside it separated by a hairline,
 * and a question is a flat row in a divided list. Only a question a publish
 * check flagged draws an edge — that ring is what makes the problem findable,
 * and it only works while nothing else is boxed.
 */
export default function SectionCard({
  control,
  setValue,
  getValues,
  name,
  sectionIndex,
  sectionCount,
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

  const { fields, append, remove } = useFieldArray({
    control,
    name: `${name}.groups`,
  });

  const removeGroup = useCallback(
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

  return (
    <Surface
      id={sectionId ? sectionAnchorId(sectionId) : undefined}
      as="section"
      padding="lg"
      className="scroll-mt-24"
    >
      <header className="flex flex-wrap items-center gap-2 border-b border-border pb-4">
        <span
          aria-hidden="true"
          className="grid size-8 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground"
        >
          <Layers className="size-4" />
        </span>

        <Input
          {...control.register(`${name}.title`)}
          disabled={disabled}
          placeholder={t("root.tests.builder.section.titlePlaceholder")}
          aria-label={t("root.tests.builder.section.title")}
          className="h-9 min-w-40 flex-1 border-transparent bg-transparent px-2 type-heading hover:border-border focus:border-border"
        />

        <div className="flex items-center gap-2">
          {/*
            Section kind drives the student-facing grouping (Reading, Writing,
            Math) and is what a future per-section timer keys off, so it stays a
            visible control rather than something only the format preset sets.

            Through `Controller`, not `getValues` + `setValue`: the latter does
            not re-render, so picking a kind left the trigger showing the
            previous one until something else happened to repaint.
          */}
          <Controller
            control={control}
            name={`${name}.kind`}
            render={({ field }) => (
              <Select
                value={field.value || SECTION_KINDS[0]}
                onValueChange={field.onChange}
                disabled={disabled}
              >
                <SelectTrigger
                  className="w-36"
                  aria-label={t("root.tests.builder.section.kind")}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SECTION_KINDS.map((kind) => (
                    <SelectItem key={kind} value={kind}>
                      {t(`root.tests.sectionKinds.${kind}`, {
                        defaultValue: humanizeToken(kind),
                      })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />

          {sectionCount > 1 ? (
            <>
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
                disabled={disabled || sectionIndex >= sectionCount - 1}
                aria-label={t("root.tests.builder.section.moveDown")}
                onClick={() => onMove(sectionIndex, sectionIndex + 1)}
              >
                <ArrowDown className="size-3.5" />
              </Button>
              <Button
                type="button"
                size="icon-sm"
                variant="ghost"
                disabled={disabled}
                aria-label={t("root.tests.builder.section.remove")}
                className="text-muted-foreground hover:text-destructive"
                onClick={() => onRemove(sectionIndex)}
              >
                <Trash2 className="size-3.5" />
              </Button>
            </>
          ) : null}
        </div>
      </header>

      <Input
        {...control.register(`${name}.instructions`)}
        disabled={disabled}
        placeholder={t("root.tests.builder.section.instructionsPlaceholder")}
        aria-label={t("root.tests.builder.section.instructions")}
        className="mt-4 py-2"
      />

      <div className="mt-4">
        {fields.map((field, groupIndex) => (
          <QuestionGroupBand
            key={field.id}
            control={control}
            setValue={setValue}
            getValues={getValues}
            name={`${name}.groups.${groupIndex}` as GroupFieldName}
            groupIndex={groupIndex}
            groupCount={fields.length}
            groupId={field.serverId}
            testId={testId}
            catalog={catalog}
            startNumber={startNumberFor(groupIndex)}
            flaggedIds={flaggedIds}
            disabled={disabled}
            onRemove={removeGroup}
            onStructureChange={onStructureChange}
          />
        ))}
      </div>

      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="mt-3 text-muted-foreground"
        disabled={disabled || fields.length >= TEST_LIMITS.groupsPerSection}
        onClick={addGroup}
      >
        <Plus className="size-3.5" />
        {t("root.tests.builder.section.addGroup")}
      </Button>
    </Surface>
  );
}
