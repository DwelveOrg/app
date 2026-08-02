"use client";

import React from "react";
import { AlertTriangle, ArrowDown, ArrowUp, Trash2, Zap } from "lucide-react";
import { Controller, type Control, type UseFormSetValue } from "react-hook-form";
import { useTranslation } from "react-i18next";

import type { QuestionTypeSpec } from "@/app/(root)/_lib/tests.schemas";
import type { TestBuilderForm } from "@/app/(root)/_lib/tests.actions.schemas";
import { Button } from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Textarea from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { QuestionFieldName } from "../_types";
import { questionAnchorId } from "../_constants";
import { humanizeToken, translateKey } from "../_lib/labels";
import ChoiceEditor from "./editors/ChoiceEditor";
import MatchingEditor from "./editors/MatchingEditor";
import ManualEditor from "./editors/ManualEditor";
import NumericEditor from "./editors/NumericEditor";
import OrderingEditor from "./editors/OrderingEditor";
import TextAnswerEditor from "./editors/TextAnswerEditor";
import TestImageField from "./TestImageField";

type QuestionCardProps = {
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
  disabled?: boolean;
  /** Highlighted because a publish issue points at it. */
  flagged?: boolean;
  onMove: (from: number, to: number) => void;
  onRemove: (index: number) => void;
};

/**
 * One question. Which editor renders is decided by `answerKind` — the engine —
 * not by `type`, which is the preset the teacher picked. That is the whole
 * point of the two classifiers: the catalogue can grow to fifty presets without
 * this switch gaining a branch.
 *
 * Memoised, and given only `control`, a composed `name`, and stable callbacks,
 * so typing in one question never re-renders its 39 siblings.
 */
function QuestionCard({
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
  disabled,
  flagged,
  onMove,
  onRemove,
}: QuestionCardProps) {
  const { t } = useTranslation();

  const typeLabel = translateKey(t, spec?.labelKey, humanizeToken(type));

  const renderEditor = () => {
    if (!spec) return null;

    const editorProps = { control, setValue, name, spec, disabled };

    switch (spec.answerKind) {
      case "SINGLE_CHOICE":
      case "MULTI_CHOICE":
        return <ChoiceEditor {...editorProps} />;
      case "TEXT":
        return <TextAnswerEditor {...editorProps} />;
      case "NUMERIC":
        return <NumericEditor {...editorProps} />;
      case "MATCHING":
        return <MatchingEditor {...editorProps} />;
      case "ORDERING":
        return <OrderingEditor {...editorProps} />;
      case "MANUAL":
        return <ManualEditor {...editorProps} />;
      default:
        return null;
    }
  };

  return (
    <article
      id={questionId ? questionAnchorId(questionId) : undefined}
      tabIndex={-1}
      className={cn(
        "scroll-mt-24 rounded-xl border bg-[var(--card)] p-4 transition",
        flagged
          ? "border-[var(--destructive)] ring-2 ring-[color-mix(in_srgb,var(--destructive)_25%,transparent)]"
          : "border-[var(--border)]",
      )}
    >
      <header className="flex flex-wrap items-center gap-2">
        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[color-mix(in_srgb,var(--primary)_12%,transparent)] text-xs font-bold text-[var(--primary)]">
          {questionNumber}
        </span>

        <span className="rounded-full border border-[var(--border)] bg-[var(--background)] px-2 py-0.5 text-[11px] font-medium text-[var(--muted-foreground)]">
          {typeLabel}
        </span>

        {spec && !spec.autoGradable ? (
          <span className="text-[11px] text-[var(--muted-foreground)]">
            {t("root.tests.builder.question.manualGrading")}
          </span>
        ) : null}

        {spec?.autoGradable ? (
          <span
            className="inline-flex items-center gap-1 text-[11px] text-[var(--muted-foreground)]"
            title={t("root.tests.builder.question.autoGraded")}
          >
            <Zap className="h-3 w-3" aria-hidden="true" />
            {t("root.tests.builder.question.autoGraded")}
          </span>
        ) : null}

        <div className="ml-auto flex items-center gap-2">
          <Controller
            control={control}
            name={`${name}.points`}
            render={({ field, fieldState }) => (
              <label className="flex items-center gap-1.5 text-[11px] font-medium text-[var(--muted-foreground)]">
                {t("root.tests.builder.question.points")}
                <Input
                  type="number"
                  min={0}
                  step={1}
                  disabled={disabled}
                  aria-invalid={Boolean(fieldState.error)}
                  className="w-20 px-2 py-1.5 text-center"
                  value={Number.isFinite(field.value) ? String(field.value) : ""}
                  onChange={(event) => {
                    const raw = event.target.value;
                    field.onChange(raw === "" ? 0 : Number(raw));
                  }}
                  onBlur={field.onBlur}
                  name={field.name}
                  ref={field.ref}
                />
                {fieldState.error ? (
                  <span className="text-[var(--destructive)]">
                    {t("root.tests.builder.question.pointsInvalid")}
                  </span>
                ) : null}
              </label>
            )}
          />

          <Button
            type="button"
            size="icon-sm"
            variant="ghost"
            disabled={disabled || index === 0}
            aria-label={t("root.tests.builder.question.moveUp")}
            onClick={() => onMove(index, index - 1)}
          >
            <ArrowUp className="h-3.5 w-3.5" />
          </Button>
          <Button
            type="button"
            size="icon-sm"
            variant="ghost"
            disabled={disabled || index >= count - 1}
            aria-label={t("root.tests.builder.question.moveDown")}
            onClick={() => onMove(index, index + 1)}
          >
            <ArrowDown className="h-3.5 w-3.5" />
          </Button>
          <Button
            type="button"
            size="icon-sm"
            variant="ghost"
            disabled={disabled}
            aria-label={t("root.tests.builder.question.remove")}
            className="text-[var(--muted-foreground)] hover:text-[var(--destructive)]"
            onClick={() => onRemove(index)}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </header>

      {spec ? null : (
        <p className="mt-3 inline-flex items-start gap-1.5 rounded-lg bg-[color-mix(in_srgb,var(--warning)_12%,transparent)] px-3 py-2 text-[11px] text-[var(--warning)]">
          <AlertTriangle className="mt-px h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          {t("root.tests.builder.question.unknownType", { type })}
        </p>
      )}

      <div className="mt-3 space-y-3">
        <Controller
          control={control}
          name={`${name}.prompt`}
          render={({ field, fieldState }) => (
            <div>
              <Textarea
                {...field}
                rows={2}
                disabled={disabled}
                placeholder={t("root.tests.builder.question.promptPlaceholder")}
                aria-invalid={Boolean(fieldState.error)}
                aria-label={t("root.tests.builder.question.prompt")}
                className="py-2.5"
              />
              {fieldState.error ? (
                <p className="mt-1 text-[11px] text-[var(--destructive)]">
                  {t("root.tests.builder.question.promptRequired")}
                </p>
              ) : null}
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

        <Controller
          control={control}
          name={`${name}.imageUrl`}
          render={({ field }) => (
            <TestImageField
              testId={testId}
              value={field.value}
              onChange={field.onChange}
              label={t("root.tests.builder.question.image")}
              hint={t("root.tests.builder.image.hint")}
              disabled={disabled}
            />
          )}
        />

        {renderEditor()}
      </div>
    </article>
  );
}

export default React.memo(QuestionCard);
