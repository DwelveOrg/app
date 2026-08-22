"use client";

import { motion, useReducedMotion } from "motion/react";
import { useTranslation } from "react-i18next";

import { DUR, EASE_OUT } from "@/lib/motion";
import { cn } from "@/lib/utils";

export type DistributionBin = { from: number; to: number; count: number };

/**
 * How the class's scores are spread.
 *
 * ## Why these choices
 *
 * - **One hue, not ten.** The bins are an ordered scale, so the job is
 *   magnitude, and magnitude takes a single sequential hue. Ten categorical
 *   colours here would say the bins are *different kinds of thing*, which is
 *   the commonest way this exact chart is got wrong.
 * - **Fixed 0–100% bins, supplied by the server.** Comparable between tests and
 *   between classes; bins derived from the data would rescale every time
 *   somebody re-sat the paper.
 * - **The pass mark is a solid hairline**, never dashed — a dashed rule on a
 *   chart reads as "projected", and this is the most concrete line on the page.
 * - **No number over every bar.** The count sits on the bar being pointed at,
 *   and the roster table below carries every value exactly.
 *
 * Marks are thin, the axis is a hairline one shade off the surface, and each
 * bar has a 4px rounded top anchored to the baseline.
 */
export default function ScoreHistogram({
  bins,
  passingPercent,
  className,
}: {
  bins: DistributionBin[];
  /** Where the pass mark falls, 0–100. */
  passingPercent?: number | null;
  className?: string;
}) {
  const { t } = useTranslation();
  const reduced = useReducedMotion();

  const peak = Math.max(1, ...bins.map((bin) => bin.count));
  const total = bins.reduce((sum, bin) => sum + bin.count, 0);

  if (total === 0) {
    return (
      <p className={cn("py-8 text-center text-sm text-muted-foreground", className)}>
        {t("root.tests.results.stats.noAttempts")}
      </p>
    );
  }

  return (
    <figure className={cn("space-y-2", className)}>
      <div className="relative flex h-36 items-end gap-0.5">
        {passingPercent != null ? (
          <span
            aria-hidden="true"
            className="absolute inset-y-0 z-10 w-px bg-foreground/40"
            style={{ left: `${Math.min(100, Math.max(0, passingPercent))}%` }}
          />
        ) : null}

        {bins.map((bin) => {
          const height = (bin.count / peak) * 100;

          return (
            <div
              key={`${bin.from}-${bin.to}`}
              className="group/bar relative flex h-full flex-1 items-end"
            >
              <motion.div
                className={cn(
                  // 4px rounded data-end, anchored to the baseline. `min-h` so an
                  // empty bin still shows a baseline tick rather than vanishing.
                  "w-full rounded-t bg-[var(--chart-1)] transition-opacity duration-[var(--dur-1)]",
                  "group-hover/bar:opacity-80",
                  bin.count === 0 && "min-h-px opacity-25",
                )}
                initial={reduced ? false : { height: 0 }}
                animate={{ height: `${Math.max(height, bin.count > 0 ? 3 : 0)}%` }}
                transition={{ duration: DUR.layout, ease: EASE_OUT }}
              />

              {/* Hover reveals the value, so no bar needs a permanent label. */}
              <span
                role="img"
                aria-label={t("root.tests.results.stats.binLabel", {
                  from: bin.from,
                  to: bin.to,
                  count: bin.count,
                })}
                className="pointer-events-none absolute -top-5 left-1/2 -translate-x-1/2 rounded bg-popover px-1.5 py-0.5 text-2xs font-semibold tabular-nums text-foreground opacity-0 shadow-elev-3 transition-opacity duration-[var(--dur-1)] group-hover/bar:opacity-100"
              >
                {bin.count}
              </span>
            </div>
          );
        })}
      </div>

      {/* A hairline baseline, one shade off the surface. */}
      <div className="h-px bg-border" aria-hidden="true" />

      <div className="flex justify-between text-3xs text-muted-foreground tabular-nums">
        <span>0%</span>
        <span>50%</span>
        <span>100%</span>
      </div>

      {passingPercent != null ? (
        <figcaption className="text-2xs text-muted-foreground">
          {t("root.tests.results.stats.passLine", {
            percent: Math.round(passingPercent),
          })}
        </figcaption>
      ) : null}
    </figure>
  );
}
