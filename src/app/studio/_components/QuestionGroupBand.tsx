"use client";

import { useCallback, useState } from "react";
import { ChevronDown, FileText, Plus, Trash2 } from "lucide-react";
import {
  Controller,
  useFieldArray,
  useWatch,
  type Control,
  type UseFormGetValues,
  type UseFormSetValue,
} from "react-hook-form";
import { useTranslation } from "react-i18next";

import type { TestBuilderForm } from "@/app/(root)/_lib/tests.actions.schemas";
import { TEST_LIMITS } from "@/app/(root)/_lib/tests.actions.schemas";
import {
  createQuestionDraft,
  duplicateQuestionDraft,
  paragraphLabels,
  specFor,
} from "@/app/(root)/_lib/test-form";
import { groupAnchorId } from "@/app/(root)/_constants/tests";
import Badge from "@/components/ui/badge";
import { Button } from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Textarea from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { BuilderCatalog, GroupFieldName, QuestionFieldName } from "../_types";
import AddQuestionDialog from "./AddQuestionDialog";
import QuestionRow from "./QuestionRow";
import SortableList, { SortableRow } from "./SortableList";
import TestImageField from "./TestImageField";

type QuestionGroupBandProps = {
  control: Control<TestBuilderForm>;
  setValue: UseFormSetValue<TestBuilderForm>;
  /** Reads live values for actions that copy a row, such as duplicate. */
  getValues: UseFormGetValues<TestBuilderForm>;
  name: GroupFieldName;
  groupIndex: number;
  groupCount: number;
  groupId: string;
  testId: string;
  catalog: BuilderCatalog;
  /** 1-based number of this group's first question, across the whole test. */
  startNumber: number;
  flaggedIds: ReadonlySet<string>;
  disabled?: boolean;
  onRemove: (index: number) => void;
  onStructureChange: () => void;
};

/**
 * A question group: the stimulus (a passage, an image, or neither) plus the
 * questions that depend on it.
 *
 * Rendered as a full-bleed band inside its section rather than as its own card
 * — the depth model allows exactly one border here, and it belongs to the
 * section (`docs/design/design-system.md` §4). The band cancels the surface
 * padding and separates itself with a hairline, so the rule reads as a division
 * of the section rather than the top of another box.
 *
 * The stimulus collapses when it is empty. A simple quiz has no passage, and
 * twenty questions each preceded by an empty 20 000-character textarea was the
 * old builder's worst scrolling problem.
 */
export default function QuestionGroupBand({
  control,
  setValue,
  getValues,
  name,
  groupIndex,
  groupCount,
  groupId,
  testId,
  catalog,
  startNumber,
  flaggedIds,
  disabled,
  onRemove,
  onStructureChange,
}: QuestionGroupBandProps) {
  const { t } = useTranslation();
  const [pickerOpen, setPickerOpen] = useState(false);

  const { fields, append, remove, move } = useFieldArray({
    control,
    name: `${name}.questions`,
  });

  // Narrow to this group's passage: the paragraph labels below and the
  // matching-headings editor both derive from it, and both must stay live.
  const passage = useWatch({ control, name: `${name}.passage` }) ?? "";
  const imageUrl = useWatch({ control, name: `${name}.imageUrl` }) ?? "";

  const [stimulusOpen, setStimulusOpen] = useState(
    () => Boolean(passage) || Boolean(imageUrl),
  );

  const paragraphs = paragraphLabels(passage);

  const addQuestion = useCallback(
    (type: string) => {
      const spec = specFor(catalog.questionTypes, type);
      if (!spec) return;
      append(createQuestionDraft(type, spec));
      onStructureChange();
    },
    [append, catalog.questionTypes, onStructureChange],
  );

  const duplicateQuestion = useCallback(
    (index: number) => {
      // Read the live value, not the `fields` snapshot: `useFieldArray` exposes
      // the values as of the last render, so a snapshot copy would carry the
      // prompt text from before the teacher's most recent keystrokes.
      const value = getValues(`${name}.questions.${index}`);
      if (!value) return;
      append(duplicateQuestionDraft(value));
      onStructureChange();
    },
    [append, getValues, name, onStructureChange],
  );

  const removeQuestion = useCallback(
    (index: number) => {
      remove(index);
      onStructureChange();
    },
    [remove, onStructureChange],
  );

  const handleReorder = useCallback(
    (from: number, to: number) => {
      move(from, to);
      onStructureChange();
    },
    [move, onStructureChange],
  );

  const hasStimulus = Boolean(passage) || Boolean(imageUrl);

  return (
    <section
      id={groupId ? groupAnchorId(groupId) : undefined}
      className="-mx-5 scroll-mt-24 border-t border-border px-5 pt-4 pb-2 first:border-t-0 first:pt-0 sm:-mx-6 sm:px-6"
    >
      <header className="flex flex-wrap items-center gap-2">
        <Input
          {...control.register(`${name}.title`)}
          disabled={disabled}
          placeholder={t("root.tests.builder.group.titlePlaceholder", {
            index: groupIndex + 1,
          })}
          aria-label={t("root.tests.builder.group.title")}
          className="h-8 max-w-64 flex-1 border-transparent bg-transparent px-2 py-1 text-sm font-semibold hover:border-border focus:border-border"
        />

        {fields.length > 0 ? (
          <Badge variant="neutral" size="sm">
            {t("root.tests.builder.group.range", {
              from: startNumber,
              to: startNumber + fields.length - 1,
            })}
          </Badge>
        ) : null}

        <div className="ml-auto flex items-center gap-1">
          <Button
            type="button"
            size="sm"
            variant="ghost"
            disabled={disabled}
            aria-expanded={stimulusOpen}
            onClick={() => setStimulusOpen((open) => !open)}
          >
            <FileText className="size-3.5" />
            {hasStimulus
              ? t("root.tests.builder.group.editStimulus")
              : t("root.tests.builder.group.addStimulus")}
            <ChevronDown
              aria-hidden="true"
              className={cn(
                "size-3 transition-transform duration-[var(--dur-2)]",
                stimulusOpen && "rotate-180",
              )}
            />
          </Button>

          {groupCount > 1 ? (
            <Button
              type="button"
              size="icon-sm"
              variant="ghost"
              disabled={disabled}
              aria-label={t("root.tests.builder.group.remove")}
              className="text-muted-foreground hover:text-destructive"
              onClick={() => onRemove(groupIndex)}
            >
              <Trash2 className="size-3.5" />
            </Button>
          ) : null}
        </div>
      </header>

      {stimulusOpen ? (
        <div className="mt-3 space-y-3 rounded-xl bg-muted/60 p-3">
          <Controller
            control={control}
            name={`${name}.passage`}
            render={({ field }) => (
              <div>
                <Textarea
                  {...field}
                  rows={6}
                  disabled={disabled}
                  placeholder={t("root.tests.builder.group.passagePlaceholder")}
                  aria-label={t("root.tests.builder.group.passage")}
                  // A comfortable reading measure — a 20 000-character passage
                  // set to the full panel width is unreadable while editing.
                  className="max-w-[68ch] py-2.5 leading-relaxed"
                />
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <span className="text-2xs text-muted-foreground tabular-nums">
                    {t("root.tests.builder.group.charCount", {
                      count: field.value?.length ?? 0,
                      max: TEST_LIMITS.passageChars,
                    })}
                  </span>

                  {/*
                    Blank-line-separated paragraphs get auto A/B/C labels, derived
                    on render and never stored, so editing the passage renumbers
                    instantly. Matching-headings questions reference them.
                  */}
                  {paragraphs.length > 1 ? (
                    <span className="flex flex-wrap items-center gap-1">
                      <span className="text-2xs text-muted-foreground">
                        {t("root.tests.builder.group.paragraphs")}
                      </span>
                      {paragraphs.map(({ label }) => (
                        <Badge key={label} variant="neutral" size="xs">
                          {label}
                        </Badge>
                      ))}
                    </span>
                  ) : null}
                </div>
              </div>
            )}
          />

          <Input
            {...control.register(`${name}.instructions`)}
            disabled={disabled}
            placeholder={t("root.tests.builder.group.instructionsPlaceholder")}
            aria-label={t("root.tests.builder.group.instructions")}
            className="py-2"
          />

          <Controller
            control={control}
            name={`${name}.imageUrl`}
            render={({ field }) => (
              <TestImageField
                testId={testId}
                value={field.value}
                onChange={field.onChange}
                label={t("root.tests.builder.group.image")}
                hint={t("root.tests.builder.image.hint")}
                disabled={disabled}
              />
            )}
          />
        </div>
      ) : null}

      <SortableList
        ids={fields.map((field) => field.id)}
        onReorder={handleReorder}
        disabled={disabled}
        className="mt-1 divide-y divide-border"
      >
        {fields.map((field, index) => {
          const type = field.type;
          const serverId = field.serverId;

          return (
            <SortableRow key={field.id} id={field.id} disabled={disabled}>
              {({ setNodeRef, style, handle, isDragging }) => (
                <div
                  ref={setNodeRef}
                  style={style}
                  className={cn(isDragging && "rounded-xl bg-card shadow-elev-3")}
                >
                  <QuestionRow
                    control={control}
                    setValue={setValue}
                    name={`${name}.questions.${index}` as QuestionFieldName}
                    index={index}
                    count={fields.length}
                    questionNumber={startNumber + index}
                    questionId={serverId}
                    type={type}
                    spec={specFor(catalog.questionTypes, type)}
                    testId={testId}
                    passage={passage}
                    disabled={disabled}
                    flagged={Boolean(serverId) && flaggedIds.has(serverId)}
                    dragHandle={handle}
                    onMove={handleReorder}
                    onRemove={removeQuestion}
                    onDuplicate={duplicateQuestion}
                  />
                </div>
              )}
            </SortableRow>
          );
        })}
      </SortableList>

      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="mt-2 w-full justify-center border border-dashed border-border text-muted-foreground hover:text-foreground"
        disabled={disabled || fields.length >= TEST_LIMITS.questionsPerGroup}
        onClick={() => setPickerOpen(true)}
      >
        <Plus className="size-3.5" />
        {t("root.tests.builder.group.addQuestion")}
      </Button>

      <AddQuestionDialog
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        catalog={catalog.questionTypes}
        blueprint={catalog.blueprint}
        onPick={addQuestion}
      />
    </section>
  );
}
