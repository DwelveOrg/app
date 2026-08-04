"use client";

import React from "react";
import { useTranslation } from "react-i18next";
import { motion, useReducedMotion } from "motion/react";
import {
  BarChart3,
  Hourglass,
  MonitorSmartphone,
  Library,
  Zap,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { LANDING_HEADING } from "../_components/SectionHeading";
import { surfaceVariants } from "@/components/ui/Surface";

type Feature = {
  title: string;
  description: string;
  icon: LucideIcon;
  /** Icon-chip palette for the compact tiles. */
  tile: string;
};

export default function Features() {
  const { t } = useTranslation();
  const shouldReduceMotion = useReducedMotion();

  // The spotlight tile leads the bento — the headline value, given room to breathe.
  const spotlight = {
    title: t("landing.features.instantGradingTitle"),
    description: t("landing.features.instantGradingDesc"),
    icon: Zap,
  };

  // The four supporting capabilities fill the right of the bento as compact tiles.
  const features: Feature[] = [
    {
      title: t("landing.features.questionBankTitle"),
      description: t("landing.features.questionBankDesc"),
      icon: Library,
      tile: "bg-accent text-accent-foreground",
    },
    {
      title: t("landing.features.insightsTitle"),
      description: t("landing.features.insightsDesc"),
      icon: BarChart3,
      tile: "bg-accent text-accent-foreground",
    },
    {
      title: t("landing.features.timedExamsTitle"),
      description: t("landing.features.timedExamsDesc"),
      icon: Hourglass,
      tile: "bg-accent text-accent-foreground",
    },
    {
      title: t("landing.features.anyDeviceTitle"),
      description: t("landing.features.anyDeviceDesc"),
      icon: MonitorSmartphone,
      tile: "bg-accent text-accent-foreground",
    },
  ];

  const header = {
    hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 18 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.45 } },
  };

  const container = {
    hidden: {},
    visible: {
      transition: { staggerChildren: shouldReduceMotion ? 0 : 0.08, delayChildren: 0.05 },
    },
  };

  const card = {
    hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.45 } },
  };

  const SpotlightIcon = spotlight.icon;

  return (
    <section id="features" className="w-full scroll-mt-24 py-20 md:py-24">
      <div className="mx-auto w-full max-w-6xl px-4">
        <motion.div
          className="mx-auto max-w-2xl text-center"
          variants={header}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.4 }}
        >
          <h2 className={LANDING_HEADING}>
            {t("landing.features.title")}
          </h2>
          <p className="mt-4 text-base text-muted-foreground">
            {t("landing.features.subtitle")}
          </p>
        </motion.div>

        <motion.div
          className="mt-14 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:grid-rows-2"
          variants={container}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
        >
          {/* Spotlight — fills the left 2×2 of the bento (full width on tablet). */}
          <motion.article
            variants={card}
            className="group relative flex flex-col overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-accent/60 via-card to-card p-7 sm:col-span-2 sm:p-8 lg:col-span-2 lg:row-span-2 dark:from-primary/[0.12] dark:via-card dark:to-card"
          >
            <span
              aria-hidden="true"
              className="pointer-events-none absolute -right-16 -top-16 h-52 w-52 rounded-full bg-primary/15 blur-3xl dark:bg-primary/20"
            />
            <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-b from-brand-violet-300 to-brand-violet-600 text-white shadow-elev-brand">
              <SpotlightIcon className="h-7 w-7" />
            </div>
            <h3 className="relative mt-6 text-2xl font-bold tracking-tight text-foreground">
              {spotlight.title}
            </h3>
            <p className="relative mt-2.5 max-w-sm text-15 leading-relaxed text-muted-foreground">
              {spotlight.description}
            </p>

            {/* A small "submissions auto-graded" visual to fill and ground the tile. */}
            <div className="relative mt-auto pt-8">
              <div className={cn(surfaceVariants({ padding: "none" }), "space-y-2.5 bg-card/70 p-4 backdrop-blur-sm dark:bg-white/[0.04]")}>
                {GRADED_ROWS.map((row, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className={cn("h-7 w-7 shrink-0 rounded-full", row.avatar)} />
                    <span className="h-2 flex-1 overflow-hidden rounded-full bg-muted dark:bg-white/10">
                      <span
                        className="block h-full rounded-full bg-gradient-to-r from-brand-violet-300 to-brand-violet-600"
                        style={{ width: row.score }}
                      />
                    </span>
                    <span className="w-9 shrink-0 text-right text-xs font-bold tabular-nums text-success">
                      {row.score}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </motion.article>

          {/* Four supporting tiles flow into the right two columns across both rows. */}
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <motion.article
                key={feature.title}
                variants={card}
                className={cn(surfaceVariants({ padding: "none" }), "interactive group flex flex-col p-6 duration-200 hover:-translate-y-1 hover:border-primary/30 hover:shadow-elev-3 dark:hover:border-white/20")}
              >
                <div className={cn("flex h-11 w-11 items-center justify-center rounded-xl", feature.tile)}>
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-base font-bold text-foreground">
                  {feature.title}
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                  {feature.description}
                </p>
              </motion.article>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}

/** Decorative graded-submission rows inside the spotlight tile. Scores are
 *  numeric (locale-agnostic), so no translation keys are needed. */
const GRADED_ROWS = [
  { avatar: "bg-primary/80", score: "96%" },
  { avatar: "bg-primary/60", score: "88%" },
  { avatar: "bg-primary/40", score: "92%" },
] as const;
