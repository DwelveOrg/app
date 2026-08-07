"use client";

import { useCallback, useMemo, useState } from "react";
import { AlertTriangle, ArrowDown, ArrowUp, FileText, Plus, Trash2 } from "lucide-react";
import {
  Controller,
  useFieldArray,
  useWatch,
  type Control,
  type UseFormSetValue,
} from "react-hook-form";
import { useTranslation } from "react-i18next";

import {
  TEST_LIMITS,
  type TestBuilderForm,
} from "@/app/(root)/_lib/tests.actions.schemas";
import type { QuestionTypeSpec } from "@/app/(root)/_lib/tests.schemas";
import Badge from "@/components/ui/badge";
import { Button } from "@/components/ui/Button";
import Field from "@/components/ui/Field";
import Input from "@/components/ui/Input";
import Textarea from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { BuilderCatalog, GroupFieldName, QuestionFieldName } from "../_types";
import { groupAnchorId } from "../_constants";
import { createQuestionDraft, paragraphLabels } from "../_lib/testForm";
import AddQuestionDialog from "./AddQuestionDialog";
import QuestionCard from "./QuestionCard";
import TestImageField from "./TestImageField";

type QuestionGroupCardProps = {
  control: Control<TestBuilderForm>;
  setValue: UseFormSetValue<TestBuilderForm>;
  name: GroupFieldName;
  sectionIndex: number;
  groupIndex: number;
  /** How many groups the section has, for the move buttons. */
  count: number;
  groupId: string;
  testId: string;
  catalog: BuilderCatalog;
  /** 1-based number of this group's first question, across the whole test. */
  startNumber: number;
  /** Ids called out by the publish validation. */
  flaggedIds: Set<string>;
  disabled?: boolean;
  onMove: (from: number, to: number) => void;
  onRemove: (index: number) => void;
  /** Tells the builder to re-derive question numbering. */
  onStructureChange: () => void;
};

/**
 * A question group: the passage or image that a run of questions refers to,
 * plus the questions themselves.
 *
 * The passage is a plain `<Textarea>` at a comfortable reading measure, not a
 * rich-text editor — IELTS passages are plain prose, and a WYSIWYG would be a
 * new dependency for formatting nobody uses. Blank-line-separated paragraphs
 * get A/B/C labels underneath so matching-headings questions can point at them.
 */
export default function QuestionGroupCard({
  control,
  setValue,
  name,
  sectionIndex,
  groupIndex,
  count,
  groupId,
  testId,
  catalog,
  startNumber,
  flaggedIds,
  disabled,
  onMove,
  onRemove,
  onStructureChange,
}: QuestionGroupCardProps) {
  const { t } = useTranslation();
  const [pickerOpen, setPickerOpen] = useState(false);

  const { fields, append, remove, move } = useFieldArray({
    control,
    name: `${name}.questions`,
  });

  // Narrow to this group's passage. The question children are memoised, so this
  // re-render stops at the group chrome and the paragraph labels.
  const passage = useWatch({ control, name: `${name}.passage` }) ?? "";
  const imageUrl = useWatch({ control, name: `${name}.imageUrl` }) ?? "";

  const paragraphs = useMemo(() => paragraphLabels(passage), [passage]);

  const { hidesStructure } = catalog.blueprint;

  /**
   * `type` never changes once a question exists, so the field-array snapshot is
   * a reliable source for this check even though its other values go stale.
   */
  const needsStimulus = fields.some(
    (field) => catalog.questionTypes[field.type]?.requiresGroupStimulus,
  );
  const missingStimulus = needsStimulus && !passage.trim() && !imageUrl;

  const handleMoveQuestion = useCallback(
    (from: number, to: number) => {
      move(from, to);
      onStructureChange();
    },
    [move, onStructureChange],
  );

  const handleRemoveQuestion = useCallback(
    (index: number) => {
      remove(index);
      onStructureChange();
    },
    [remove, onStructureChange],
  );

  const handlePick = (type: string, spec: QuestionTypeSpec) => {
    append(createQuestionDraft(type, spec));
    onStructureChange();
  };

  const atQuestionLimit = fields.length >= TEST_LIMITS.questionsPerGroup;

  const questionList = (
    <div className="space-y-4">
      {/*
        Questions are a divided list, not a stack of cards. Forty of them inside a section card
        would otherwise be forty bordered boxes inside a bordered box; a hairline between rows
        separates them at a fraction of the visual cost.
      */}
      {fields.length > 0 ? (
        <div className="divide-y divide-border border-y border-border">
          {fields.map((field, index) => (
            <QuestionCard
              key={field.id}
              control={control}
              setValue={setValue}
              name={`${name}.questions.${index}` as QuestionFieldName}
              index={index}
              count={fields.length}
              questionNumber={startNumber + index}
              questionId={field.serverId}
              type={field.type}
              spec={catalog.questionTypes[field.type] ?? null}
              testId={testId}
              disabled={disabled}
              flagged={Boolean(field.serverId) && flaggedIds.has(field.serverId)}
              onMove={handleMoveQuestion}
              onRemove={handleRemoveQuestion}
            />
          ))}
        </div>
      ) : (
        /* A slot waiting to be filled, per the `dashed` surface variant's meaning. */
        <p className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
          {t("root.tests.builder.group.noQuestions")}
        </p>
      )}

      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={disabled || atQuestionLimit}
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
        onPick={handlePick}
      />
    </div>
  );

  // A simple quiz has one implicit group. Passage, title, and reorder controls
  // would all be chrome around a thing the teacher never chose to create.
  if (hidesStructure) {
    return questionList;
  }

  return (
    /*
     * A band inside the section card, not a second card: the rule above it and its own header
     * carry the division, so the builder stays one card deep however many groups a section holds.
     * Only the "needs a passage or image" state draws an edge — and it draws it as a tinted band
     * rather than a ring, so the one thing on screen that is boxed is the one thing that is wrong.
     */
    <section
      id={groupId ? groupAnchorId(groupId) : undefined}
      className={cn(
        // Every band keeps its top rule, including the first: that one divides the section's own
        // settings from its content, which is a division worth drawing.
        "scroll-mt-24 border-t border-border px-5 py-5 sm:px-6",
        missingStimulus
          ? "bg-[color-mix(in_srgb,var(--warning)_6%,transparent)]"
          : undefined,
      )}
    >
      <header className="flex flex-wrap items-center gap-2">
        <span
          aria-hidden="true"
          className="grid size-8 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground"
        >
          <FileText className="size-4" />
        </span>

        <Input
          {...control.register(`${name}.title`)}
          disabled={disabled}
          placeholder={t("root.tests.builder.group.titlePlaceholder")}
          aria-label={t("root.tests.builder.group.title")}
          className="max-w-xs py-2 font-semibold"
        />

        {fields.length > 0 ? (
          <Badge variant="neutral" size="sm" className="tabular-nums">
            {t("root.tests.builder.group.questionRange", {
              from: startNumber,
              to: startNumber + fields.length - 1,
            })}
          </Badge>
        ) : null}

        <div className="ml-auto flex items-center gap-1">
          <Button
            type="button"
            size="icon-sm"
            variant="ghost"
            disabled={disabled || groupIndex === 0}
            aria-label={t("root.tests.builder.group.moveUp")}
            onClick={() => onMove(groupIndex, groupIndex - 1)}
          >
            <ArrowUp className="size-3.5" />
          </Button>
          <Button
            type="button"
            size="icon-sm"
            variant="ghost"
            disabled={disabled || groupIndex >= count - 1}
            aria-label={t("root.tests.builder.group.moveDown")}
            onClick={() => onMove(groupIndex, groupIndex + 1)}
          >
            <ArrowDown className="size-3.5" />
          </Button>
          <Button
            type="button"
            size="icon-sm"
            variant="ghost"
            disabled={disabled || count <= 1}
            aria-label={t("root.tests.builder.group.remove")}
            className="text-muted-foreground hover:text-destructive"
            onClick={() => onRemove(groupIndex)}
          >
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      </header>

      <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <Field
          size="sm"
          htmlFor={`${sectionIndex}-${groupIndex}-passage`}
          label={t("root.tests.builder.group.passage")}
        >
          <Textarea
            {...control.register(`${name}.passage`)}
            id={`${sectionIndex}-${groupIndex}-passage`}
            rows={8}
            disabled={disabled}
            placeholder={t("root.tests.builder.group.passagePlaceholder")}
            className="max-w-[68ch] py-2.5 leading-relaxed"
          />
          <p
            className={cn(
              "mt-1 text-2xs",
              passage.length > TEST_LIMITS.passageChars
                ? "text-destructive"
                : "text-muted-foreground",
            )}
          >
            {t("root.tests.builder.group.charCount", {
              used: passage.length,
              max: TEST_LIMITS.passageChars,
            })}
          </p>

          {/* An inset, not a box: a fill without a border, per the depth model. */}
          {paragraphs.length > 1 ? (
            <div className="mt-2 rounded-xl bg-muted px-3 py-2">
              <p className="text-2xs font-medium text-foreground">
                {t("root.tests.builder.group.paragraphLabels")}
              </p>
              <ul className="mt-1 space-y-0.5">
                {paragraphs.map((paragraph) => (
                  <li
                    key={paragraph.label}
                    className="flex gap-2 text-2xs text-muted-foreground"
                  >
                    <span className="font-semibold text-foreground">
                      {paragraph.label}
                    </span>
                    <span className="truncate">{paragraph.text}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </Field>

        <div className="space-y-3">
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

          <Field
            size="sm"
            htmlFor={`${sectionIndex}-${groupIndex}-instructions`}
            label={t("root.tests.builder.group.instructions")}
          >
            <Textarea
              {...control.register(`${name}.instructions`)}
              id={`${sectionIndex}-${groupIndex}-instructions`}
              rows={3}
              disabled={disabled}
              placeholder={t("root.tests.builder.group.instructionsPlaceholder")}
              className="py-2.5"
            />
          </Field>

          {missingStimulus ? (
            <p className="inline-flex items-start gap-1.5 text-2xs text-warning">
              <AlertTriangle className="mt-px size-3.5 shrink-0" aria-hidden="true" />
              {t("root.tests.builder.group.stimulusRequired")}
            </p>
          ) : null}
        </div>
      </div>

      <div className="mt-5">{questionList}</div>
    </section>
  );
}
