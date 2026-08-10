"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CalendarClock,
  Clock3,
  PenLine,
  Save,
  ShieldAlert,
  Users,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";

import { readSafeActionData } from "@/lib/actions/read-safe-action-result";
import { gradeAttemptAction } from "@/app/(root)/_lib/test-results.actions";
import type { AttemptReviewResponse } from "@/app/(root)/_lib/test-results.schemas";
import QuestionView from "@/components/tests/paper/QuestionView";
import MaterialPanel from "@/components/tests/paper/MaterialPanel";
import ScoreMeter from "@/components/tests/ScoreMeter";
import Avatar from "@/components/ui/Avatar";
import Badge from "@/components/ui/badge";
import { Button } from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Surface from "@/components/ui/Surface";
import Textarea from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { flattenPaper, type PaperTest } from "@/lib/tests/paper.schemas";
import { cn } from "@/lib/utils";

type Mark = { pointsAwarded: number; feedback: string };

/**
 * One student's paper, marked.
 *
 * ## The same renderer the student used
 *
 * The questions come through `QuestionView` in `review` mode — the identical
 * component that rendered the live attempt. A teacher disputing a mark with a
 * student is looking at the same option order, the same wording and the same
 * layout the student saw, because it is the same code. A separate "review"
 * renderer agrees with the exam on the day it is written and drifts from then
 * on.
 *
 * ## Compare with class
 *
 * The toggle is the "with or without other students combined" ask, and it is a
 * switch rather than a second screen because the two readings answer different
 * questions about the same answer: *did they get it right* and *was it a
 * question anyone got right*. A student who missed a question 80% of the class
 * missed has done something different from one who missed a question everyone
 * else answered, and the mark is the same either way.
 *
 * The comparison arrives with the payload, so the toggle costs no request.
 *
 * ## Marking
 *
 * Written answers get a points field and a feedback box, and the whole paper
 * saves in one request. Marking is done in one sitting; a save per essay would
 * leave a half-graded attempt behind the moment the connection dropped.
 */
export default function AttemptReview({
  classId,
  testId,
  review,
  test,
}: {
  classId: string;
  testId: string;
  review: AttemptReviewResponse;
  /**
   * Supplied by the page rather than read off `review`: the backend's review
   * payload does not carry the test itself, and the header needs its title
   * while the score meter needs the pass mark to draw its threshold.
   */
  test: { id: string; title: string; passingScore?: number | null };
}) {
  const { t } = useTranslation();

  const { attempt, student, answers, violations } = review;

  const [compare, setCompare] = useState(false);
  const [marks, setMarks] = useState<Map<string, Mark>>(new Map());
  const [saving, setSaving] = useState(false);

  const answerByQuestion = useMemo(
    () => new Map(answers.map((entry) => [entry.questionId, entry])),
    [answers],
  );

  /**
   * `flattenPaper` wants a whole test; only the tree matters here, and the
   * fields it does not use are filled with the neutral values rather than being
   * cast away — a cast would hide the day one of them starts being read.
   */
  const items = useMemo(
    () =>
      flattenPaper({
        id: test.id,
        title: test.title,
        format: "",
        totalPoints: attempt.maxScore,
        delivery: {} as PaperTest["delivery"],
        sections: review.sections,
      } as PaperTest),
    [test, attempt.maxScore, review.sections],
  );

  const pending = items.filter((item) => {
    const entry = answerByQuestion.get(item.question.id);
    return item.question.answerKind === "MANUAL" && entry?.gradedAt == null;
  }).length;

  const setMark = (questionId: string, patch: Partial<Mark>) =>
    setMarks((current) => {
      const next = new Map(current);
      const entry = answerByQuestion.get(questionId);
      next.set(questionId, {
        pointsAwarded: entry?.pointsAwarded ?? 0,
        feedback: entry?.feedback ?? "",
        ...next.get(questionId),
        ...patch,
      });
      return next;
    });

  const save = async () => {
    if (marks.size === 0) return;
    setSaving(true);

    try {
      readSafeActionData(
        await gradeAttemptAction({
          attemptId: attempt.id,
          marks: [...marks.entries()].map(([questionId, mark]) => ({
            questionId,
            pointsAwarded: mark.pointsAwarded,
            feedback: mark.feedback || undefined,
          })),
        }),
        t("root.tests.errorGeneric"),
      );
      toast.success(t("root.tests.results.review.saved"));
      setMarks(new Map());
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("root.tests.errorGeneric"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 py-6">
      <Link
        href={`/groups/${classId}/tests/${testId}/results`}
        className="inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground transition hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        {t("root.tests.results.review.backToResults")}
      </Link>

      <Surface padding="lg" className="flex flex-wrap items-center gap-5">
        <Avatar name={student.fullName} src={student.avatarUrl ?? undefined} size="lg" />

        <div className="min-w-0 flex-1">
          <h1 className="type-section text-foreground">{student.fullName}</h1>
          <p className="mt-0.5 truncate text-sm text-muted-foreground">{test.title}</p>

          <div className="mt-2 flex flex-wrap items-center gap-2">
            {attempt.submittedAt ? (
              <Badge variant="neutral" size="sm">
                {new Date(attempt.submittedAt).toLocaleString()}
              </Badge>
            ) : null}
            {attempt.timeSpentSeconds ? (
              <Badge variant="neutral" size="sm">
                <Clock3 aria-hidden="true" />
                {t("root.tests.results.minutes", {
                  count: Math.round(attempt.timeSpentSeconds / 60),
                })}
              </Badge>
            ) : null}
            {attempt.isLate ? (
              <Badge variant="warning" size="sm">
                <CalendarClock aria-hidden="true" />
                {t("root.tests.results.late")}
              </Badge>
            ) : null}
            {pending > 0 ? (
              <Badge variant="warning" size="sm">
                <PenLine aria-hidden="true" />
                {t("root.tests.results.pendingManual", { count: pending })}
              </Badge>
            ) : null}
          </div>
        </div>

        <ScoreMeter
          value={attempt.score}
          max={attempt.maxScore}
          passingScore={test.passingScore}
          tone={attempt.passed === false ? "danger" : attempt.passed ? "success" : "neutral"}
          className="w-48"
        />
      </Surface>

      {/*
        Violations are listed as events with times, not summarised as a verdict.
        What they mean is the teacher's call — the software's job is to say what
        happened and when.
      */}
      {violations.length > 0 ? (
        <Surface
          padding="md"
          className="border-[color-mix(in_srgb,var(--warning)_40%,transparent)] bg-[color-mix(in_srgb,var(--warning)_7%,transparent)]"
        >
          <p className="type-label mb-2 flex items-center gap-2 text-foreground">
            <ShieldAlert className="size-4 text-warning" aria-hidden="true" />
            {t("root.tests.results.review.integrity", { count: violations.length })}
          </p>
          <ul className="space-y-1 text-2xs text-muted-foreground">
            {violations.map((violation, index) => (
              <li key={`${violation.type}-${index}`}>
                {t(`exam.integrity.${violation.type}.title`)} ·{" "}
                {new Date(violation.occurredAt).toLocaleTimeString()}
              </li>
            ))}
          </ul>
        </Surface>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <label className="flex cursor-pointer items-center gap-2.5">
          <Switch checked={compare} onCheckedChange={setCompare} />
          <span className="text-13 text-foreground">
            <Users className="mr-1.5 inline size-3.5 text-muted-foreground" aria-hidden="true" />
            {t("root.tests.results.review.compare")}
          </span>
        </label>

        {marks.size > 0 ? (
          <Button type="button" loading={saving} onClick={() => void save()}>
            <Save />
            {t("root.tests.results.review.saveMarks", { count: marks.size })}
          </Button>
        ) : null}
      </div>

      <div className="space-y-4">
        {items.map((item) => {
          const entry = answerByQuestion.get(item.question.id);
          const mark = marks.get(item.question.id);
          const manual = item.question.answerKind === "MANUAL";

          return (
            <div key={item.question.id} className="space-y-3">
              {item.opensMaterial && item.material ? (
                <MaterialPanel material={item.material} />
              ) : null}

              <Surface padding="md" className="space-y-4">
                <QuestionView
                  question={item.question}
                  mode="review"
                  value={entry?.value ?? null}
                  result={{
                    isCorrect: entry?.isCorrect ?? null,
                    pointsAwarded: mark?.pointsAwarded ?? entry?.pointsAwarded ?? 0,
                    correctValue: entry?.correctValue ?? undefined,
                    feedback: manual ? null : entry?.feedback,
                    // The toggle decides whether the comparison renders at all,
                    // so a teacher reading one paper is not also reading a report.
                    classCorrectRate: compare ? entry?.classCorrectRate : null,
                  }}
                />

                {manual ? (
                  <div className="space-y-2 rounded-xl bg-muted/60 p-3">
                    <div className="flex flex-wrap items-center gap-3">
                      <label className="flex items-center gap-2 text-2xs font-medium text-muted-foreground">
                        {t("root.tests.results.review.points")}
                        <Input
                          type="number"
                          min={0}
                          max={item.question.points}
                          step={1}
                          className="w-20 bg-card px-2 py-1.5 text-center"
                          value={String(mark?.pointsAwarded ?? entry?.pointsAwarded ?? 0)}
                          onChange={(event) =>
                            setMark(item.question.id, {
                              // Clamped here as well as server-side, so a
                              // teacher never types a number that is silently
                              // changed underneath them after saving.
                              pointsAwarded: clamp(
                                Number(event.target.value) || 0,
                                0,
                                item.question.points,
                              ),
                            })
                          }
                        />
                        <span className="tabular-nums">/ {item.question.points}</span>
                      </label>

                      {entry?.gradedAt ? (
                        <Badge variant="success" size="xs">
                          {t("root.tests.results.review.marked")}
                        </Badge>
                      ) : (
                        <Badge variant="warning" size="xs">
                          {t("root.tests.results.review.unmarked")}
                        </Badge>
                      )}
                    </div>

                    <Textarea
                      rows={2}
                      className="bg-card"
                      placeholder={t("root.tests.results.review.feedbackPlaceholder")}
                      aria-label={t("root.tests.results.review.feedback")}
                      value={mark?.feedback ?? entry?.feedback ?? ""}
                      onChange={(event) =>
                        setMark(item.question.id, { feedback: event.target.value })
                      }
                    />
                  </div>
                ) : null}
              </Surface>
            </div>
          );
        })}
      </div>

      {/*
        A second save at the bottom. A teacher marking twelve essays reaches the
        end of the paper, not the top of it, and scrolling back to a button is
        the moment a browser refresh loses an hour of marking.
      */}
      {marks.size > 0 ? (
        <div
          className={cn(
            "sticky bottom-4 flex justify-end",
            // Above the mobile nav bar the shell reserves space for.
            "pb-2",
          )}
        >
          <Button type="button" loading={saving} onClick={() => void save()} className="shadow-elev-3">
            <Save />
            {t("root.tests.results.review.saveMarks", { count: marks.size })}
          </Button>
        </div>
      ) : null}
    </div>
  );
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, Math.round(value)));
}
