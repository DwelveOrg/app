"use client";

import { useEffect, useMemo, useRef } from "react";
import { ChevronLeft, ChevronRight, Send } from "lucide-react";
import { useReducedMotion } from "motion/react";
import { useTranslation } from "react-i18next";

import MaterialPanel from "@/components/tests/paper/MaterialPanel";
import QuestionView from "@/components/tests/paper/QuestionView";
import { Button } from "@/components/ui/Button";
import type { PaperItem } from "@/lib/tests/paper.schemas";
import { cn } from "@/lib/utils";
import ReviewToggle from "./ReviewToggle";
import type { ExamEnvironmentProps } from "./types";

export default function IeltsEnvironment({
  items,
  index,
  answers,
  flagged,
  onAnswer,
  onToggleFlag,
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

  const parts = useMemo(() => groupBySection(items), [items]);
  const currentPartIndex = Math.max(
    0,
    parts.findIndex((part) => part.items.some((item) => item.index === index)),
  );
  const part = parts[currentPartIndex];
  const isLastPart = currentPartIndex >= parts.length - 1;
  const passagePaneRef = useRef<HTMLElement | null>(null);
  const questionPaneRef = useRef<HTMLElement | null>(null);
  const previousPartRef = useRef(currentPartIndex);

  const materials = useMemo(() => {
    const seen = new Set<string>();
    return (part?.items ?? []).flatMap((item) => {
      if (!item.material || seen.has(item.material.id)) return [];
      seen.add(item.material.id);
      return [item.material];
    });
  }, [part]);

  const goToPart = (nextPart: number) => {
    const target = parts[nextPart]?.items[0];
    if (target) goTo(target.index);
  };

  useEffect(() => {
    if (previousPartRef.current !== currentPartIndex) {
      passagePaneRef.current?.scrollTo({ top: 0, behavior: "auto" });
      previousPartRef.current = currentPartIndex;
    }

    const target = questionPaneRef.current?.querySelector<HTMLElement>(
      `[data-question-index="${index}"]`,
    );
    target?.scrollIntoView({
      behavior: reduced ? "auto" : "smooth",
      block: "nearest",
    });
  }, [currentPartIndex, index, reduced]);

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-background text-foreground">
      <header className="flex shrink-0 flex-wrap items-center gap-x-4 gap-y-1 border-b border-border bg-card px-4 py-2.5">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-foreground">
            {part?.title || t("exam.ielts.part", { number: currentPartIndex + 1 })}
          </p>
          <p className="truncate text-2xs text-muted-foreground">
            {part
              ? t("exam.ielts.questionRange", {
                  from: part.items[0].index + 1,
                  to: part.items[part.items.length - 1].index + 1,
                })
              : null}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {timer}
          {saveStatus}
          {appearanceMenu}
          <Button
            type="button"
            size="sm"
            loading={submitting}
            onClick={onRequestSubmit}
          >
            <Send className="size-3.5" />
            {t("exam.runtime.submit")}
          </Button>
        </div>
      </header>

      {part?.instructions ? (
        <p className="shrink-0 border-b border-border bg-muted px-4 py-2 text-13 text-foreground">
          {part.instructions}
        </p>
      ) : null}

      <div className="grid min-h-0 flex-1 grid-cols-1 grid-rows-2 divide-border lg:grid-cols-2 lg:grid-rows-1 lg:divide-x">
        <section
          ref={passagePaneRef}
          className="content-scroll min-h-0 overflow-y-auto px-5 py-6 lg:px-8"
        >
          {materials.length ? (
            <div className="space-y-6">
              {materials.map((material) => (
                <MaterialPanel
                  key={material.id}
                  material={material}
                  className="exam-prose border-0 bg-transparent p-0"
                  labelled={usesParagraphLabels(material)}
                />
              ))}
            </div>
          ) : (
            <p className="exam-prose max-w-[62ch] text-muted-foreground">
              {t("exam.ielts.noPassage")}
            </p>
          )}
        </section>

        <section
          ref={questionPaneRef}
          className="content-scroll min-h-0 overflow-y-auto px-5 py-6 lg:px-8"
          aria-label={part?.title}
        >
          <ol className="mx-auto max-w-[46rem] space-y-7">
            {(part?.items ?? []).map((item) => (
              <li
                key={item.question.id}
                id={`ielts-question-${item.index}`}
                data-question-index={item.index}
                className={cn(
                  "scroll-mt-4 rounded-xl border p-4 transition-colors",
                  item.index === index
                    ? "border-primary/45 bg-[color-mix(in_srgb,var(--primary)_5%,transparent)]"
                    : "border-transparent",
                )}
              >
                <div className="mb-3 flex flex-wrap items-center gap-3">
                  <span className="grid size-7 shrink-0 place-items-center rounded-full border border-border text-13 font-bold tabular-nums text-foreground">
                    {item.index + 1}
                  </span>
                  <ReviewToggle
                    pressed={flagged.has(item.question.id)}
                    onToggle={() => onToggleFlag(item.question.id)}
                    label={t("exam.ielts.review")}
                    pressedLabel={t("exam.ielts.reviewed")}
                    disabled={submitting || (!allowBack && item.index < index)}
                  />
                </div>

                <QuestionView
                  question={item.question}
                  mode="answer"
                  value={answers.get(item.question.id) ?? null}
                  onChange={(value) => onAnswer(item.question.id, value)}
                  disabled={submitting || (!allowBack && item.index < index)}
                  displayNumber={item.index + 1}
                  hideMeta
                />
              </li>
            ))}
          </ol>
        </section>
      </div>

      <footer className="shrink-0 border-t border-border bg-card">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="content-scroll flex min-w-0 flex-1 items-center gap-3 overflow-x-auto pb-1">
            {parts.map((entry, partIndex) => {
              const partLocked = !allowBack && entry.items[0].index < index;

              return (
                <div key={entry.id} className="flex shrink-0 items-center gap-1.5">
                  <button
                    type="button"
                    disabled={partLocked}
                    onClick={() => goToPart(partIndex)}
                    className={cn(
                      "interactive-flat shrink-0 cursor-pointer rounded-md px-2 py-1 text-2xs font-bold whitespace-nowrap outline-none",
                      "focus-visible:ring-2 focus-visible:ring-ring/50",
                      partIndex === currentPartIndex
                        ? "bg-foreground text-background"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground",
                      partLocked && "cursor-not-allowed opacity-40",
                    )}
                  >
                    {t("exam.ielts.partShort", { number: partIndex + 1 })}
                  </button>

                  {entry.items.map((item) => {
                    const state = navigatorEntries[item.index];
                    const locked = !allowBack && item.index < index;

                    return (
                      <button
                        key={item.question.id}
                        type="button"
                        disabled={locked}
                        aria-current={item.index === index ? "true" : undefined}
                        aria-label={t(
                          state?.answered
                            ? "exam.runtime.jumpAnswered"
                            : "exam.runtime.jumpUnanswered",
                          { number: item.index + 1 },
                        )}
                        onClick={() => goTo(item.index)}
                        className={cn(
                          "interactive-flat relative grid size-7 shrink-0 cursor-pointer place-items-center rounded",
                          "text-2xs font-semibold tabular-nums outline-none",
                          "focus-visible:ring-2 focus-visible:ring-ring/50",
                          state?.answered
                            ? "bg-primary text-primary-foreground"
                            : "border border-border text-muted-foreground hover:border-primary/40",
                          item.index === index &&
                            "ring-2 ring-ring ring-offset-1 ring-offset-card",
                          state?.flagged &&
                            "underline decoration-warning decoration-2 underline-offset-2",
                          locked && "cursor-not-allowed opacity-40",
                        )}
                      >
                        {item.index + 1}
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>

          <div className="flex shrink-0 items-center gap-1.5">
            {allowBack ? (
              <Button
                type="button"
                variant="outline"
                size="icon-sm"
                aria-label={t("exam.runtime.previous")}
                disabled={currentPartIndex === 0}
                onClick={() => goToPart(currentPartIndex - 1)}
              >
                <ChevronLeft />
              </Button>
            ) : null}
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              aria-label={t("exam.runtime.next")}
              disabled={isLastPart}
              onClick={() => goToPart(currentPartIndex + 1)}
            >
              <ChevronRight />
            </Button>
          </div>
        </div>
      </footer>
    </div>
  );
}

type Part = {
  id: string;
  title: string;
  instructions: string | null;
  items: PaperItem[];
};

function groupBySection(items: PaperItem[]): Part[] {
  const parts: Part[] = [];

  for (const item of items) {
    const last = parts[parts.length - 1];
    if (last && last.id === item.section.id) {
      last.items.push(item);
      continue;
    }
    parts.push({
      id: item.section.id,
      title: item.section.title,
      instructions: item.section.instructions ?? null,
      items: [item],
    });
  }

  return parts;
}

function usesParagraphLabels(material: PaperItem["material"]): boolean {
  return Boolean(
    material?.questions.some(
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
