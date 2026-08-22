"use client";

import React from "react";
import { useTranslation } from "react-i18next";
import { motion, useReducedMotion } from "motion/react";
import { TrendingUp } from "lucide-react";

import SectionHeading from "../_components/SectionHeading";
import FeatureBullets from "../_components/FeatureBullets";
import Surface from "@/components/ui/Surface";

/**
 * Score distribution. Bands are numeric so they read identically in en/ru/uz and need no catalog
 * entry; the last band is the one the section is about, so it carries the accent.
 */
const DISTRIBUTION = [
  { band: "0–40", height: 18 },
  { band: "41–50", height: 34 },
  { band: "51–60", height: 46 },
  { band: "61–70", height: 62 },
  { band: "71–80", height: 78 },
  { band: "81–90", height: 92 },
  { band: "91–100", height: 68 },
];

/**
 * The analytics section.
 *
 * The other three story sections on this page (`MainPage`, `AiGeneration`, `TeacherControl`) are
 * all `lg:grid-cols-2` with copy on one side and a product mock on the other, flipped by
 * `order-*`. Four of the same shape in a row reads as a template rather than a page, so this one
 * is built differently: the copy and its bullets share one band across the top, and the data gets
 * the full column width as a single wide instrument panel instead of a phone-sized screenshot.
 *
 * That is also the honest presentation — the section's claim is that the distribution matters more
 * than the average, and a chart you can actually read makes the argument that a shrunken mock only
 * gestures at.
 */
export default function Analytics() {
  const { t } = useTranslation();
  const shouldReduceMotion = useReducedMotion();

  const bullets = [
    t("landing.analytics.b1"),
    t("landing.analytics.b2"),
    t("landing.analytics.b3"),
    t("landing.analytics.b4"),
    t("landing.analytics.b5"),
    t("landing.analytics.b6"),
  ];

  return (
    <section
      id="analytics"
      className="w-full scroll-mt-24 border-y border-border/70 bg-muted/45 py-24 md:py-32"
    >
      <div className="mx-auto w-full max-w-6xl px-4">
        {/* Copy band: heading and evidence sit side by side, not opposite a mock. */}
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:items-end lg:gap-16">
          <SectionHeading
            align="left"
            title={t("landing.analytics.title")}
            subtitle={t("landing.analytics.subtitle")}
          />
          <FeatureBullets
            items={bullets}
            className="sm:columns-2 sm:gap-x-8 sm:space-y-0 [&>li]:mb-3.5 [&>li]:break-inside-avoid"
          />
        </div>

        <AnalyticsPanel reduced={Boolean(shouldReduceMotion)} />
      </div>
    </section>
  );
}

function AnalyticsPanel({ reduced }: Readonly<{ reduced: boolean }>) {
  const { t } = useTranslation();

  return (
    <Surface
      as="figure"
      padding="none"
      elevation={2}
      className="mt-14 overflow-hidden md:mt-16"
    >
      {/* Header: the summary numbers read as a row of facts, not a stack of stat cards. */}
      <div className="flex flex-wrap items-end justify-between gap-x-10 gap-y-5 border-b border-border px-5 py-5 sm:px-7">
        <div>
          <p className="type-micro text-muted-foreground">
            {t("landing.analytics.mock.average")}
          </p>
          <div className="mt-1.5 flex items-baseline gap-2">
            <span className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              82%
            </span>
            <span className="inline-flex items-center gap-0.5 text-sm font-semibold text-success">
              <TrendingUp aria-hidden className="size-3.5" />
              8%
            </span>
          </div>
        </div>

        <div>
          <p className="type-micro text-muted-foreground">
            {t("landing.analytics.mock.submitted")}
          </p>
          <p className="mt-1.5 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            24
            <span className="text-xl font-semibold text-muted-foreground">/28</span>
          </p>
        </div>

        <figcaption className="type-caption ml-auto text-muted-foreground">
          {t("landing.analytics.mock.title")}
        </figcaption>
      </div>

      {/* The chart is the section's argument, so it gets the room. */}
      <div className="px-5 pb-6 pt-8 sm:px-7">
        <div className="flex h-44 items-end gap-2 sm:h-56 sm:gap-3">
          {DISTRIBUTION.map((bar, index) => {
            const isPeak = bar.height === Math.max(...DISTRIBUTION.map((b) => b.height));
            return (
              <div key={bar.band} className="flex h-full flex-1 flex-col justify-end gap-2">
                <motion.div
                  /*
                   * Data reads from the CHART RAMP, not from --primary.
                   *
                   * These bars were `bg-primary` / `bg-primary/35`, which worked only for as long
                   * as --primary happened to be the brand violet. The moment the action colour
                   * moved to ink the whole histogram turned greyscale with one black column —
                   * a chart is not an affordance, and colouring it with the affordance token
                   * couples "what does a button look like" to "what does a score distribution
                   * look like". --chart-1 is the token that means *first data series*.
                   */
                  className={`w-full rounded-t-md ${isPeak ? "bg-chart-1" : "bg-chart-1/30"}`}
                  // Height is inline because it is data, not design. `transformOrigin: bottom`
                  // makes the grow-in read as a bar rising from the axis rather than inflating.
                  style={{ height: `${bar.height}%`, transformOrigin: "bottom" }}
                  initial={reduced ? false : { scaleY: 0, opacity: 0 }}
                  whileInView={{ scaleY: 1, opacity: 1 }}
                  viewport={{ once: true, amount: 0.4 }}
                  transition={{
                    duration: reduced ? 0 : 0.5,
                    delay: reduced ? 0 : index * 0.06,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                />
                <span className="numeric text-center text-3xs text-muted-foreground sm:text-2xs">
                  {bar.band}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* The finding, docked to the panel it came from. */}
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-t border-border bg-muted/50 px-5 py-4 sm:px-7">
        <div className="min-w-0">
          <p className="type-micro text-muted-foreground">
            {t("landing.analytics.mock.missedLabel")}
          </p>
          <p className="mt-1 truncate text-sm font-semibold text-foreground">
            {t("landing.analytics.mock.missedQuestion")}
          </p>
        </div>
        <span className="inline-flex shrink-0 items-center rounded-[var(--radius-pill)] bg-destructive/10 px-2.5 py-1 text-2xs font-semibold text-destructive">
          {t("landing.analytics.mock.missedRate")}
        </span>
      </div>
    </Surface>
  );
}
