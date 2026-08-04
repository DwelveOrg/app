"use client";

import { useMemo } from "react";
import { motion, useReducedMotion } from "motion/react";
import { useTranslation } from "react-i18next";

import type { ScoreTrend } from "@/app/(root)/_lib/dashboard.schemas";

/** `YYYY-MM` → a localized short month label (e.g. "Jan"). */
function monthLabel(month: string, language: string): string {
  const [year, monthIndex] = month.split("-").map(Number);
  if (!year || !monthIndex) return month;
  return new Intl.DateTimeFormat(language || "en", { month: "short" }).format(
    new Date(Date.UTC(year, monthIndex - 1, 1)),
  );
}

/**
 * Scores are a 0–100 percentage, so the axis is fixed rather than derived from the data.
 *
 * The previous version scaled bars between the *observed* min and max and then floored the result
 * at 42% of the plot, which meant a month at 51 and a month at 94 could render nearly the same
 * height, and the shortest bar was always drawn at 42% regardless of its value. The chart looked
 * like data without reporting any. A fixed 0–100 axis with a real zero baseline means bar height
 * is the number.
 */
const AXIS = [0, 25, 50, 75, 100] as const;

export default function TrendChart({ points }: { points: ScoreTrend["points"] }) {
  const { t, i18n } = useTranslation();
  const reduceMotion = useReducedMotion();

  const labelled = useMemo(
    () =>
      points.map((point) => ({
        ...point,
        label: monthLabel(point.month, i18n.language),
        pct: Math.max(0, Math.min(100, point.avg)),
      })),
    [points, i18n.language],
  );

  if (labelled.length === 0) return null;

  return (
    <figure className="m-0">
      <div className="flex gap-3">
        {/* Axis ticks. `aria-hidden` because the accessible summary below carries the values. */}
        <div
          aria-hidden
          className="flex h-44 w-7 shrink-0 flex-col justify-between py-px text-right text-3xs tabular-nums text-muted-foreground"
        >
          {[...AXIS].reverse().map((tick) => (
            <span key={tick}>{tick}</span>
          ))}
        </div>

        <div className="relative min-w-0 flex-1">
          {/* Gridlines, including the zero baseline the old chart never drew. */}
          <div aria-hidden className="absolute inset-0 flex flex-col justify-between">
            {AXIS.map((tick) => (
              <span
                key={tick}
                className={tick === 0 ? "h-px bg-border" : "h-px bg-border/55"}
              />
            ))}
          </div>

          <div className="relative flex h-44 items-end gap-2 sm:gap-3">
            {labelled.map((point, index) => (
              <div
                key={point.month}
                className="group relative flex h-full flex-1 items-end justify-center"
              >
                <motion.div
                  className="w-full max-w-12 rounded-t-md bg-primary/85 group-hover:bg-primary"
                  style={{ height: `${point.pct}%`, transformOrigin: "bottom" }}
                  initial={reduceMotion ? false : { scaleY: 0 }}
                  animate={{ scaleY: 1 }}
                  transition={{
                    duration: reduceMotion ? 0 : 0.45,
                    delay: reduceMotion ? 0 : 0.04 + index * 0.05,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                />
                <span className="pointer-events-none absolute -top-6 left-1/2 -translate-x-1/2 rounded-md bg-foreground px-1.5 py-0.5 text-2xs font-semibold tabular-nums text-background opacity-0 shadow-elev-2 transition-opacity duration-[var(--dur-1)] group-hover:opacity-100">
                  {Math.round(point.avg)}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-2 flex gap-2 sm:gap-3">
            {labelled.map((point) => (
              <span
                key={point.month}
                className="flex-1 truncate text-center text-xs font-medium text-muted-foreground"
              >
                {point.label}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* The chart is decorative to a screen reader; this is the actual data. */}
      <figcaption className="sr-only">
        {t("root.dashboard.trend.aria")}:{" "}
        {labelled.map((point) => `${point.label} ${Math.round(point.avg)}`).join(", ")}
      </figcaption>
    </figure>
  );
}
