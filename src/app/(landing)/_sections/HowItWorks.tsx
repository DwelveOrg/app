"use client";

import React from "react";
import { ChartNoAxesCombined, Share2, ShieldCheck, type LucideIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { motion, useReducedMotion } from "motion/react";
import { LANDING_HEADING } from "../_components/SectionHeading";
import { surfaceVariants } from "@/components/ui/Surface";
import { cn } from "@/lib/utils";

type Step = {
  step: string;
  title: string;
  description: string;
  icon: LucideIcon;
};

export default function HowItWorks() {
  const { t } = useTranslation();
  const shouldReduceMotion = useReducedMotion();

  const steps: Step[] = [
    {
      step: "01",
      title: t("landing.howItWorks.createTitle"),
      description: t("landing.howItWorks.createDesc"),
      icon: ShieldCheck,
    },
    {
      step: "02",
      title: t("landing.howItWorks.shareTitle"),
      description: t("landing.howItWorks.shareDesc"),
      icon: Share2,
    },
    {
      step: "03",
      title: t("landing.howItWorks.resultsTitle"),
      description: t("landing.howItWorks.resultsDesc"),
      icon: ChartNoAxesCombined,
    },
  ];

  const header = {
    hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 18 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.45 } },
  };

  const container = {
    hidden: {},
    visible: {
      transition: { staggerChildren: shouldReduceMotion ? 0 : 0.12, delayChildren: 0.05 },
    },
  };

  const card = {
    hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 22 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  return (
    <section
      id="how-it-works"
      className="w-full scroll-mt-24 py-20 md:py-24"
    >
      <div className="mx-auto w-full max-w-6xl px-4">
        <motion.div
          className="mx-auto max-w-2xl text-center"
          variants={header}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.4 }}
        >
          <h2 className={LANDING_HEADING}>
            {t("landing.howItWorks.title")}
          </h2>
          <p className="mt-4 text-base text-muted-foreground">
            {t("landing.howItWorks.subtitle")}
          </p>
        </motion.div>

        <motion.div
          className="mt-14 grid gap-5 md:grid-cols-3"
          variants={container}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
        >
          {steps.map((item) => {
            const Icon = item.icon;
            return (
              <motion.article
                key={item.step}
                variants={card}
                className={cn(surfaceVariants({ padding: "none" }), "relative p-7")}
              >
                <span className="absolute right-6 top-6 text-3xl font-bold text-primary/10 dark:text-primary/15">
                  {item.step}
                </span>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent text-accent-foreground">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="mt-5 text-lg font-bold text-foreground">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {item.description}
                </p>
              </motion.article>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
