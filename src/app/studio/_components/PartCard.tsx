"use client";

import { useCallback, useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  BookOpenText,
  Layers,
  Plus,
  Trash2,
} from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  Controller,
  useFieldArray,
  type Control,
  type UseFormGetValues,
  type UseFormRegister,
  type UseFormSetValue,
} from "react-hook-form";
import { useTranslation } from "react-i18next";

import type {
  GroupForm,
  TestBuilderForm,
} from "@/app/(root)/_lib/tests.actions.schemas";
import { TEST_LIMITS } from "@/app/(root)/_lib/tests.actions.schemas";
import { createQuestionDraft, specFor } from "@/app/(root)/_lib/test-form";
import { SECTION_KINDS, sectionAnchorId } from "@/app/(root)/_constants/tests";
import { humanizeToken } from "@/app/(root)/_lib/test-labels";
import Badge from "@/components/ui/badge";
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
import { DUR, EASE_OUT } from "@/lib/motion";
import { cn } from "@/lib/utils";
import type {
  BuilderCatalog,
  GroupFieldName,
  QuestionFieldName,
  SectionFieldName,
} from "../_types";
import {
  appendMaterial,
  appendQuestion,
  duplicateQuestion,
  insertMaterialBefore,
  insertQuestionAfter,
  moveQuestion,
  nudgeQuestion,
  removeMaterial,
  removeQuestion,
  toBlocks,
  totalQuestions,
} from "../_lib/sectionBlocks";
import AddQuestionDialog from "./AddQuestionDialog";
import MaterialCard from "./MaterialCard";
import QuestionRow from "./QuestionRow";
import SortableList, { SortableRow } from "@/components/ui/SortableList";

type PartCardProps = {
  control: Control<TestBuilderForm>;
  setValue: UseFormSetValue<TestBuilderForm>;
  getValues: UseFormGetValues<TestBuilderForm>;
  register: UseFormRegister<TestBuilderForm>;
  name: SectionFieldName;
  sectionIndex: number;
  sectionCount: number;
  sectionId: string;
  testId: string;
  catalog: BuilderCatalog;
  flaggedIds: ReadonlySet<string>;
  disabled?: boolean;
  /** 1-based number of this part's first question, across the whole test. */
  startNumber: number;
  /**
   * Whether the part shows any chrome at all. A single-part quiz has nothing to
   * name, order, or navigate between, so it renders as a bare list of questions.
   */
  showHeader: boolean;
  onMove: (from: number, to: number) => void;
  onRemove: (index: number) => void;
  onStructureChange: () => void;
};

/**
 * A part of a test: a title, and a flat numbered list of questions.
 *
 * ## The hierarchy the teacher sees, and the one on the wire
 *
 * The backend stores section → question group → question. The teacher sees
 * **part → question**, with shared material attached to a run of questions
 * rather than containing them. Groups still exist in the payload — they are how
 * one passage is bound to twelve questions — but nothing here asks anyone to
 * create, name, or file anything into one. `_lib/sectionBlocks.ts` is the whole
 * translation, and every structural edit goes through it: live values in, a new
 * `groups` array out, applied with one `replace()`.
 *
 * That single-write rule is what makes a cross-boundary move possible at all.
 * Dragging question 19 above the passage it belongs to has to remove it from
 * one group and insert it into another, and a `move()` on either group's own
 * field array can only express half of that.
 *
 * ## Depth
 *
 * Still one card (`docs/design/design-system.md` §4). The part is the `Surface`;
 * shared material is a muted panel inside it; a question is a flat row in a
 * divided list, and the only edge a question ever draws is the ring a publish
 * check puts on it. What is new is the **rail**: questions covered by a material
 * carry a left border running up to its card, so "these belong to that passage"
 * is visible without a box around them and without the word "group".
 */
export default function PartCard({
  control,
  setValue,
  getValues,
  register,
  name,
  sectionIndex,
  sectionCount,
  sectionId,
  testId,
  catalog,
  flaggedIds,
  disabled,
  startNumber,
  showHeader,
  onMove,
  onRemove,
  onStructureChange,
}: PartCardProps) {
  const { t } = useTranslation();
  const reduced = useReducedMotion();
  const [picker, setPicker] = useState<{ afterUid: string | null } | null>(null);

  const { fields: groups, replace } = useFieldArray({
    control,
    name: `${name}.groups`,
  });

  /**
   * Every structural edit, in one place.
   *
   * Reads the **live** values rather than the `fields` snapshot: the snapshot is
   * as of the last field-array render, so duplicating a question from it would
   * copy the prompt as it stood before the teacher's most recent keystrokes.
   */
  const mutate = useCallback(
    (operation: (current: GroupForm[]) => GroupForm[]) => {
      const current = getValues(`${name}.groups`) ?? [];
      replace(operation(current));
      onStructureChange();
    },
    [getValues, name, replace, onStructureChange],
  );

  const blocks = useMemo(
    () => toBlocks(groups as GroupForm[], startNumber),
    [groups, startNumber],
  );

  /** The drag ids, in reading order — questions only; material does not move. */
  const dragIds = useMemo(
    () =>
      blocks.filter((block) => block.kind === "question").map((block) => block.key),
    [blocks],
  );

  const questionCount = totalQuestions(groups as GroupForm[]);
  const atQuestionLimit = questionCount >= TEST_LIMITS.questionsPerGroup;

  const addQuestion = useCallback(
    (type: string, afterUid: string | null) => {
      const spec = specFor(catalog.questionTypes, type);
      if (!spec) return;
      const draft = createQuestionDraft(type, spec);

      /*
       * A preset that needs a passage gets one. The catalogue marks these
       * (`requiresGroupStimulus`) and the picker already badges them "Needs a
       * passage"; without this the badge is a warning the builder then ignores,
       * and the test fails to publish with `GROUP_STIMULUS_REQUIRED` pointing at
       * a question the teacher had no way to know was misplaced.
       */
      // The preset's own flag, never the format's. `validateTestForPublish`
      // reads exactly this one, and the format-level flag is broader: an IELTS
      // writing task sets `requiresGroupStimulus: false` and must not be handed
      // a passage it has no use for.
      const needsMaterial = spec.requiresGroupStimulus;

      mutate((current) =>
        afterUid
          ? insertQuestionAfter(current, afterUid, draft, needsMaterial)
          : appendQuestion(current, draft, needsMaterial),
      );
    },
    [catalog.questionTypes, mutate],
  );

  const handleDrop = useCallback(
    (activeId: string, overId: string) => {
      // The drop target's position decides both the order *and* which material
      // the question now sits under — the two are the same fact in a flat list.
      const from = dragIds.indexOf(activeId);
      const to = dragIds.indexOf(overId);
      if (from === -1 || to === -1) return;

      mutate((current) =>
        moveQuestion(current, activeId, overId, to > from ? "after" : "before"),
      );
    },
    [dragIds, mutate],
  );

  return (
    <Surface
      id={sectionId ? sectionAnchorId(sectionId) : undefined}
      as="section"
      padding="lg"
      className="scroll-mt-24"
    >
      {showHeader ? (
        <header className="flex flex-wrap items-center gap-2 border-b border-border pb-4">
          <span
            aria-hidden="true"
            className="grid size-8 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground"
          >
            <Layers className="size-4" />
          </span>

          <Input
            {...register(`${name}.title`)}
            disabled={disabled}
            placeholder={t("root.tests.builder.part.titlePlaceholder")}
            aria-label={t("root.tests.builder.part.title")}
            className="h-9 min-w-40 flex-1 border-transparent bg-transparent px-2 type-heading hover:border-border focus:border-border"
          />

          {questionCount > 0 ? (
            <Badge variant="neutral" size="sm">
              {t("root.tests.builder.part.range", {
                from: startNumber,
                to: startNumber + questionCount - 1,
              })}
            </Badge>
          ) : null}

          <div className="flex items-center gap-2">
            {/*
              Part kind drives the student-facing grouping (Reading, Writing,
              Math) and is what a per-part timer keys off, so it stays a visible
              control rather than something only the format preset sets.

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
                    aria-label={t("root.tests.builder.part.kind")}
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
                  aria-label={t("root.tests.builder.part.moveUp")}
                  onClick={() => onMove(sectionIndex, sectionIndex - 1)}
                >
                  <ArrowUp className="size-3.5" />
                </Button>
                <Button
                  type="button"
                  size="icon-sm"
                  variant="ghost"
                  disabled={disabled || sectionIndex >= sectionCount - 1}
                  aria-label={t("root.tests.builder.part.moveDown")}
                  onClick={() => onMove(sectionIndex, sectionIndex + 1)}
                >
                  <ArrowDown className="size-3.5" />
                </Button>
                <Button
                  type="button"
                  size="icon-sm"
                  variant="ghost"
                  disabled={disabled}
                  aria-label={t("root.tests.builder.part.remove")}
                  className="text-muted-foreground hover:text-destructive"
                  onClick={() => onRemove(sectionIndex)}
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </>
            ) : null}
          </div>
        </header>
      ) : null}

      {showHeader ? (
        <Input
          {...register(`${name}.instructions`)}
          disabled={disabled}
          placeholder={t("root.tests.builder.part.instructionsPlaceholder")}
          aria-label={t("root.tests.builder.part.instructions")}
          className="mt-4 py-2"
        />
      ) : null}

      <SortableList
        ids={dragIds}
        onDropOn={handleDrop}
        disabled={disabled}
        className={cn(showHeader && "mt-4")}
      >
        {/*
          `initial={false}` so opening a saved forty-question paper does not
          play forty entrances. A row added *now* still animates in, which is
          the only case where the motion carries information: it says where the
          thing you just asked for went.
        */}
        <AnimatePresence initial={false}>
        {blocks.map((block, blockIndex) => {
          if (block.kind === "material") {
            const groupId = groups[block.groupIndex]?.serverId ?? "";

            return (
              <BlockShell key={block.key} reduced={reduced} className="pt-3 first:pt-0">
                <MaterialCard
                  control={control}
                  register={register}
                  name={`${name}.groups.${block.groupIndex}` as GroupFieldName}
                  groupIndex={block.groupIndex}
                  groupId={groupId}
                  testId={testId}
                  startNumber={block.startNumber}
                  questionCount={block.questionCount}
                  flagged={Boolean(groupId) && flaggedIds.has(groupId)}
                  disabled={disabled}
                  onRemove={(groupIndex) =>
                    mutate((current) => removeMaterial(current, groupIndex))
                  }
                />
              </BlockShell>
            );
          }

          const group = groups[block.groupIndex];
          const question = group?.questions?.[block.questionIndex];
          if (!question) return null;

          // The card above already separates; between two questions a hairline
          // does, and nothing separates the first row from the part header.
          const showDivider =
            blockIndex > 0 && blocks[blockIndex - 1]?.kind === "question";

          return (
            <BlockShell key={block.key} reduced={reduced}>
            <SortableRow id={block.key} disabled={disabled}>
              {({ setNodeRef, style, handle, isDragging }) => (
                <div
                  ref={setNodeRef}
                  style={style}
                  className={cn(
                    // The rail: a question covered by shared material carries a
                    // left edge running back up to it. This is what replaced the
                    // group box — it says "these belong to that passage" without
                    // nesting a second card inside the part.
                    block.underMaterial && "ml-3 border-l-2 border-border pl-3",
                    showDivider && "border-t border-border",
                    isDragging && "rounded-xl bg-card shadow-elev-3",
                  )}
                >
                  <QuestionRow
                    control={control}
                    setValue={setValue}
                    register={register}
                    name={
                      `${name}.groups.${block.groupIndex}.questions.${block.questionIndex}` as QuestionFieldName
                    }
                    questionNumber={block.questionNumber}
                    questionId={question.serverId}
                    type={question.type}
                    spec={specFor(catalog.questionTypes, question.type)}
                    testId={testId}
                    groupName={
                      `${name}.groups.${block.groupIndex}` as GroupFieldName
                    }
                    disabled={disabled}
                    isFirst={blockIndex === 0 || dragIds[0] === block.key}
                    isLast={dragIds[dragIds.length - 1] === block.key}
                    canAddMaterial={!(block.underMaterial && block.questionIndex === 0)}
                    flagged={
                      Boolean(question.serverId) && flaggedIds.has(question.serverId)
                    }
                    dragHandle={handle}
                    onNudge={(direction) =>
                      mutate((current) => nudgeQuestion(current, block.key, direction))
                    }
                    onRemove={() =>
                      mutate((current) => removeQuestion(current, block.key))
                    }
                    onDuplicate={() =>
                      mutate((current) => duplicateQuestion(current, block.key))
                    }
                    onInsertAfter={() => setPicker({ afterUid: block.key })}
                    onAddMaterialAbove={() =>
                      mutate((current) => insertMaterialBefore(current, block.key))
                    }
                  />
                </div>
              )}
            </SortableRow>
            </BlockShell>
          );
        })}
        </AnimatePresence>
      </SortableList>

      {/*
        Two controls, and the second one is the entire replacement for the old
        "Add group". Adding a question is the common act and gets the emphasis;
        attaching material is the rarer one and reads as what it does rather
        than as a container to be filled.
      */}
      {disabled ? null : (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="flex-1 justify-center border-dashed"
            disabled={atQuestionLimit}
            onClick={() => setPicker({ afterUid: null })}
          >
            <Plus className="size-3.5" />
            {t("root.tests.builder.part.addQuestion")}
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-muted-foreground"
            disabled={groups.length >= TEST_LIMITS.groupsPerSection}
            onClick={() => mutate(appendMaterial)}
          >
            <BookOpenText className="size-3.5" />
            {t("root.tests.builder.part.addMaterial")}
          </Button>
        </div>
      )}

      <AddQuestionDialog
        open={picker !== null}
        onOpenChange={(open) => setPicker(open ? picker : null)}
        catalog={catalog.questionTypes}
        blueprint={catalog.blueprint}
        onPick={(type) => addQuestion(type, picker?.afterUid ?? null)}
      />
    </Surface>
  );
}

/**
 * The enter/exit wrapper around one row of the part.
 *
 * Deliberately conservative about *what* it animates. Entry is opacity plus a
 * few pixels of travel and no height, because a height animation needs
 * `overflow: hidden`, and a question row is full of focus rings and a points
 * field that would be clipped by it for a quarter of a second every time. Exit
 * does collapse the height, because that is the half that carries the meaning:
 * the list visibly heals where the deleted question was, so the teacher can see
 * that the right one went.
 *
 * No `layout` prop. dnd-kit already owns `transform` on the row while a drag is
 * in flight, and two libraries writing the same property is a row that jumps
 * back to where it started when you drop it.
 */
function BlockShell({
  reduced,
  className,
  children,
}: {
  reduced: boolean | null;
  className?: string;
  children: React.ReactNode;
}) {
  if (reduced) return <div className={className}>{children}</div>;

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0, overflow: "hidden" }}
      transition={{ duration: DUR.reveal, ease: EASE_OUT }}
    >
      {children}
    </motion.div>
  );
}
