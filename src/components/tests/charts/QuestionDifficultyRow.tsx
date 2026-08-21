"use client";

import { Check, ChevronDown, TriangleAlert } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { useTranslation } from "react-i18next";

import Badge from "@/components/ui/badge";
import type { QuestionStat } from "@/app/(root)/_lib/test-results.schemas";
import { DUR, EASE_OUT } from "@/lib/motion";
import { cn } from "@/lib/utils";

/**
 * One question's performance, as a row in a table that also happens to be a
 * chart.
 *
 * ## Why a table with inline bars rather than a chart
 *
 * Twenty-six questions is past the point where a bar chart is readable, and the
 * teacher's task is not "compare question 7 with question 22" — it is "find the
 * questions that went badly". A sorted, scannable table with a bar in each row
 * does that, keeps every exact value visible, and *is* the accessible table
 * view a chart would otherwise have to provide separately.
 *
 * ## Discrimination is the number worth reading
 *
 * A hard question is not a problem — a question the strong students got wrong
 * as often as the weak ones is. That is what `discrimination` measures, and a
 * low or negative value on a question most of the class failed usually means
 * the question is broken rather than the class. It is flagged with an icon and
 * a word, never a colour on its own, and it is suppressed entirely under six
 * attempts, where it would be noise wearing a statistic's clothes.
 *
 * The expanded row shows where the class actually went: which wrong option they
 * chose, or which wrong spellings they typed. That is the difference between
 * "60% got this wrong" and "60% chose B, which is the answer to the previous
 * question".
 */
export default function QuestionDifficultyRow({
  stat,
  attemptsCounted,
  expanded,
  onToggle,
}: {
  stat: QuestionStat;
  attemptsCounted: number;
  expanded: boolean;
  onToggle: () => void;
}) {
  const { t } = useTranslation();
  const reduced = useReducedMotion();

  const correctPercent =
    stat.difficulty != null
      ? Math.round(stat.difficulty * 100)
      : attemptsCounted > 0
        ? Math.round((stat.correct / attemptsCounted) * 100)
        : 0;

  const band = correctPercent >= 80 ? "easy" : correctPercent >= 50 ? "moderate" : "hard";
  // Weak separation on a question the class found hard is the signal that the
  // question, not the class, is the problem.
  const suspect = stat.discrimination != null && stat.discrimination < 0.1 && band === "hard";

  const hasDetail =
    (stat.options?.length ?? 0) > 0 || (stat.topWrongAnswers?.length ?? 0) > 0;

  return (
    <div className="px-4 py-3">
      <button
        type="button"
        onClick={onToggle}
        disabled={!hasDetail}
        aria-expanded={hasDetail ? expanded : undefined}
        className={cn(
          "interactive-flat flex w-full items-start gap-3 rounded-lg text-left outline-none",
          "focus-visible:ring-2 focus-visible:ring-ring/40",
          hasDetail ? "cursor-pointer" : "cursor-default",
        )}
      >
        <span
          aria-hidden="true"
          className="numeric mt-0.5 inline-flex size-7 shrink-0 items-center justify-center rounded-[var(--radius-pill)] bg-muted text-2xs font-semibold text-muted-foreground"
        >
          {stat.questionNumber}
        </span>

        <span className="min-w-0 flex-1 space-y-1.5">
          <span className="line-clamp-1 block text-13 text-foreground">{stat.prompt}</span>

          <span className="flex items-center gap-2">
            {/* One hue: this is magnitude, not identity. */}
            <span className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-muted">
              <motion.span
                className="block h-full rounded-full bg-[var(--chart-1)]"
                initial={reduced ? false : { width: 0 }}
                animate={{ width: `${correctPercent}%` }}
                transition={{ duration: DUR.layout, ease: EASE_OUT }}
              />
            </span>
            <span className="shrink-0 text-2xs tabular-nums text-muted-foreground">
              {t("root.tests.results.stats.correctPercent", { percent: correctPercent })}
            </span>
          </span>
        </span>

        <span className="flex shrink-0 items-center gap-2">
          {/* Icon plus words: the band must survive greyscale. */}
          <Badge
            variant={band === "easy" ? "success" : band === "moderate" ? "neutral" : "warning"}
            size="xs"
          >
            {t(`root.tests.results.stats.band.${band}`)}
          </Badge>

          {suspect ? (
            <Badge variant="destructive" size="xs">
              <TriangleAlert aria-hidden="true" />
              {t("root.tests.results.stats.suspect")}
            </Badge>
          ) : null}

          {hasDetail ? (
            <ChevronDown
              aria-hidden="true"
              className={cn(
                "size-4 text-muted-foreground transition-transform duration-[var(--dur-2)]",
                expanded && "rotate-180",
              )}
            />
          ) : null}
        </span>
      </button>

      {expanded && hasDetail ? (
        <div className="mt-3 ml-10 space-y-3">
          {stat.options?.length ? (
            <ul className="space-y-1.5">
              {stat.options.map((option) => {
                const share =
                  attemptsCounted > 0 ? (option.chosen / attemptsCounted) * 100 : 0;

                return (
                  <li key={option.id} className="flex items-center gap-2 text-2xs">
                    <span className="w-4 shrink-0 font-semibold text-muted-foreground">
                      {option.label}
                    </span>
                    <span className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-muted">
                      <span
                        className={cn(
                          "block h-full rounded-full",
                          // Status colours are reserved, and this is exactly
                          // the reserved meaning: correct versus not.
                          option.isCorrect
                            ? "bg-[var(--success)]"
                            : "bg-[var(--chart-4)]",
                        )}
                        style={{ width: `${share}%` }}
                      />
                    </span>
                    <span className="w-8 shrink-0 text-right tabular-nums text-muted-foreground">
                      {option.chosen}
                    </span>
                    {option.isCorrect ? (
                      <Check className="size-3 shrink-0 text-success" aria-hidden="true" />
                    ) : (
                      <span className="size-3 shrink-0" />
                    )}
                    <span className="min-w-0 flex-[2] truncate text-muted-foreground">
                      {option.text}
                    </span>
                  </li>
                );
              })}
            </ul>
          ) : null}

          {stat.topWrongAnswers?.length ? (
            <div className="space-y-1">
              <p className="type-micro text-muted-foreground">
                {t("root.tests.results.stats.commonWrong")}
              </p>
              <ul className="flex flex-wrap gap-1.5">
                {stat.topWrongAnswers.map((entry) => (
                  <li key={entry.value}>
                    <Badge variant="neutral" size="xs">
                      {entry.value} · {entry.count}
                    </Badge>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <dl className="flex flex-wrap gap-x-5 gap-y-1 text-2xs text-muted-foreground">
            <Stat
              label={t("root.tests.results.stats.answered")}
              value={`${stat.answered} / ${attemptsCounted}`}
            />
            {stat.discrimination != null ? (
              <Stat
                label={t("root.tests.results.stats.discrimination")}
                value={stat.discrimination.toFixed(2)}
              />
            ) : null}
            {stat.averageTimeSeconds != null ? (
              <Stat
                label={t("root.tests.results.stats.averageTime")}
                value={t("root.tests.results.stats.seconds", {
                  count: Math.round(stat.averageTimeSeconds),
                })}
              />
            ) : null}
          </dl>
        </div>
      ) : null}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-1.5">
      <dt>{label}</dt>
      <dd className="font-medium tabular-nums text-foreground">{value}</dd>
    </div>
  );
}
