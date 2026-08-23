"use client";

import { ChevronLeft, ChevronRight, ChevronUp, Eye, EyeOff, Send } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import MaterialPanel from "@/components/tests/paper/MaterialPanel";
import QuestionView from "@/components/tests/paper/QuestionView";
import { Button } from "@/components/ui/Button";
import { paperTurnVariants, stillVariants } from "@/lib/motion";
import { cn } from "@/lib/utils";
import ExamPopover from "../ExamPopover";
import QuestionNavigator from "../QuestionNavigator";
import CrossOutRail from "./CrossOutRail";
import ReviewToggle from "./ReviewToggle";
import type { ExamEnvironmentProps } from "./types";

export default function SatEnvironment({
  items,
  index,
  direction,
  answers,
  flagged,
  crossedOut,
  onAnswer,
  onToggleFlag,
  onToggleCrossOut,
  goTo,
  navigatorEntries,
  submitting,
  onRequestSubmit,
  allowBack,
  timer,
  saveStatus,
  appearanceMenu,
}: ExamEnvironmentProps) {
  const { t } = useTranslation();
  const reduced = useReducedMotion();
  const [timerHidden, setTimerHidden] = useState(false);

  const current = items[index];
  const total = items.length;
  const isLast = index >= total - 1;
  const sectionTitle = current?.section.title ?? "";
  const materialPaneRef = useRef<HTMLElement | null>(null);
  const questionPaneRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const behavior = reduced ? "auto" : "smooth";
    materialPaneRef.current?.scrollTo({ top: 0, behavior });
    questionPaneRef.current?.scrollTo({ top: 0, behavior });
  }, [current?.question.id, reduced]);

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-background text-foreground">
      <header className="grid shrink-0 grid-cols-[1fr_auto_1fr] items-center gap-3 border-b border-border bg-card px-4 py-2.5">
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-foreground">
            {sectionTitle || t("exam.sat.section")}
          </p>
          <p className="truncate text-2xs text-muted-foreground">
            {t("exam.sat.questionOf", { number: index + 1, total })}
          </p>
        </div>

        <div className="flex items-center justify-center gap-2">
          {timer ? (
            <>
              <div className={cn(timerHidden && "sr-only")}>{timer}</div>
              <button
                type="button"
                onClick={() => setTimerHidden((hidden) => !hidden)}
                className="interactive-flat inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-2 py-1 text-2xs font-medium text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50"
              >
                {timerHidden ? (
                  <Eye className="size-3.5" aria-hidden="true" />
                ) : (
                  <EyeOff className="size-3.5" aria-hidden="true" />
                )}
                {timerHidden ? t("exam.sat.showTimer") : t("exam.sat.hideTimer")}
              </button>
            </>
          ) : null}
          {saveStatus}
        </div>

        <div className="flex items-center justify-end gap-1">{appearanceMenu}</div>
      </header>

      <div className="grid min-h-0 flex-1 grid-cols-1 grid-rows-2 divide-border lg:grid-cols-2 lg:grid-rows-1 lg:divide-x">
        <section
          ref={materialPaneRef}
          className="content-scroll min-h-0 overflow-y-auto px-5 py-6 lg:px-8"
        >
          {current?.material ? (
            <MaterialPanel
              material={current.material}
              className="exam-prose border-0 bg-transparent p-0"
              labelled={usesParagraphLabels(current)}
            />
          ) : (
            <p className="exam-prose max-w-[62ch] text-muted-foreground">
              {current?.section.instructions || t("exam.sat.noStimulus")}
            </p>
          )}
        </section>

        <section
          ref={questionPaneRef}
          className="content-scroll min-h-0 overflow-y-auto px-5 py-6 lg:px-8"
        >
          <div className="mx-auto max-w-[46rem]">
            <div className="mb-4 flex flex-wrap items-center gap-3 border-b border-border pb-3">
              <span className="grid size-7 shrink-0 place-items-center rounded bg-foreground text-13 font-bold numeric text-background">
                {index + 1}
              </span>

              <ReviewToggle
                pressed={current ? flagged.has(current.question.id) : false}
                onToggle={() => current && onToggleFlag(current.question.id)}
                label={t("exam.sat.markForReview")}
                pressedLabel={t("exam.sat.markedForReview")}
                disabled={submitting}
              />

              {current?.question.options.length ? (
                <CrossOutRail
                  className="ml-auto"
                  questionId={current.question.id}
                  options={current.question.options}
                  crossed={crossedOut.get(current.question.id)}
                  onToggle={onToggleCrossOut}
                />
              ) : null}
            </div>

            <AnimatePresence mode="wait" custom={direction} initial={false}>
              <motion.div
                key={current?.question.id}
                custom={direction}
                variants={reduced ? stillVariants : paperTurnVariants}
                initial="hidden"
                animate="shown"
                exit="exit"
                className="exam-prose"
              >
                {current ? (
                  <QuestionView
                    question={current.question}
                    mode="answer"
                    value={answers.get(current.question.id) ?? null}
                    onChange={(value) => onAnswer(current.question.id, value)}
                    disabled={submitting}
                    displayNumber={index + 1}
                    hideMeta
                    struckOptionIds={crossedOut.get(current.question.id)}
                  />
                ) : null}
              </motion.div>
            </AnimatePresence>
          </div>
        </section>
      </div>

      <footer className="flex shrink-0 items-center justify-between gap-3 border-t border-border bg-card px-4 py-2.5">
        <Button
          type="button"
          variant="outline"
          size="sm"
          loading={submitting}
          onClick={onRequestSubmit}
        >
          <Send className="size-3.5" />
          {t("exam.runtime.submit")}
        </Button>

        <ExamPopover
          side="top"
          align="center"
          panelClassName="w-[min(30rem,calc(100vw-2rem))]"
          trigger={({ open }) => (
            <>
              {t("exam.sat.questionOf", { number: index + 1, total })}
              <ChevronUp
                className={cn("size-3.5 transition-transform", open && "rotate-180")}
                aria-hidden="true"
              />
            </>
          )}
        >
          {({ close }) => (
            <QuestionNavigator
              entries={navigatorEntries}
              currentIndex={index}
              lockedBefore={allowBack ? undefined : index}
              onJump={(next) => {
                goTo(next);
                close();
              }}
            />
          )}
        </ExamPopover>

        <div className="flex items-center gap-2">
          {allowBack ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={index === 0}
              onClick={() => goTo(index - 1)}
            >
              <ChevronLeft className="size-3.5" />
              {t("exam.runtime.previous")}
            </Button>
          ) : null}

          {isLast ? (
            <Button type="button" size="sm" onClick={onRequestSubmit}>
              {t("exam.runtime.finish")}
            </Button>
          ) : (
            <Button type="button" size="sm" onClick={() => goTo(index + 1)}>
              {t("exam.runtime.next")}
              <ChevronRight className="size-3.5" />
            </Button>
          )}
        </div>
      </footer>
    </div>
  );
}

function usesParagraphLabels(item: { material: { questions: { answerKind: string; config?: { rightItems?: { key: string }[] } | null }[] } | null }) {
  return Boolean(
    item.material?.questions.some(
      (question) => {
        const rightItems = question.config?.rightItems ?? [];
        return (
          question.answerKind === "MATCHING" &&
          rightItems.length > 0 &&
          rightItems.every((entry) => entry.key.length === 1)
        );
      },
    ),
  );
}
