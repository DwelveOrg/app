"use client";

import { Flag } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

export type NavigatorEntry = {
  questionId: string;
  number: number;
  answered: boolean;
  flagged: boolean;
};

/**
 * The question grid: where you are, what you have answered, what you marked to
 * come back to.
 *
 * This is the single most useful control on the page and the one most often
 * left out. Without it a student answering question 34 has no way to know
 * whether they skipped 12, and the only remedy is to scroll the entire paper
 * before submitting — which is exactly what they will do, in the last three
 * minutes, instead of finishing.
 *
 * **Flagging is the student's own note to self.** It is deliberately not
 * reported anywhere: a "mark for review" that a teacher could see would be a
 * confession, and students would stop using it.
 *
 * Three states, and each is carried by more than colour: answered is a filled
 * chip, current has a ring, flagged has a corner mark. A student cannot be
 * assumed to see hue differences in a grid of forty small squares.
 */
export default function QuestionNavigator({
  entries,
  currentIndex,
  onJump,
  className,
}: {
  entries: NavigatorEntry[];
  /** `-1` in the scrolling layout, where nothing is singled out. */
  currentIndex: number;
  onJump: (index: number) => void;
  className?: string;
}) {
  const { t } = useTranslation();
  const answered = entries.filter((entry) => entry.answered).length;

  return (
    <nav aria-label={t("exam.runtime.navigatorLabel")} className={cn("space-y-2", className)}>
      <p className="type-micro text-muted-foreground">
        {t("exam.runtime.answeredOf", { answered, total: entries.length })}
      </p>

      <ul className="grid grid-cols-[repeat(auto-fill,minmax(2.25rem,1fr))] gap-1.5">
        {entries.map((entry, index) => {
          const current = index === currentIndex;

          return (
            <li key={entry.questionId}>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                aria-current={current ? "true" : undefined}
                aria-label={t(
                  entry.answered
                    ? "exam.runtime.jumpAnswered"
                    : "exam.runtime.jumpUnanswered",
                  { number: entry.number },
                )}
                onClick={() => onJump(index)}
                className={cn(
                  "relative h-9 w-full justify-center px-0 text-13 tabular-nums",
                  entry.answered
                    ? "bg-primary text-primary-foreground hover:bg-primary-hover hover:text-primary-foreground"
                    : "border border-border bg-card text-muted-foreground",
                  current && "ring-2 ring-ring ring-offset-1 ring-offset-card",
                )}
              >
                {entry.number}
                {entry.flagged ? (
                  <Flag
                    aria-hidden="true"
                    className="absolute -top-0.5 -right-0.5 size-3 fill-warning text-warning"
                  />
                ) : null}
              </Button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
