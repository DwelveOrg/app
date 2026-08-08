"use client";

import React from "react";
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  Copy,
  PenLine,
  Trash2,
  Zap,
} from "lucide-react";
import { Controller, type Control, type UseFormSetValue } from "react-hook-form";
import { useTranslation } from "react-i18next";

import type { QuestionTypeSpec } from "@/app/(root)/_lib/tests.schemas";
import type { TestBuilderForm } from "@/app/(root)/_lib/tests.actions.schemas";
import { questionAnchorId } from "@/app/(root)/_constants/tests";
import { humanizeToken, translateKey } from "@/app/(root)/_lib/test-labels";
import Badge from "@/components/ui/badge";
import { Button } from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Textarea from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { QuestionFieldName } from "../_types";
import {
  ACCENT_CLASSES,
  GAP_MARKER,
  presentationFor,
} from "../_lib/questionPresentation";
import QuestionAnswerEditor from "./editors";
import TestImageField from "./TestImageField";

type QuestionRowProps = {
  control: Control<TestBuilderForm>;
  setValue: UseFormSetValue<TestBuilderForm>;
  name: QuestionFieldName;
  /** Position inside its group, for the move/remove callbacks. */
  index: number;
  count: number;
  /** 1-based number across the whole test, as the student will see it. */
  questionNumber: number;
  /** Backend id, or `""` for a question that has never been saved. */
  questionId: string;
  type: string;
  /** Catalogue entry, or `null` if the backend no longer serves this preset. */
  spec: QuestionTypeSpec | null;
  testId: string;
  /** The group's passage, for editors that derive content from it. */
  passage?: string;
  disabled?: boolean;
  /** Highlighted because a publish check points at it. */
  flagged?: boolean;
  dragHandle?: React.ReactNode;
  onMove: (from: number, to: number) => void;
  onRemove: (index: number) => void;
  onDuplicate: (index: number) => void;
};

/**
 * One question, rendered the way its type wants to be rendered.
 *
 * This is where "every question has a different outlook" is actually decided.
 * The old builder gave all twenty-six presets the same three fields and then
 * swapped the answer-key editor at the bottom, which meant a True/False
 * statement, an SAT stem, and an essay brief were visually identical down to
 * the placeholder. Here the presentation registry drives the prompt's wording,
 * its height, the accent on the number chip, the icon, and whether the image is
 * the subject of the question or an attachment to it.
 *
 * Memoised, and given only `control`, a composed `name`, and stable callbacks,
 * so typing in one question never re-renders its thirty-nine siblings.
 */
function QuestionRow({
  control,
  setValue,
  name,
  index,
  count,
  questionNumber,
  questionId,
  type,
  spec,
  testId,
  passage,
  disabled,
  flagged,
  dragHandle,
  onMove,
  onRemove,
  onDuplicate,
}: QuestionRowProps) {
  const { t } = useTranslation();

  const typeLabel = translateKey(t, spec?.labelKey, humanizeToken(type));
  const presentation = spec ? presentationFor(type, spec) : null;
  const accent = presentation ? ACCENT_CLASSES[presentation.accent] : null;
  const Icon = presentation?.icon;

  const promptPlaceholder = presentation
    ? t(`root.tests.builder.prompts.${presentation.prompt}.placeholder`)
    : t("root.tests.builder.prompts.question.placeholder");

  const promptLabel = presentation
    ? t(`root.tests.builder.prompts.${presentation.prompt}.label`)
    : t("root.tests.builder.question.prompt");

  const imageField = (
    <Controller
      control={control}
      name={`${name}.imageUrl`}
      render={({ field }) => (
        <TestImageField
          testId={testId}
          value={field.value}
          onChange={field.onChange}
          label={
            presentation?.imageFirst
              ? t("root.tests.builder.question.diagram")
              : t("root.tests.builder.question.image")
          }
          hint={t("root.tests.builder.image.hint")}
          disabled={disabled}
        />
      )}
    />
  );

  return (
    <article
      id={questionId ? questionAnchorId(questionId) : undefined}
      tabIndex={-1}
      className={cn(
        // Level 3 of the depth model: a flat row in a divided list, never a
        // third card. The only edge is the invalid state, which is what makes a
        // flagged question findable (`docs/design/design-system.md` §4).
        "group/question relative scroll-mt-24 py-4 pl-3 outline-none",
        flagged &&
          "-mx-3 rounded-xl bg-[color-mix(in_srgb,var(--destructive)_5%,transparent)] px-3 ring-2 ring-destructive/45",
      )}
    >
      {/*
        The accent rule is the quiet signal that two adjacent questions are
        different kinds of question. It reads as texture when scanning and as
        information when you stop — which is exactly the weight it should carry.
      */}
      {accent ? (
        <span
          aria-hidden="true"
          className={cn(
            "absolute top-5 bottom-5 left-0 w-0.5 rounded-full opacity-45",
            accent.rule,
          )}
        />
      ) : null}

      <header className="flex flex-wrap items-center gap-2">
        {dragHandle}

        <span
          aria-hidden="true"
          className={cn(
            "inline-flex h-6 items-center gap-1 rounded-full px-2 text-2xs font-semibold tabular-nums",
            accent?.chip ?? "bg-muted text-muted-foreground",
          )}
        >
          {Icon ? <Icon className="size-3" /> : null}
          {questionNumber}
        </span>
        <span className="sr-only">
          {t("root.tests.builder.question.numberLabel", { number: questionNumber })}
        </span>

        <Badge variant="outline">{typeLabel}</Badge>

        {/* Grading mode is a fact about the question — icon plus words, never a tint alone. */}
        {spec ? (
          spec.autoGradable ? (
            <Badge variant="success" size="sm">
              <Zap aria-hidden="true" />
              {t("root.tests.builder.question.autoGraded")}
            </Badge>
          ) : (
            <Badge variant="neutral" size="sm">
              <PenLine aria-hidden="true" />
              {t("root.tests.builder.question.manualGrading")}
            </Badge>
          )
        ) : null}

        <div className="ml-auto flex items-center gap-1">
          <Controller
            control={control}
            name={`${name}.points`}
            render={({ field, fieldState }) => (
              <label className="flex items-center gap-1.5 text-2xs font-medium text-muted-foreground">
                {t("root.tests.builder.question.points")}
                <Input
                  type="number"
                  min={0}
                  step={1}
                  disabled={disabled}
                  aria-invalid={Boolean(fieldState.error)}
                  className="w-16 px-2 py-1.5 text-center"
                  value={Number.isFinite(field.value) ? String(field.value) : ""}
                  onChange={(event) => {
                    const raw = event.target.value;
                    field.onChange(raw === "" ? 0 : Number(raw));
                  }}
                  onBlur={field.onBlur}
                  name={field.name}
                  ref={field.ref}
                />
              </label>
            )}
          />

          {/*
            The drag handle is the fast path; these are the reliable one. Per
            `docs/architecture/ARCHITECTURE.md`, a sortable row keeps its
            buttons — a handle needs a sustained drag, which is the wrong ask
            for touch and for motor impairment.
          */}
          <Button
            type="button"
            size="icon-sm"
            variant="ghost"
            disabled={disabled || index === 0}
            aria-label={t("root.tests.builder.question.moveUp")}
            onClick={() => onMove(index, index - 1)}
          >
            <ArrowUp className="size-3.5" />
          </Button>
          <Button
            type="button"
            size="icon-sm"
            variant="ghost"
            disabled={disabled || index >= count - 1}
            aria-label={t("root.tests.builder.question.moveDown")}
            onClick={() => onMove(index, index + 1)}
          >
            <ArrowDown className="size-3.5" />
          </Button>

          {/*
            Duplicating is the fastest way to build a paper: twelve
            True/False/Not Given statements over one passage differ only in
            their prompt, and re-picking the preset for each was twelve trips
            through the picker.
          */}
          <Button
            type="button"
            size="icon-sm"
            variant="ghost"
            disabled={disabled}
            aria-label={t("root.tests.builder.question.duplicate")}
            onClick={() => onDuplicate(index)}
          >
            <Copy className="size-3.5" />
          </Button>
          <Button
            type="button"
            size="icon-sm"
            variant="ghost"
            disabled={disabled}
            aria-label={t("root.tests.builder.question.remove")}
            className="text-muted-foreground hover:text-destructive"
            onClick={() => onRemove(index)}
          >
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      </header>

      {spec ? null : (
        <p className="mt-3 inline-flex items-start gap-1.5 rounded-lg bg-[color-mix(in_srgb,var(--warning)_12%,transparent)] px-3 py-2 text-2xs text-warning">
          <AlertTriangle className="mt-px size-3.5 shrink-0" aria-hidden="true" />
          {t("root.tests.builder.question.unknownType", { type })}
        </p>
      )}

      <div className="mt-3 space-y-3">
        {/*
          A diagram-label question is a picture with blanks on it. Putting the
          image above the prompt is not decoration: the prompt refers to it.
        */}
        {presentation?.imageFirst ? imageField : null}

        <Controller
          control={control}
          name={`${name}.prompt`}
          render={({ field, fieldState }) => (
            <div>
              <Textarea
                {...field}
                rows={presentation?.promptRows ?? 2}
                disabled={disabled}
                placeholder={promptPlaceholder}
                aria-invalid={Boolean(fieldState.error)}
                aria-label={promptLabel}
                className="py-2.5"
              />

              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                {fieldState.error ? (
                  <p className="text-2xs text-destructive">
                    {t("root.tests.builder.question.promptRequired")}
                  </p>
                ) : null}

                {/*
                  Gap-fill prompts need a marker where the blank goes, and every
                  teacher invents their own (___, [ ], ...). One button inserts
                  the one the student renderer will actually recognise.
                */}
                {presentation?.prompt === "gap" ? (
                  <Button
                    type="button"
                    size="xs"
                    variant="ghost"
                    disabled={disabled}
                    onClick={() =>
                      field.onChange(`${field.value ?? ""}${GAP_MARKER}`.trimStart())
                    }
                  >
                    {t("root.tests.builder.question.insertGap")}
                  </Button>
                ) : null}
              </div>
            </div>
          )}
        />

        <Input
          {...control.register(`${name}.helpText`)}
          disabled={disabled}
          placeholder={t("root.tests.builder.question.helpPlaceholder")}
          aria-label={t("root.tests.builder.question.help")}
          className="py-2"
        />

        {presentation?.imageFirst ? null : imageField}

        {spec ? (
          <QuestionAnswerEditor
            control={control}
            setValue={setValue}
            name={name}
            spec={spec}
            type={type}
            passage={passage}
            disabled={disabled}
          />
        ) : null}
      </div>
    </article>
  );
}

export default React.memo(QuestionRow);
