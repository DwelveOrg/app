"use client";

import { motion, useReducedMotion } from "motion/react";
import { useTranslation } from "react-i18next";

import { DUR, EASE_OUT } from "@/lib/motion";
import { cn } from "@/lib/utils";

export type ScoreTone = "success" | "danger" | "neutral";

/**
 * A score against its total, and against the mark that decides pass or fail.
 *
 * ## Why a meter and not a dial
 *
 * The data's job here is *one ratio against a limit*, and the form for that is a
 * meter — not the donut this kind of screen usually gets. A donut of two slices
 * is a pie chart of one number: it spends a large, attention-grabbing shape on a
 * value a reader still has to translate from an angle, and it has nowhere to put
 * the only other fact that matters. The threshold is what a student and a
 * teacher are both actually looking for, and on a linear track it is a tick you
 * can point at.
 *
 * ## Reading it
 *
 * - The **number is the headline** and carries proportional figures. `tabular-nums`
 *   equalises digit widths, which is right in a column of scores and wrong at
 *   display size, where it makes `121` look gappy.
 * - The **fill carries severity** — passed, failed, or no threshold at all — and
 *   the unfilled track is a light step of the same hue, so the state reads across
 *   the whole bar rather than only where the fill ends.
 * - The **threshold tick** is a solid hairline, labelled. Never dashed: a dashed
 *   rule on a chart reads as "projected", and this is the most concrete number
 *   on the page.
 *
 * Pass/fail is never carried by the colour alone — the caller pairs this with a
 * badge that says which it is (`docs/design/design-system.md` §3.3).
 */
export default function ScoreMeter({
  value,
  max,
  passingScore,
  tone = "neutral",
  size = "md",
  className,
}: {
  value: number;
  max: number;
  /** The mark that decides pass or fail, if the test has one. */
  passingScore?: number | null;
  tone?: ScoreTone;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const { t } = useTranslation();
  const reduced = useReducedMotion();

  const safeMax = Math.max(1, max);
  const percent = Math.min(100, Math.max(0, (value / safeMax) * 100));
  const thresholdPercent =
    passingScore != null && passingScore > 0 && passingScore <= safeMax
      ? (passingScore / safeMax) * 100
      : null;

  const fill =
    tone === "success"
      ? "var(--success)"
      : tone === "danger"
        ? "var(--destructive)"
        : "var(--chart-1)";

  return (
    <div className={cn(size === "lg" ? "min-w-64" : "min-w-40", className)}>
      <p
        className={cn(
          "font-semibold text-foreground",
          // Proportional figures, deliberately: this is a headline, not a column.
          size === "lg"
            ? "text-[clamp(3.5rem,9vw,6rem)] leading-[0.95] tracking-tight"
            : size === "md"
              ? "text-[2.5rem] leading-none"
              : "type-section",
        )}
      >
        {value}
        <span className="text-muted-foreground">
          <span className="px-1 font-normal">/</span>
          {max}
        </span>
      </p>

      <div
        className={cn(
          "relative mt-2 overflow-hidden rounded-full",
          size === "lg" ? "h-3" : size === "md" ? "h-2" : "h-1.5",
        )}
        // The unfilled track: a light step of the fill's own hue.
        style={{ background: `color-mix(in srgb, ${fill} 15%, var(--muted))` }}
        role="img"
        aria-label={t("tests.score.meterLabel", {
          value,
          max,
          percent: Math.round(percent),
        })}
      >
        <motion.div
          className="h-full rounded-full"
          style={{ background: fill }}
          initial={reduced ? false : { width: 0 }}
          animate={{ width: `${percent}%` }}
          transition={{ duration: DUR.layout, ease: EASE_OUT }}
        />

        {thresholdPercent !== null ? (
          <span
            aria-hidden="true"
            className="absolute inset-y-0 w-0.5 bg-foreground/45"
            style={{ left: `${thresholdPercent}%` }}
          />
        ) : null}
      </div>

      {thresholdPercent !== null ? (
        <p
          className={cn(
            "mt-1.5 text-muted-foreground numeric",
            size === "lg" ? "text-13" : "text-2xs",
          )}
        >
          {t("tests.score.passAt", { score: passingScore })}
        </p>
      ) : null}
    </div>
  );
}
