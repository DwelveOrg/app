"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useReducedMotion } from "motion/react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";

import { readSafeActionData } from "@/lib/actions/read-safe-action-result";
import { isAnswered, type AnswerValue } from "@/lib/tests/answers";
import { flattenPaper } from "@/lib/tests/paper.schemas";
import { DUR, EASE_OUT } from "@/lib/motion";
import { submitAttemptAction } from "../_lib/attempts.actions";
import type { AttemptResponse } from "../_lib/attempts.schemas";
import { environmentForFormat } from "../_lib/exam-environment";
import { useAnswerAutosave } from "../_hooks/useAnswerAutosave";
import { useAttemptClock } from "../_hooks/useAttemptClock";
import { useExamAppearance } from "../_hooks/useExamAppearance";
import { useIntegrityGuard } from "../_hooks/useIntegrityGuard";
import AttemptTimer from "./AttemptTimer";
import ExamAppearanceMenu from "./ExamAppearanceMenu";
import IntegrityOverlay from "./IntegrityOverlay";
import type { NavigatorEntry } from "./QuestionNavigator";
import SaveIndicator from "./SaveIndicator";
import SubmitDialog from "./SubmitDialog";
import IeltsEnvironment from "./environments/IeltsEnvironment";
import QuizEnvironment from "./environments/QuizEnvironment";
import SatEnvironment from "./environments/SatEnvironment";
import type { ExamEnvironmentProps } from "./environments/types";

export default function AttemptRuntime({ initial }: { initial: AttemptResponse }) {
  const { t } = useTranslation();
  const router = useRouter();
  const reduced = useReducedMotion();

  const { attempt, test } = initial;
  const delivery = test.delivery;
  const environment = environmentForFormat(test.format);
  const { appearance, setTheme, setTextSize } = useExamAppearance(environment);

  const items = useMemo(() => flattenPaper(test), [test]);

  const [answers, setAnswers] = useState<Map<string, AnswerValue | null>>(
    () => new Map(initial.answers.map((entry) => [entry.questionId, entry.value])),
  );
  const [flagged, setFlagged] = useState<Set<string>>(new Set());
  const [crossedOut, setCrossedOut] = useState<Map<string, Set<string>>>(new Map());
  const [index, setIndex] = useState(0);
  /** `1` forward, `-1` back — the paper turns the way the student pressed. */
  const [direction, setDirection] = useState(1);
  const [submitOpen, setSubmitOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const submittingRef = useRef(false);

  const autosave = useAnswerAutosave(attempt.id);

  /* --- Submitting --------------------------------------------------------- */

  /**
   * Held in a ref because the clock's expiry callback is registered once. The
   * alternative — rebuilding the interval whenever `submit` changes identity —
   * would reset the countdown on every keystroke in an essay.
   */
  const submitRef = useRef<(reason: "student" | "expiry" | "integrity") => void>(() => {});

  const submit = useCallback(
    async (reason: "student" | "expiry" | "integrity") => {
      if (submittingRef.current) return;
      submittingRef.current = true;
      setSubmitting(true);

      const saved = await autosave.flushNow();
      if (!saved && reason === "student") {
        submittingRef.current = false;
        setSubmitting(false);
        toast.error(t("exam.errors.saveFailed"));
        return;
      }

      try {
        const result = readSafeActionData(
          await submitAttemptAction({ attemptId: attempt.id }),
          "exam.errors.generic",
        );

        if (reason === "expiry") toast.info(t("exam.runtime.autoSubmitted"));
        router.replace(
          result.resultAvailable
            ? `/exam/${test.id}/result/${attempt.id}`
            : `/exam/${test.id}/submitted`,
        );
      } catch (error) {
        submittingRef.current = false;
        setSubmitting(false);
        toast.error(
          error instanceof Error ? t(error.message, { defaultValue: error.message }) : "",
        );
      }
    },
    [attempt.id, autosave, router, t, test.id],
  );

  useEffect(() => {
    submitRef.current = (reason) => void submit(reason);
  });

  const clock = useAttemptClock({
    expiresAt: attempt.expiresAt,
    serverTime: attempt.serverTime,
    warnAtMinutes: delivery.timeWarningMinutes,
    onExpire: () => {
      /*
       * A courtesy, not the rule. The server rejects a write past `expiresAt`
       * regardless (`§B.5`); submitting here is what turns "your answers are
       * refused" into "your answers were handed in", which is the difference
       * between a student being marked and a student losing an hour of work.
       */
      if (delivery.autoSubmitOnExpiry) submitRef.current("expiry");
    },
  });

  const integrity = useIntegrityGuard({
    attemptId: attempt.id,
    delivery,
    active: !submitting,
    onEnded: () => submitRef.current("integrity"),
  });

  /* --- Answering ---------------------------------------------------------- */

  /**
   * `null` is a real value here: it clears the answer. Emptying a numeric field
   * must reach the server as "no answer" rather than as an empty object, which
   * the backend's validator rejects.
   */
  const answer = useCallback(
    (questionId: string, value: AnswerValue | null) => {
      setAnswers((current) => new Map(current).set(questionId, value));
      autosave.queue(questionId, value);
    },
    [autosave],
  );

  const goTo = useCallback(
    (next: number) => {
      if (next < 0 || next >= items.length) return;
      setDirection(next > index ? 1 : -1);
      setIndex(next);

      void autosave.flushNow();

    },
    [autosave, index, items.length],
  );

  const navigatorEntries = useMemo<NavigatorEntry[]>(
    () =>
      items.map((item) => ({
        questionId: item.question.id,
        number: item.index + 1,
        answered: isAnswered(item.question.answerKind, answers.get(item.question.id)),
        flagged: flagged.has(item.question.id),
      })),
    [items, answers, flagged],
  );

  const unanswered = navigatorEntries.filter((entry) => !entry.answered).length;

  const toggleFlag = useCallback(
    (questionId: string) =>
      setFlagged((current) => {
        const next = new Set(current);
        if (next.has(questionId)) next.delete(questionId);
        else next.add(questionId);
        return next;
      }),
    [],
  );

  const toggleCrossOut = useCallback((questionId: string, optionId: string) => {
    setCrossedOut((current) => {
      const next = new Map(current);
      const forQuestion = new Set(next.get(questionId) ?? []);
      if (forQuestion.has(optionId)) forQuestion.delete(optionId);
      else forQuestion.add(optionId);
      next.set(questionId, forQuestion);
      return next;
    });
  }, []);

  /* --- Render ------------------------------------------------------------- */

  const environmentProps: ExamEnvironmentProps = {
    test,
    items,
    index,
    direction,
    answers,
    flagged,
    crossedOut,
    onAnswer: answer,
    onToggleFlag: toggleFlag,
    onToggleCrossOut: toggleCrossOut,
    goTo,
    navigatorEntries,
    unanswered,
    submitting,
    onRequestSubmit: () => setSubmitOpen(true),
    allowBack: delivery.allowBackNavigation,
    timer: delivery.showTimer ? (
      <AttemptTimer remaining={clock.remaining} warning={clock.warning} />
    ) : null,
    saveStatus: (
      <SaveIndicator state={autosave.state} savedAt={autosave.savedAt} />
    ),
    appearanceMenu: (
      <ExamAppearanceMenu
        appearance={appearance}
        onThemeChange={setTheme}
        onTextSizeChange={setTextSize}
      />
    ),
  };

  const Environment =
    environment === "sat"
      ? SatEnvironment
      : environment === "ielts"
        ? IeltsEnvironment
        : QuizEnvironment;

  useEffect(() => {
    const { body } = document;
    body.dataset.examTheme = appearance.theme;
    body.dataset.examSize = appearance.textSize;
    return () => {
      delete body.dataset.examTheme;
      delete body.dataset.examSize;
    };
  }, [appearance.theme, appearance.textSize]);

  return (
    <div
      data-exam-theme={appearance.theme}
      data-exam-size={appearance.textSize}
      className="contents"
    >
      <Environment {...environmentProps} />

      <SubmitDialog
        open={submitOpen}
        onOpenChange={setSubmitOpen}
        unanswered={unanswered}
        total={items.length}
        pending={submitting}
        onConfirm={() => void submit("student")}
      />

      <IntegrityOverlay
        notice={integrity.notice}
        onDismiss={integrity.dismissNotice}
        transition={{ duration: DUR.reveal, ease: EASE_OUT }}
        reduced={reduced}
      />
    </div>
  );
}
