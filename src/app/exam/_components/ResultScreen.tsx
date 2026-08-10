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
import { DUR, EASE_OUT, staggerContainer, staggerItem, stillVariants } from "@/lib/motion";
import { cn } from "@/lib/utils";
import type { AttemptResultResponse } from "../_lib/attempts.schemas";

/**
 * What a student sees after they submit.
 *
 * ## The shape of the page is decided by the teacher, not by this component
 *
 * `delivery` governs three independent things — whether a score is shown at
 * all, whether the answer key is shown, and when either becomes available — and
 * the server has already resolved them into the payload. A missing `breakdown`
 * means "no score", a missing `questions` means "no key". This renders what
 * arrived and never fills a gap with a default, because the default for an
 * answer key is not showing it.
 *
 * ## Not-yet-released is not an error
 *
 * A student who submitted an hour ago and is waiting on their teacher has done
 * nothing wrong. That state gets a real screen with the reason and, when the
 * server knows it, the time — not a 403 and not an empty page.
 */
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
      <div className="mx-auto w-full max-w-lg px-4 py-16 text-center md:px-6">
        <span
          aria-hidden="true"
          className="mx-auto grid size-14 place-items-center rounded-2xl bg-muted text-muted-foreground"
        >
          <Hourglass className="size-6" />
        </span>
        <h1 className="type-title mt-4 text-foreground">
          {t("exam.result.pending.title")}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {t(`exam.result.pending.${result.releaseMode}`)}
        </p>
        {result.availableAt ? (
          <p className="mt-1 text-sm text-muted-foreground">
            {t("exam.result.pending.availableAt", {
              when: new Date(result.availableAt).toLocaleString(),
            })}
          </p>
        ) : null}
        <Button asChild variant="outline" className="mt-6">
          <Link href="/assignments/exams">{t("exam.backToAssignments")}</Link>
        </Button>
      </div>
    );
  }

  const { attempt, breakdown } = result;
  const percentage =
    attempt.maxScore > 0 ? Math.round((attempt.score / attempt.maxScore) * 100) : 0;

  return (
    <motion.div
      className="mx-auto w-full max-w-3xl space-y-6 px-4 py-8 md:px-6"
      variants={reduced ? stillVariants : staggerContainer}
      initial="hidden"
      animate="shown"
    >
      <motion.header
        variants={reduced ? stillVariants : staggerItem}
        className="flex flex-wrap items-center gap-5"
      >
        {/*
          The score is shown only when the teacher allowed it. Where they did
          not, the page still confirms the submission — "we have your paper" is
          the thing the student came to check.
        */}
        {breakdown ? (
          <ScoreMeter
            value={attempt.score}
            max={attempt.maxScore}
            tone={attempt.passed === false ? "danger" : attempt.passed ? "success" : "neutral"}
          />
        ) : (
          <span
            aria-hidden="true"
            className="grid size-16 place-items-center rounded-2xl bg-[color-mix(in_srgb,var(--success)_14%,transparent)] text-success"
          >
            <CheckCircle2 className="size-7" />
          </span>
        )}

        <div className="min-w-0 flex-1">
          <h1 className="type-title text-foreground">
            {/*
              The meter already carries the number, so the heading names what it
              is rather than repeating it — "31 / 40" rendered twice side by side
              is the same fact twice, and neither copy reads as the headline.
            */}
            {breakdown ? t("exam.result.yourScore") : t("exam.result.submitted")}
          </h1>

          <div className="mt-2 flex flex-wrap items-center gap-2">
            {attempt.passed !== null ? (
              <Badge variant={attempt.passed ? "success" : "destructive"} size="sm">
                {attempt.passed ? (
                  <CheckCircle2 aria-hidden="true" />
                ) : (
                  <XCircle aria-hidden="true" />
                )}
                {t(attempt.passed ? "exam.result.passed" : "exam.result.notPassed")}
              </Badge>
            ) : null}

            {breakdown ? (
              <Badge variant="neutral" size="sm">
                {t("exam.result.percentage", { percent: percentage })}
              </Badge>
            ) : null}

            {attempt.isLate ? (
              <Badge variant="warning" size="sm">
                <CalendarClock aria-hidden="true" />
                {t("exam.result.late")}
              </Badge>
            ) : null}

            {attempt.timeSpentSeconds ? (
              <Badge variant="neutral" size="sm">
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
        <motion.div variants={reduced ? stillVariants : staggerItem}>
          <Surface padding="md">
            <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
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
              {/*
                Kept separate from "incorrect". A student with three unmarked
                essays reading "3 incorrect" would believe they had failed them.
              */}
              <Tally
                label={t("exam.result.pendingManual")}
                value={breakdown.pendingManual}
                tone="muted"
              />
            </dl>

            {breakdown.sections.length > 1 ? (
              <ul className="mt-4 space-y-2 border-t border-border pt-4">
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
            ) : null}
          </Surface>
        </motion.div>
      ) : null}

      {result.questions?.length ? (
        <motion.section variants={reduced ? stillVariants : staggerItem} className="space-y-3">
          <h2 className="type-heading text-foreground">{t("exam.result.review")}</h2>
          <Surface padding="none" divided>
            {result.questions.map((question) => (
              <ReviewRow key={question.id} question={question} />
            ))}
          </Surface>
        </motion.section>
      ) : null}

      <motion.div
        variants={reduced ? stillVariants : staggerItem}
        className="flex flex-wrap gap-3"
      >
        <Button asChild variant="outline">
          <Link href="/assignments/exams">{t("exam.backToAssignments")}</Link>
        </Button>
        {attempt.attemptNumber < attempt.attemptsAllowed ? (
          <Button asChild>
            <Link href={`/exam/${testId}`}>{t("exam.result.tryAgain")}</Link>
          </Button>
        ) : null}
      </motion.div>
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
    <div>
      <dt className="text-2xs text-muted-foreground">{label}</dt>
      <dd
        className={cn(
          "type-section tabular-nums",
          tone === "success" && "text-success",
          tone === "danger" && "text-destructive",
          tone === "muted" && "text-foreground",
        )}
      >
        {value}
      </dd>
    </div>
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
    <li className="space-y-1">
      <div className="flex items-baseline justify-between gap-3 text-13">
        <span className="min-w-0 truncate text-foreground">{title}</span>
        <span className="shrink-0 tabular-nums text-muted-foreground">
          {score} / {max}
        </span>
      </div>
      <div
        className="h-1.5 overflow-hidden rounded-full bg-muted"
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
  // The key has its own shapes, so it gets its own describer first.
  const key = useMemo(
    () => describeAnswerKey(question.correctAnswer) ?? describe(question.correctAnswer),
    [question.correctAnswer],
  );

  return (
    <div className="flex flex-wrap items-start gap-3 px-4 py-3">
      <span
        aria-hidden="true"
        className={cn(
          "inline-flex size-7 shrink-0 items-center justify-center rounded-full text-13 font-semibold tabular-nums",
          question.isCorrect === null
            ? "bg-muted text-muted-foreground"
            : question.isCorrect
              ? "bg-[var(--success)] text-[var(--primary-foreground)]"
              : "bg-[var(--destructive)] text-[var(--primary-foreground)]",
        )}
      >
        {question.questionNumber}
      </span>

      <div className="min-w-0 flex-1 space-y-1">
        <p className="text-13 text-foreground">{question.prompt}</p>
        <p className="text-2xs text-muted-foreground">
          {t("exam.result.yourAnswerIs", {
            answer: answer || t("exam.paper.notAnswered"),
          })}
        </p>
        {/*
          The key appears only when the payload carried one — which the server
          does only when `showCorrectAnswers` is on. There is no client-side
          switch here to get wrong.
        */}
        {key ? (
          <p className="text-2xs text-success">{t("exam.result.correctAnswerIs", { answer: key })}</p>
        ) : null}
        {question.feedback ? (
          <p className="text-2xs text-foreground">{question.feedback}</p>
        ) : null}
      </div>

      <span className="shrink-0 text-2xs tabular-nums text-muted-foreground">
        {question.pointsAwarded} / {question.points}
      </span>
    </div>
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
