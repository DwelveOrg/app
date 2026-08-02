"use client";

import { useCallback, useMemo, useState } from "react";
import { AlertTriangle, ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
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
import { Button } from "@/components/ui/Button";
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
    <div className="space-y-3">
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

      {fields.length === 0 ? (
        <p className="rounded-xl border border-dashed border-[var(--border)] px-4 py-6 text-center text-sm text-[var(--muted-foreground)]">
          {t("root.tests.builder.group.noQuestions")}
        </p>
      ) : null}

      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={disabled || atQuestionLimit}
        onClick={() => setPickerOpen(true)}
      >
        <Plus className="h-3.5 w-3.5" />
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
    <section
      id={groupId ? groupAnchorId(groupId) : undefined}
      className={cn(
        "scroll-mt-24 rounded-2xl border bg-[var(--background)] p-4",
        missingStimulus
          ? "border-[color-mix(in_srgb,var(--warning)_45%,transparent)]"
          : "border-[var(--border)]",
      )}
    >
      <header className="flex flex-wrap items-center gap-2">
        <Input
          {...control.register(`${name}.title`)}
          disabled={disabled}
          placeholder={t("root.tests.builder.group.titlePlaceholder")}
          aria-label={t("root.tests.builder.group.title")}
          className="max-w-xs py-2 font-semibold"
        />
        <span className="text-[11px] text-[var(--muted-foreground)]">
          {t("root.tests.builder.group.questionRange", {
            from: startNumber,
            to: startNumber + Math.max(fields.length, 1) - 1,
          })}
        </span>

        <div className="ml-auto flex items-center gap-1">
          <Button
            type="button"
            size="icon-sm"
            variant="ghost"
            disabled={disabled || groupIndex === 0}
            aria-label={t("root.tests.builder.group.moveUp")}
            onClick={() => onMove(groupIndex, groupIndex - 1)}
          >
            <ArrowUp className="h-3.5 w-3.5" />
          </Button>
          <Button
            type="button"
            size="icon-sm"
            variant="ghost"
            disabled={disabled || groupIndex >= count - 1}
            aria-label={t("root.tests.builder.group.moveDown")}
            onClick={() => onMove(groupIndex, groupIndex + 1)}
          >
            <ArrowDown className="h-3.5 w-3.5" />
          </Button>
          <Button
            type="button"
            size="icon-sm"
            variant="ghost"
            disabled={disabled || count <= 1}
            aria-label={t("root.tests.builder.group.remove")}
            className="text-[var(--muted-foreground)] hover:text-[var(--destructive)]"
            onClick={() => onRemove(groupIndex)}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </header>

      <div className="mt-3 grid gap-4 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div>
          <label
            htmlFor={`${sectionIndex}-${groupIndex}-passage`}
            className="mb-1.5 block text-xs font-medium text-[var(--foreground)]"
          >
            {t("root.tests.builder.group.passage")}
          </label>
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
              "mt-1 text-[11px]",
              passage.length > TEST_LIMITS.passageChars
                ? "text-[var(--destructive)]"
                : "text-[var(--muted-foreground)]",
            )}
          >
            {t("root.tests.builder.group.charCount", {
              used: passage.length,
              max: TEST_LIMITS.passageChars,
            })}
          </p>

          {paragraphs.length > 1 ? (
            <div className="mt-2 rounded-xl border border-[var(--border)] bg-[var(--muted)] px-3 py-2">
              <p className="text-[11px] font-medium text-[var(--foreground)]">
                {t("root.tests.builder.group.paragraphLabels")}
              </p>
              <ul className="mt-1 space-y-0.5">
                {paragraphs.map((paragraph) => (
                  <li
                    key={paragraph.label}
                    className="flex gap-2 text-[11px] text-[var(--muted-foreground)]"
                  >
                    <span className="font-semibold text-[var(--foreground)]">
                      {paragraph.label}
                    </span>
                    <span className="truncate">{paragraph.text}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>

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

          <div>
            <label
              htmlFor={`${sectionIndex}-${groupIndex}-instructions`}
              className="mb-1.5 block text-xs font-medium text-[var(--foreground)]"
            >
              {t("root.tests.builder.group.instructions")}
            </label>
            <Textarea
              {...control.register(`${name}.instructions`)}
              id={`${sectionIndex}-${groupIndex}-instructions`}
              rows={3}
              disabled={disabled}
              placeholder={t("root.tests.builder.group.instructionsPlaceholder")}
              className="py-2.5"
            />
          </div>

          {missingStimulus ? (
            <p className="inline-flex items-start gap-1.5 text-[11px] text-[var(--warning)]">
              <AlertTriangle className="mt-px h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              {t("root.tests.builder.group.stimulusRequired")}
            </p>
          ) : null}
        </div>
      </div>

      <div className="mt-4 border-t border-[var(--border)] pt-4">{questionList}</div>
    </section>
  );
}
