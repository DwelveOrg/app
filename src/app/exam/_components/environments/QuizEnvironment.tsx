"use client";

import { useEffect, useMemo, useRef } from "react";
import { AlertTriangle, ChevronLeft, ChevronRight, ChevronUp, Send } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useTranslation } from "react-i18next";

import MaterialPanel from "@/components/tests/paper/MaterialPanel";
import QuestionView from "@/components/tests/paper/QuestionView";
import { Button } from "@/components/ui/Button";
import Surface from "@/components/ui/Surface";
import type { PaperItem, PaperMaterial } from "@/lib/tests/paper.schemas";
import { paperTurnVariants, stillVariants } from "@/lib/motion";
import { cn } from "@/lib/utils";
import ExamPopover from "../ExamPopover";
import QuestionNavigator from "../QuestionNavigator";
import ReviewToggle from "./ReviewToggle";
import type { ExamEnvironmentProps } from "./types";

export default function QuizEnvironment({
  test,
  items,
  index,
  direction,
  answers,
  flagged,
  onAnswer,
  onToggleFlag,
  goTo,
  navigatorEntries,
  unanswered,
  submitting,
  onRequestSubmit,
  allowBack,
  timer,
  saveStatus,
  appearanceMenu,
}: ExamEnvironmentProps) {
  const { t } = useTranslation();
  const reduced = useReducedMotion();

  const oneAtATime = test.delivery.navigationMode === "ONE_AT_A_TIME";
  const current = items[index];
  const total = items.length;
  const answered = total - unanswered;
  const bodyRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (oneAtATime) {
      bodyRef.current?.scrollTo({
        top: 0,
        behavior: reduced ? "auto" : "smooth",
      });
      return;
    }

    document.getElementById(`question-${items[index]?.question.id}`)?.scrollIntoView({
      behavior: reduced ? "auto" : "smooth",
      block: "nearest",
    });
  }, [index, items, oneAtATime, reduced]);

  const renderQuestion = (item: PaperItem) => (
    <Surface key={item.question.id} padding="md" className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="numeric grid size-7 shrink-0 place-items-center rounded-[var(--radius-pill)] bg-muted text-13 font-bold text-foreground">
          {item.index + 1}
        </span>
        <ReviewToggle
          pressed={flagged.has(item.question.id)}
          onToggle={() => onToggleFlag(item.question.id)}
          label={t("exam.runtime.flag")}
          pressedLabel={t("exam.runtime.flagged")}
          disabled={submitting}
        />
      </div>

      <QuestionView
        question={item.question}
        mode="answer"
        value={answers.get(item.question.id) ?? null}
        onChange={(value) => onAnswer(item.question.id, value)}
        disabled={submitting}
        displayNumber={item.index + 1}
        hideMeta
      />
    </Surface>
  );

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-background text-foreground">
      <header className="flex shrink-0 items-center gap-3 border-b border-border bg-card px-4 py-2.5">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-foreground">{test.title}</p>
          <p className="truncate text-2xs tabular-nums text-muted-foreground">
            {oneAtATime
              ? t("exam.runtime.questionOf", { number: index + 1, total })
              : t("exam.runtime.answeredOf", { answered, total })}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {timer}
          {saveStatus}
          {appearanceMenu}
          <Button type="button" size="sm" loading={submitting} onClick={onRequestSubmit}>
            <Send className="size-3.5" />
            {t("exam.runtime.submit")}
          </Button>
        </div>
      </header>

      <div ref={bodyRef} className="content-scroll min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-[68rem] px-4 py-6 md:px-6">
          {oneAtATime ? (
            <div className="mx-auto max-w-3xl space-y-4">
              {current?.material ? (
                <MaterialPanel
                  material={current.material}
                  className="exam-prose"
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
            </div>
          ) : (
            <ScrollingPaper items={items} render={renderQuestion} />
          )}
        </div>
      </div>

      <footer className="flex shrink-0 items-center justify-between gap-3 border-t border-border bg-card px-4 py-2.5">
        {unanswered > 0 ? (
          <p className="hidden items-center gap-1.5 text-2xs text-muted-foreground sm:flex">
            <AlertTriangle className="size-3.5 shrink-0 text-warning" aria-hidden="true" />
            {t("exam.runtime.unansweredHint", { count: unanswered })}
          </p>
        ) : (
          <span />
        )}

        <ExamPopover
          side="top"
          align="center"
          panelClassName="w-[min(30rem,calc(100vw-2rem))]"
          trigger={({ open }) => (
            <>
              {oneAtATime
                ? t("exam.runtime.questionOf", { number: index + 1, total })
                : t("exam.runtime.answeredOf", { answered, total })}
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
              currentIndex={oneAtATime ? index : -1}
              lockedBefore={allowBack ? undefined : index}
              onJump={(next) => {
                goTo(next);
                close();
              }}
            />
          )}
        </ExamPopover>

        {oneAtATime ? (
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

            {index < total - 1 ? (
              <Button type="button" size="sm" onClick={() => goTo(index + 1)}>
                {t("exam.runtime.next")}
                <ChevronRight className="size-3.5" />
              </Button>
            ) : (
              <Button type="button" size="sm" onClick={onRequestSubmit}>
                {t("exam.runtime.finish")}
              </Button>
            )}
          </div>
        ) : (
          <span />
        )}
      </footer>
    </div>
  );
}

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
            <section key={`plain-${blockIndex}`} className="mx-auto max-w-3xl space-y-4">
              {questions}
            </section>
          );
        }

        return (
          <section
            key={block.material.id}
            className="gap-6 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]"
          >
            <div className="mb-4 lg:sticky lg:top-0 lg:mb-0 lg:max-h-[calc(100dvh-11rem)] lg:self-start lg:overflow-y-auto">
              <MaterialPanel
                material={block.material}
                className="exam-prose"
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

function usesParagraphLabels(material: PaperMaterial): boolean {
  return material.questions.some(
    (question) => {
      const rightItems = question.config?.rightItems ?? [];
      return (
        question.answerKind === "MATCHING" &&
        rightItems.length > 0 &&
        rightItems.every((item) => item.key.length === 1)
      );
    },
  );
}
