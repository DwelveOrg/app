"use client";

import { useMemo } from "react";
import Link from "next/link";
import { CalendarClock, CheckCircle2, Clock3, Hourglass, XCircle } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { useTranslation } from "react-i18next";

import { describeAnswerKey } from "@/lib/tests/answers";
import Badge from "@/components/ui/badge";
import { Button } from "@/components/ui/Button";
import Surface from "@/components/ui/Surface";
import ScoreMeter from "@/components/tests/ScoreMeter";
import ExperienceRating from "./ExperienceRating";
import { DUR, EASE_OUT, staggerContainer, staggerItem, stillVariants } from "@/lib/motion";
import { cn } from "@/lib/utils";
import type { AttemptResultResponse } from "../_lib/attempts.schemas";

export default function ResultScreen({
  testId,
  result,
}: {
  testId: string;
  result: AttemptResultResponse;
}) {
  const { t } = useTranslation();
  const reduced = useReducedMotion();

  if (!result.released) {
    return (
      <div className="exam-result-bg flex min-h-0 flex-1 items-center justify-center px-4 py-16">
        <div className="w-full max-w-lg text-center">
          <span
            aria-hidden="true"
            className="mx-auto grid size-20 place-items-center rounded-3xl bg-card text-muted-foreground shadow-elev-2"
          >
            <Hourglass className="size-9" />
          </span>
          <h1 className="type-title mt-6 text-foreground">
            {t("exam.result.pending.title")}
          </h1>
          <p className="mt-2 text-15 text-muted-foreground">
            {t(`exam.result.pending.${result.releaseMode}`)}
          </p>
          {result.availableAt ? (
            <p className="mt-1 text-15 text-muted-foreground">
              {t("exam.result.pending.availableAt", {
                when: new Date(result.availableAt).toLocaleString(),
              })}
            </p>
          ) : null}
          <Button asChild variant="outline" size="lg" className="mt-8">
            <Link href="/assignments/exams">{t("exam.backToAssignments")}</Link>
          </Button>
        </div>
      </div>
    );
  }

  const { attempt, breakdown } = result;
  const score = attempt.score ?? 0;
  const maxScore = attempt.maxScore ?? 0;
  const percentage =
    maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;

  const tone = !breakdown
    ? "neutral"
    : attempt.passed === false
      ? "danger"
      : attempt.passed
        ? "success"
        : "neutral";
  const tint =
    tone === "danger"
      ? "var(--destructive)"
      : tone === "success"
        ? "var(--success)"
        : "var(--primary)";

  return (
    <motion.div
      className="exam-result-bg min-h-0 flex-1"
      style={{ "--result-tint": tint } as React.CSSProperties}
      variants={reduced ? stillVariants : staggerContainer}
      initial="hidden"
      animate="shown"
    >
      <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8 lg:py-16">
        <motion.header
          variants={reduced ? stillVariants : staggerItem}
          className="grid items-end gap-8 lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)]"
        >
          {breakdown ? (
            <ScoreMeter
              value={score}
              max={maxScore}
              tone={tone}
              size="lg"
            />
          ) : (
            <span
              aria-hidden="true"
              className="grid size-24 place-items-center rounded-3xl bg-[color-mix(in_srgb,var(--success)_14%,transparent)] text-success"
            >
              <CheckCircle2 className="size-12" />
            </span>
          )}

          <div className="min-w-0">
            <h1 className="type-title text-foreground lg:text-[2.5rem] lg:leading-tight">
              {breakdown ? t("exam.result.yourScore") : t("exam.result.submitted")}
            </h1>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              {breakdown && attempt.passed !== null ? (
                <Badge variant={attempt.passed ? "success" : "destructive"} size="md">
                  {attempt.passed ? (
                    <CheckCircle2 aria-hidden="true" />
                  ) : (
                    <XCircle aria-hidden="true" />
                  )}
                  {t(attempt.passed ? "exam.result.passed" : "exam.result.notPassed")}
                </Badge>
              ) : null}

              {breakdown ? (
                <Badge variant="neutral" size="md">
                  {t("exam.result.percentage", { percent: percentage })}
                </Badge>
              ) : null}

              {attempt.isLate ? (
                <Badge variant="warning" size="md">
                  <CalendarClock aria-hidden="true" />
                  {t("exam.result.late")}
                </Badge>
              ) : null}

              {attempt.timeSpentSeconds ? (
                <Badge variant="neutral" size="md">
                  <Clock3 aria-hidden="true" />
                  {t("exam.result.timeSpent", {
                    minutes: Math.round(attempt.timeSpentSeconds / 60),
                  })}
                </Badge>
              ) : null}
            </div>
          </div>
        </motion.header>

        {breakdown ? (
          <motion.dl
            variants={reduced ? stillVariants : staggerItem}
            className="mt-10 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4"
          >
            <Tally label={t("exam.result.correct")} value={breakdown.correct} tone="success" />
            <Tally
              label={t("exam.result.incorrect")}
              value={breakdown.incorrect}
              tone="danger"
            />
            <Tally
              label={t("exam.result.unanswered")}
              value={breakdown.unanswered}
              tone="muted"
            />
            <Tally
              label={t("exam.result.pendingManual")}
              value={breakdown.pendingManual}
              tone="muted"
            />
          </motion.dl>
        ) : null}

        {breakdown && breakdown.sections.length > 1 ? (
          <motion.section variants={reduced ? stillVariants : staggerItem} className="mt-6">
            <Surface padding="lg">
              <ul className="grid gap-5 md:grid-cols-2">
                {breakdown.sections.map((section) => (
                  <SectionBar
                    key={section.id}
                    title={section.title}
                    score={section.score}
                    max={section.maxScore}
                    reduced={reduced}
                  />
                ))}
              </ul>
            </Surface>
          </motion.section>
        ) : null}

        {result.questions?.length ? (
          <motion.section
            variants={reduced ? stillVariants : staggerItem}
            className="mt-10 space-y-4"
          >
            <h2 className="type-section text-foreground">{t("exam.result.review")}</h2>
            <div className="grid gap-3 lg:grid-cols-2">
              {result.questions.map((question) => (
                <ReviewRow key={question.id} question={question} />
              ))}
            </div>
          </motion.section>
        ) : null}

        {/*
          Asked after the result, never before it — see ExperienceRating. It
          sits above the navigation so it is the last thing on the page rather
          than something to scroll back for, and below the paper review so it
          never stands between a student and their marks.
        */}
        <motion.section
          variants={reduced ? stillVariants : staggerItem}
          className="mt-10"
        >
          <ExperienceRating
            attemptId={attempt.id}
            initialRating={attempt.experienceRating}
          />
        </motion.section>

        <motion.div
          variants={reduced ? stillVariants : staggerItem}
          className="mt-8 flex flex-wrap gap-3"
        >
          <Button asChild variant="outline" size="lg">
            <Link href="/assignments/exams">{t("exam.backToAssignments")}</Link>
          </Button>
          {attempt.attemptNumber < attempt.attemptsAllowed ? (
            <Button asChild size="lg">
              <Link href={`/exam/${testId}`}>{t("exam.result.tryAgain")}</Link>
            </Button>
          ) : null}
        </motion.div>
      </div>
    </motion.div>
  );
}

function Tally({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "success" | "danger" | "muted";
}) {
  return (
    <Surface padding="md" className="flex flex-col justify-between gap-2">
      <dt className="text-13 text-muted-foreground">{label}</dt>
      <dd
        className={cn(
          "text-[2rem] leading-none font-bold tabular-nums",
          tone === "success" && "text-success",
          tone === "danger" && "text-destructive",
          tone === "muted" && "text-foreground",
        )}
      >
        {value}
      </dd>
    </Surface>
  );
}

function SectionBar({
  title,
  score,
  max,
  reduced,
}: {
  title: string;
  score: number;
  max: number;
  reduced: boolean | null;
}) {
  const percent = max > 0 ? Math.round((score / max) * 100) : 0;

  return (
    <li className="space-y-2">
      <div className="flex items-baseline justify-between gap-3">
        <span className="min-w-0 truncate text-15 font-medium text-foreground">{title}</span>
        <span className="shrink-0 text-15 tabular-nums text-muted-foreground">
          {score} / {max}
        </span>
      </div>
      <div
        className="h-2 overflow-hidden rounded-full bg-muted"
        role="img"
        aria-label={`${title}: ${percent}%`}
      >
        <motion.div
          className="h-full rounded-full bg-[var(--chart-1)]"
          initial={reduced ? false : { width: 0 }}
          animate={{ width: `${percent}%` }}
          transition={{ duration: DUR.layout, ease: EASE_OUT }}
        />
      </div>
    </li>
  );
}

function ReviewRow({
  question,
}: {
  question: NonNullable<
    Extract<AttemptResultResponse, { released: true }>["questions"]
  >[number];
}) {
  const { t } = useTranslation();
  const answer = useMemo(() => describe(question.yourAnswer), [question.yourAnswer]);
  const key = useMemo(
    () => describeAnswerKey(question.correctAnswer) ?? describe(question.correctAnswer),
    [question.correctAnswer],
  );

  return (
    <Surface padding="md" className="flex items-start gap-3">
      <span
        aria-hidden="true"
        className={cn(
          "inline-flex size-8 shrink-0 items-center justify-center rounded-full text-13 font-semibold tabular-nums",
          question.isCorrect == null
            ? "bg-muted text-muted-foreground"
            : question.isCorrect
              ? "bg-[var(--success)] text-[var(--primary-foreground)]"
              : "bg-[var(--destructive)] text-[var(--primary-foreground)]",
        )}
      >
        {question.questionNumber}
      </span>

      <div className="min-w-0 flex-1 space-y-1.5">
        <p className="text-15 text-foreground">{question.prompt}</p>
        <p className="text-13 text-muted-foreground">
          {t("exam.result.yourAnswerIs", {
            answer: answer || t("exam.paper.notAnswered"),
          })}
        </p>
        {key ? (
          <p className="text-13 text-success">
            {t("exam.result.correctAnswerIs", { answer: key })}
          </p>
        ) : null}
        {question.feedback ? (
          <p className="text-13 text-foreground">{question.feedback}</p>
        ) : null}
      </div>

      {question.pointsAwarded != null && question.points != null ? (
        <span className="shrink-0 text-13 tabular-nums text-muted-foreground">
          {question.pointsAwarded} / {question.points}
        </span>
      ) : null}
    </Surface>
  );
}

/**
 * A stored answer as one line of text.
 *
 * The summary list is a scan, not a re-render of the paper: it has to fit on a
 * row beside the prompt. Choice ids would be meaningless here, so a choice
 * answer summarises as the count it holds and the full comparison stays on the
 * question itself.
 */
function describe(value: unknown): string {
  if (!value || typeof value !== "object") return "";
  const record = value as Record<string, unknown>;

  if (typeof record.text === "string") return record.text;
  if (typeof record.number === "number") return String(record.number);
  if (Array.isArray(record.optionIds)) return `${record.optionIds.length}`;
  if (Array.isArray(record.pairs)) {
    return record.pairs
      .map((pair) =>
        pair && typeof pair === "object" ? String((pair as { key?: unknown }).key ?? "") : "",
      )
      .filter(Boolean)
      .join(", ");
  }
  return "";
}
