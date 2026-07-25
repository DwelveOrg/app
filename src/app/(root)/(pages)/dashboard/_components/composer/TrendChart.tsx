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

/** Bar height as a % of the plot — floored so the lowest month still reads. */
function heightPct(value: number, min: number, max: number): number {
  if (max === min) return 100;
  return Math.round(42 + ((value - min) / (max - min)) * 58);
}

/** Fill intensity ramps with the value: lighter for low, saturated brand for high. */
function fill(value: number, min: number, max: number): string {
  const norm = max === min ? 1 : (value - min) / (max - min);
  return `color-mix(in srgb, var(--primary) ${Math.round(52 + norm * 48)}%, transparent)`;
}

/**
 * Monthly score trend rendered from real `/dashboard/score-trend` points
 * (variable length, oldest first). Same bar treatment as the reference chart,
 * but driven by live data instead of the old fixed demo months.
 */
export default function TrendChart({ points }: { points: ScoreTrend["points"] }) {
  const { t, i18n } = useTranslation();
  const reduceMotion = useReducedMotion();

  const { min, max } = useMemo(() => {
    const values = points.map((point) => point.avg);
    return { min: Math.min(...values), max: Math.max(...values) };
  }, [points]);

  return (
    <>
      <div
        role="img"
        aria-label={t("root.dashboard.trend.aria")}
        className="flex h-48 items-end gap-2 rounded-xl bg-[var(--muted)]/45 p-4 sm:gap-3"
      >
        {points.map((point, index) => (
          <div
            key={point.month}
            className="group flex h-full flex-1 flex-col items-center justify-end"
            title={`${monthLabel(point.month, i18n.language)}: ${Math.round(point.avg)}`}
          >
            <motion.div
              className="relative w-full rounded-t-lg"
              style={{
                height: `${heightPct(point.avg, min, max)}%`,
                background: fill(point.avg, min, max),
                transformOrigin: "bottom",
              }}
              initial={reduceMotion ? false : { scaleY: 0 }}
              animate={{ scaleY: 1 }}
              transition={{
                duration: 0.5,
                delay: reduceMotion ? 0 : 0.05 + index * 0.06,
                ease: [0.22, 1, 0.36, 1],
              }}
            >
              <span className="pointer-events-none absolute -top-7 left-1/2 -translate-x-1/2 rounded-md bg-[var(--foreground)] px-1.5 py-0.5 text-[11px] font-semibold tabular-nums text-[var(--background)] opacity-0 shadow-sm transition-opacity duration-150 group-hover:opacity-100">
                {Math.round(point.avg)}
              </span>
            </motion.div>
          </div>
        ))}
      </div>

      <div className="mt-2 flex gap-2 px-4 sm:gap-3">
        {points.map((point) => (
          <span
            key={point.month}
            className="flex-1 text-center text-xs font-medium text-[var(--muted-foreground)]"
          >
            {monthLabel(point.month, i18n.language)}
          </span>
        ))}
      </div>
    </>
  );
}
