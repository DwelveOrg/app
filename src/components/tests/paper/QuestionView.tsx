"use client";

import Image from "next/image";
import { Check, CircleDashed, Info, PenLine, X } from "lucide-react";
import { useTranslation } from "react-i18next";

import Badge from "@/components/ui/badge";
import { describeAnswerKey, isAnswered } from "@/lib/tests/answers";
import { GAP_MARKER } from "@/lib/tests/question-presentation";
import { cn } from "@/lib/utils";
import ChoiceInput from "./inputs/ChoiceInput";
import MatchingInput from "./inputs/MatchingInput";
import NumericInput from "./inputs/NumericInput";
import OrderingInput from "./inputs/OrderingInput";
import TextInput from "./inputs/TextInput";
import type { QuestionRenderProps } from "./types";

/**
 * One question, in whichever of the three modes the surface needs.
 *
 * This is the component that makes "what the student saw" and "what the teacher
 * marks" the same thing. The exam runtime renders it in `answer` mode, the
 * teacher's review renders the identical tree in `review` mode with the key
 * beside it, and the studio preview renders it in `preview` mode. The prompt,
 * the option order, the word limit and the layout come from one place, so a
 * dispute about what a student was actually asked has one answer.
 *
 * The **engine decides the input**, not the preset. Twenty-six presets share
 * seven ways of answering, and a student does not need `IELTS_MCQ_SINGLE` and
 * `SAT_RW_MCQ` to look different — they need a list of options. That is the
 * opposite of the authoring side, where the preset drives everything, and
 * deliberately so: the teacher is choosing what kind of question to write, and
 * the student is only answering it.
 */
export default function QuestionView({
  question,
  mode,
  value,
  onChange,
  result,
  disabled,
  displayNumber,
  hideMeta,
  struckOptionIds,
}: QuestionRenderProps) {
  const { t } = useTranslation();
  const answered = isAnswered(question.answerKind, value);
  const review = mode === "review";
  const number = displayNumber ?? question.questionNumber;

  /*
   * Choice and matching questions mark the key on the options themselves, so
   * this is `null` for them. It is the typed kinds — a short answer's accepted
   * spellings, a numeric's tolerance — that have nowhere to put it.
   */
  const keyText = review ? describeAnswerKey(result?.correctValue) : null;

  return (
    <article
      id={`question-${question.id}`}
      className="scroll-mt-24 space-y-3"
      aria-label={t("exam.paper.questionLabel", { number })}
    >
      {hideMeta && !review ? null : (
        <header className="flex flex-wrap items-center gap-2">
          {hideMeta ? null : (
            <>
              <span
                aria-hidden="true"
                className={cn(
                  "numeric inline-flex h-7 min-w-7 items-center justify-center rounded-[var(--radius-pill)] px-2 text-13 font-semibold",
                  review
                    ? markTone(result?.isCorrect, result?.pointsAwarded, question.points)
                    : answered
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground",
                )}
              >
                {number}
              </span>

              <Badge variant="neutral" size="sm">
                {t("exam.paper.points", { count: question.points })}
              </Badge>
            </>
          )}

          {review ? <MarkBadge result={result} points={question.points} /> : null}
        </header>
      )}

      {/*
        The prompt renders the gap marker as a visible blank rather than four
        underscores. The teacher typed a placeholder; the student should see the
        space where their answer goes.
      */}
      <p className="exam-prose max-w-[68ch] text-15 whitespace-pre-wrap text-foreground">
        {renderGaps(question.prompt)}
      </p>

      {question.helpText ? (
        <p className="flex max-w-[68ch] items-start gap-2 text-13 text-muted-foreground">
          <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
          {question.helpText}
        </p>
      ) : null}

      {question.imageUrl ? (
        <Image
          src={question.imageUrl}
          alt=""
          width={900}
          height={600}
          className="h-auto w-full max-w-2xl rounded-lg border border-border"
          unoptimized
        />
      ) : null}

      <AnswerInput
        question={question}
        mode={mode}
        value={value}
        onChange={onChange}
        result={result}
        disabled={disabled}
        struckOptionIds={struckOptionIds}
      />

      {keyText ? (
        <p className="text-13 text-success">
          {t("exam.paper.expectedAnswer", { answer: keyText })}
        </p>
      ) : null}

      {review && result?.feedback ? (
        <p className="flex max-w-[68ch] items-start gap-2 rounded-xl bg-muted px-3 py-2 text-13 text-foreground">
          <PenLine className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
          {result.feedback}
        </p>
      ) : null}

      {/*
        How the class did on this question, when the viewer asked for it. The
        toggle lives on the review screen; this is the one line it turns on, and
        it sits under the answer so an individual paper still reads as one
        student's work rather than as a report.
      */}
      {review && result?.classCorrectRate != null ? (
        <p className="text-2xs text-muted-foreground">
          {t("exam.paper.classRate", {
            percent: Math.round(result.classCorrectRate * 100),
          })}
        </p>
      ) : null}
    </article>
  );
}

/** The seven engines, and the input each of them needs. */
function AnswerInput(props: QuestionRenderProps) {
  switch (props.question.answerKind) {
    case "SINGLE_CHOICE":
      return <ChoiceInput {...props} multiple={false} />;
    case "MULTI_CHOICE":
      return <ChoiceInput {...props} multiple />;
    case "TEXT":
      return <TextInput {...props} long={false} />;
    case "MANUAL":
      return <TextInput {...props} long />;
    case "NUMERIC":
      return <NumericInput {...props} />;
    case "MATCHING":
      return <MatchingInput {...props} />;
    case "ORDERING":
      return <OrderingInput {...props} />;
  }
}

function MarkBadge({
  result,
  points,
}: {
  result: QuestionRenderProps["result"];
  points: number;
}) {
  const { t } = useTranslation();

  // A written response nobody has marked yet. Distinct from zero — a student
  // reading "0 / 8" on an essay would reasonably think they had failed it.
  if (!result || result.isCorrect === null) {
    return (
      <Badge variant="neutral" size="sm">
        <CircleDashed aria-hidden="true" />
        {t("exam.paper.awaitingMark")}
      </Badge>
    );
  }

  return result.isCorrect ? (
    <Badge variant="success" size="sm">
      <Check aria-hidden="true" />
      {t("exam.paper.scored", { awarded: result.pointsAwarded, points })}
    </Badge>
  ) : (
    <Badge variant="destructive" size="sm">
      <X aria-hidden="true" />
      {t("exam.paper.scored", { awarded: result.pointsAwarded, points })}
    </Badge>
  );
}

function markTone(
  isCorrect: boolean | null | undefined,
  awarded: number | undefined,
  points: number,
): string {
  if (isCorrect == null) return "bg-muted text-muted-foreground";
  if (isCorrect) return "bg-[var(--success)] text-[var(--primary-foreground)]";
  // Partial credit is neither: a matching question worth 4 that scored 3 is not
  // a wrong answer, and painting it red is a mark the student will dispute.
  if ((awarded ?? 0) > 0 && (awarded ?? 0) < points) {
    return "bg-[var(--warning)] text-[var(--primary-foreground)]";
  }
  return "bg-[var(--destructive)] text-[var(--primary-foreground)]";
}

/**
 * Turns the authoring gap marker into a visible blank.
 *
 * The builder inserts `____` because a teacher needs to see where the gap is
 * while writing. Rendering the same four underscores to a student makes the
 * sentence look like a formatting mistake; a ruled blank looks like a gap.
 */
function renderGaps(prompt: string) {
  const parts = prompt.split(GAP_MARKER);
  if (parts.length === 1) return prompt;

  return parts.flatMap((part, index) =>
    index === 0
      ? [part]
      : [
          <span
            key={`gap-${index}`}
            aria-hidden="true"
            className="mx-1 inline-block w-16 border-b-2 border-muted-foreground/60 align-baseline"
          />,
          part,
        ],
  );
}
