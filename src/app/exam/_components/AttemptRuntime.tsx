"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Flag,
  Send,
} from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";

import { readSafeActionData } from "@/lib/actions/read-safe-action-result";
import QuestionView from "@/components/tests/paper/QuestionView";
import MaterialPanel from "@/components/tests/paper/MaterialPanel";
import { Button } from "@/components/ui/Button";
import Surface from "@/components/ui/Surface";
import { isAnswered, type AnswerValue } from "@/lib/tests/answers";
import { flattenPaper, type PaperItem, type PaperMaterial } from "@/lib/tests/paper.schemas";
import { DUR, EASE_OUT, paperTurnVariants, stillVariants } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { submitAttemptAction } from "../_lib/attempts.actions";
import type { AttemptResponse } from "../_lib/attempts.schemas";
import { useAnswerAutosave } from "../_hooks/useAnswerAutosave";
import { useAttemptClock } from "../_hooks/useAttemptClock";
import { useIntegrityGuard } from "../_hooks/useIntegrityGuard";
import AttemptTimer from "./AttemptTimer";
import ExamTopBar from "./ExamTopBar";
import IntegrityOverlay from "./IntegrityOverlay";
import QuestionNavigator, { type NavigatorEntry } from "./QuestionNavigator";
import SaveIndicator from "./SaveIndicator";
import SubmitDialog from "./SubmitDialog";

/**
 * A live attempt.
 *
 * ## Where the answers live
 *
 * In one `useState` map keyed by question id, and in the autosave's pending
 * map. Not in a form library: there is no validation to run, no submit to
 * assemble, and the interesting behaviour is entirely about *when* a value
 * reaches the server rather than what shape it is. A map plus
 * {@link useAnswerAutosave} says that directly.
 *
 * ## Two layouts, one paper
 *
 * `ALL_AT_ONCE` scrolls the whole paper with each passage sticky beside its own
 * questions — the arrangement a printed paper has, and the reason a student can
 * answer question six about a passage without having lost the passage.
 * `ONE_AT_A_TIME` shows a single question, and honours `allowBackNavigation` by
 * removing Back rather than disabling it: a permanently disabled control is a
 * promise the exam is not going to keep.
 *
 * Both render `QuestionView`, which is also what the teacher marks against.
 */
export default function AttemptRuntime({ initial }: { initial: AttemptResponse }) {
  const { t } = useTranslation();
  const router = useRouter();
  const reduced = useReducedMotion();

  const { attempt, test } = initial;
  const delivery = test.delivery;
  const oneAtATime = delivery.navigationMode === "ONE_AT_A_TIME";

  const items = useMemo(() => flattenPaper(test), [test]);

  const [answers, setAnswers] = useState<Map<string, AnswerValue | null>>(
    () => new Map(initial.answers.map((entry) => [entry.questionId, entry.value])),
  );
  const [flagged, setFlagged] = useState<Set<string>>(new Set());
  const [index, setIndex] = useState(0);
  /** `1` forward, `-1` back — the paper turns the way the student pressed. */
  const [direction, setDirection] = useState(1);
  const [submitOpen, setSubmitOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

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
      if (submitting) return;
      setSubmitting(true);

      // Everything typed but not yet sent goes first. Submitting over a pending
      // batch is how a student loses the last question they answered.
      await autosave.flushNow();

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
        setSubmitting(false);
        toast.error(
          error instanceof Error ? t(error.message, { defaultValue: error.message }) : "",
        );
      }
    },
    [attempt.id, autosave, router, submitting, t, test.id],
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

      if (oneAtATime) {
        // Send what is pending before the question leaves the screen: in
        // one-at-a-time the student may never scroll back to notice it failed.
        void autosave.flushNow();
      } else {
        const element = document.getElementById(`question-${items[next].question.id}`);
        element?.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
      }
    },
    [autosave, index, items, oneAtATime, reduced],
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

  const toggleFlag = (questionId: string) =>
    setFlagged((current) => {
      const next = new Set(current);
      if (next.has(questionId)) next.delete(questionId);
      else next.add(questionId);
      return next;
    });

  /* --- Render ------------------------------------------------------------- */

  const renderQuestion = (item: PaperItem) => (
    <Surface key={item.question.id} padding="md" className="space-y-3">
      <QuestionView
        question={item.question}
        mode="answer"
        value={answers.get(item.question.id) ?? null}
        onChange={(value) => answer(item.question.id, value)}
        disabled={submitting}
        // Position, not the canonical number: under `shuffleQuestions` the
        // server keeps each question's original number, and a paper that
        // opened at question 14 would read as broken.
        displayNumber={item.index + 1}
      />

      <div className="flex justify-end border-t border-border pt-2">
        <Button
          type="button"
          size="xs"
          variant="ghost"
          aria-pressed={flagged.has(item.question.id)}
          className={cn(
            "text-muted-foreground",
            flagged.has(item.question.id) && "text-warning",
          )}
          onClick={() => toggleFlag(item.question.id)}
        >
          <Flag
            className={cn("size-3", flagged.has(item.question.id) && "fill-warning")}
          />
          {flagged.has(item.question.id)
            ? t("exam.runtime.flagged")
            : t("exam.runtime.flag")}
        </Button>
      </div>
    </Surface>
  );

  const current = items[index];

  return (
    <>
      <ExamTopBar
        title={test.title}
        subtitle={t("exam.runtime.questionOf", {
          number: (current?.index ?? 0) + 1,
          total: items.length,
        })}
        status={
          <>
            {delivery.showTimer ? (
              <AttemptTimer remaining={clock.remaining} warning={clock.warning} />
            ) : null}
            <SaveIndicator state={autosave.state} savedAt={autosave.savedAt} />
          </>
        }
        actions={
          <Button
            type="button"
            size="sm"
            loading={submitting}
            onClick={() => setSubmitOpen(true)}
          >
            <Send />
            {t("exam.runtime.submit")}
          </Button>
        }
      />

      <div className="mx-auto flex w-full max-w-[1400px] flex-1 gap-6 px-4 py-6 md:px-6">
        <main className="min-w-0 flex-1">
          {oneAtATime ? (
            <div className="space-y-4">
              {current?.material ? (
                <MaterialPanel
                  material={current.material}
                  labelled={usesParagraphLabels(current.material)}
                />
              ) : null}

              <AnimatePresence mode="wait" custom={direction} initial={false}>
                <motion.div
                  key={current?.question.id}
                  custom={direction}
                  variants={reduced ? stillVariants : paperTurnVariants}
                  initial="hidden"
                  animate="shown"
                  exit="exit"
                >
                  {current ? renderQuestion(current) : null}
                </motion.div>
              </AnimatePresence>

              <div className="flex items-center justify-between gap-3">
                {/*
                  Back is *removed* when the delivery forbids it, not disabled.
                  A greyed-out Back button on question 7 of 40 tells a student
                  the exam might let them go back later, and they will keep
                  pressing it. Absence is unambiguous.
                */}
                {delivery.allowBackNavigation ? (
                  <Button
                    type="button"
                    variant="outline"
                    disabled={index === 0}
                    onClick={() => goTo(index - 1)}
                  >
                    <ChevronLeft />
                    {t("exam.runtime.previous")}
                  </Button>
                ) : (
                  <span />
                )}

                {index < items.length - 1 ? (
                  <Button type="button" onClick={() => goTo(index + 1)}>
                    {t("exam.runtime.next")}
                    <ChevronRight />
                  </Button>
                ) : (
                  <Button type="button" onClick={() => setSubmitOpen(true)}>
                    <Send />
                    {t("exam.runtime.finish")}
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <ScrollingPaper items={items} render={renderQuestion} />
          )}
        </main>

        {/*
          The navigator is a column on a wide screen and a sheet below it. It is
          never removed at small sizes: knowing what you have not answered is
          not a desktop luxury, and a phone is where a student is most likely to
          have scrolled past something.
        */}
        <aside className="hidden w-64 shrink-0 lg:block">
          <div className="sticky top-6 space-y-4">
            <Surface padding="md">
              <QuestionNavigator
                entries={navigatorEntries}
                currentIndex={oneAtATime ? index : -1}
                onJump={goTo}
              />
            </Surface>

            {unanswered > 0 ? (
              <p className="flex items-start gap-2 px-1 text-2xs text-muted-foreground">
                <AlertTriangle className="mt-px size-3.5 shrink-0 text-warning" aria-hidden="true" />
                {t("exam.runtime.unansweredHint", { count: unanswered })}
              </p>
            ) : null}
          </div>
        </aside>
      </div>

      {/* Below `lg` the navigator lives in a bar pinned to the bottom. */}
      <div className="sticky bottom-0 z-20 border-t border-border bg-card/95 px-4 py-3 backdrop-blur lg:hidden">
        <QuestionNavigator
          entries={navigatorEntries}
          currentIndex={oneAtATime ? index : -1}
          onJump={goTo}
          className="max-h-32 overflow-y-auto"
        />
      </div>

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
    </>
  );
}

/**
 * The whole paper, with each passage sticky beside the questions about it.
 *
 * Grouped by material rather than rendered as one flat list, because the
 * sticky column has to end where the passage stops being relevant. A single
 * sticky panel for the whole paper would follow the student into the next
 * passage's questions and show them the wrong text.
 */
function ScrollingPaper({
  items,
  render,
}: {
  items: PaperItem[];
  render: (item: PaperItem) => React.ReactNode;
}) {
  const blocks = useMemo(() => groupByMaterial(items), [items]);

  return (
    <div className="space-y-8">
      {blocks.map((block, blockIndex) => {
        const questions = <div className="space-y-4">{block.items.map(render)}</div>;

        if (!block.material) {
          return (
            <section key={`plain-${blockIndex}`} className="space-y-4">
              {questions}
            </section>
          );
        }

        return (
          <section
            key={block.material.id}
            className="gap-6 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]"
          >
            <div className="mb-4 lg:sticky lg:top-6 lg:mb-0 lg:max-h-[calc(100dvh-4rem)] lg:self-start lg:overflow-y-auto">
              <MaterialPanel
                material={block.material}
                labelled={usesParagraphLabels(block.material)}
              />
            </div>
            {questions}
          </section>
        );
      })}
    </div>
  );
}

function groupByMaterial(items: PaperItem[]) {
  const blocks: { material: PaperMaterial | null; items: PaperItem[] }[] = [];

  for (const item of items) {
    const last = blocks[blocks.length - 1];
    if (last && last.material === item.material) last.items.push(item);
    else blocks.push({ material: item.material, items: [item] });
  }

  return blocks;
}

/**
 * Whether to mark the passage's paragraphs A, B, C.
 *
 * Only when a question actually refers to them — a matching question whose
 * right-hand pool is single letters is the matching-headings shape. Labelling
 * every passage would put letters down the margin of an ordinary reading text
 * for no reason, which reads as an instruction the student cannot find.
 */
function usesParagraphLabels(material: PaperMaterial): boolean {
  return material.questions.some(
    (question) =>
      question.answerKind === "MATCHING" &&
      (question.config?.rightItems ?? []).every((item) => item.key.length === 1),
  );
}
