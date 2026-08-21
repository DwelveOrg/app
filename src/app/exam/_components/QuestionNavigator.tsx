"use client";

import { Flag } from "lucide-react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

export type NavigatorEntry = {
  questionId: string;
  number: number;
  answered: boolean;
  flagged: boolean;
};

export default function QuestionNavigator({
  entries,
  currentIndex,
  onJump,
  className,
  lockedBefore,
  showLegend = true,
}: {
  entries: NavigatorEntry[];
  /** `-1` in the scrolling layout, where nothing is singled out. */
  currentIndex: number;
  onJump: (index: number) => void;
  className?: string;
  lockedBefore?: number;
  showLegend?: boolean;
}) {
  const { t } = useTranslation();
  const answered = entries.filter((entry) => entry.answered).length;

  return (
    <nav aria-label={t("exam.runtime.navigatorLabel")} className={cn("space-y-2", className)}>
      {showLegend ? (
        <p className="type-micro text-muted-foreground">
          {t("exam.runtime.answeredOf", { answered, total: entries.length })}
        </p>
      ) : null}

      <ul className="grid grid-cols-[repeat(auto-fill,minmax(2.25rem,1fr))] gap-1.5">
        {entries.map((entry, index) => {
          const current = index === currentIndex;
          const locked = lockedBefore !== undefined && index < lockedBefore;

          return (
            <li key={entry.questionId}>
              <button
                type="button"
                disabled={locked}
                aria-current={current ? "true" : undefined}
                aria-label={t(
                  entry.answered
                    ? "exam.runtime.jumpAnswered"
                    : "exam.runtime.jumpUnanswered",
                  { number: entry.number },
                )}
                onClick={() => onJump(index)}
                className={cn(
                  "interactive-flat relative grid h-9 w-full cursor-pointer place-items-center rounded-md",
                  "numeric text-13 font-semibold outline-none",
                  "focus-visible:ring-2 focus-visible:ring-ring/50",
                  entry.answered
                    ? "bg-primary text-primary-foreground hover:bg-primary-hover"
                    : "border border-dashed border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground",
                  current && "ring-2 ring-ring ring-offset-2 ring-offset-card",
                  locked && "cursor-not-allowed opacity-40 hover:border-border",
                )}
              >
                {entry.number}
                {entry.flagged ? (
                  <Flag
                    aria-hidden="true"
                    className="absolute -top-0.5 -right-0.5 size-3 fill-warning text-warning"
                  />
                ) : null}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
