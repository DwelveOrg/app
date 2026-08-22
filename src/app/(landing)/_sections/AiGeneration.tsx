"use client";

import React from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { FileText, Check, Sparkles, Pencil, Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";
import SectionHeading from "../_components/SectionHeading";
import FeatureBullets from "../_components/FeatureBullets";
import { useMockSequence } from "../_hooks/useMockSequence";
import { surfaceVariants } from "@/components/ui/Surface";

// Looping "demo video": analyse the upload, draft the questions, land on the
// finished draft, then replay. READY is last so it's the resting/default frame.
const ANALYZING = 0;
const DRAFTING = 1;
const READY = 2;
const AI_PHASES = [1700, 1700, 2800] as const;

export default function AiGeneration() {
  const { t } = useTranslation();
  const shouldReduceMotion = useReducedMotion();

  const bullets = [
    t("landing.ai.b1"),
    t("landing.ai.b2"),
    t("landing.ai.b3"),
    t("landing.ai.b4"),
    t("landing.ai.b5"),
  ];

  return (
    <section id="ai-generation" className="w-full scroll-mt-24 py-24 md:py-32">
      <div className="mx-auto grid w-full max-w-6xl items-center gap-12 px-4 lg:grid-cols-2 [&>*]:min-w-0">
        <div>
          <SectionHeading
            align="left"
            title={t("landing.ai.title")}
            subtitle={t("landing.ai.subtitle")}
          />
          <FeatureBullets items={bullets} className="mt-8" />
        </div>

        <motion.div
          className="relative"
          initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.55 }}
        >
          <AiMock />
        </motion.div>
      </div>
    </section>
  );
}

function AiMock() {
  const { t } = useTranslation();
  const { ref, phase } = useMockSequence(AI_PHASES);

  const analyzing = phase === ANALYZING;
  const drafting = phase === DRAFTING;
  const ready = phase === READY;

  const statusLabel = analyzing
    ? t("landing.ai.mock.analyzing")
    : drafting
      ? t("landing.ai.mock.drafting")
      : t("landing.ai.mock.ready");

  const questions = [t("landing.ai.mock.q1"), t("landing.ai.mock.q2")];

  return (
    <div ref={ref} className="rounded-2xl bg-muted p-3 sm:p-5 dark:bg-white/5">
      <div className="rounded-2xl bg-card p-5 shadow-elev-4">
        {/* Uploaded source file — spinner while analysing, then a settled check */}
        <div className="flex items-center gap-3 rounded-xl border border-border bg-muted p-3 dark:bg-white/5">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground">
            <FileText className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-foreground">
              {t("landing.ai.mock.file")}
            </p>
            <p className="text-xs text-muted-foreground">{t("landing.ai.mock.meta")}</p>
          </div>
          <span className="flex h-6 w-6 shrink-0 items-center justify-center">
            <AnimatePresence mode="wait" initial={false}>
              {analyzing ? (
                <motion.span
                  key="spin"
                  className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-primary dark:bg-white/10"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                </motion.span>
              ) : (
                <motion.span
                  key="check"
                  className="flex h-6 w-6 items-center justify-center rounded-full bg-success/15 text-success"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ type: "spring", stiffness: 480, damping: 18 }}
                >
                  <Check className="h-3.5 w-3.5" strokeWidth={3} />
                </motion.span>
              )}
            </AnimatePresence>
          </span>
        </div>

        {/* Drafting indicator — label crossfades per phase, bar fills then turns done */}
        <div className="mt-4 flex items-center gap-2.5">
          <Sparkles className="h-4 w-4 shrink-0 text-primary" />
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={statusLabel}
              className="whitespace-nowrap text-xs font-medium text-muted-foreground"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.2 }}
            >
              {statusLabel}
            </motion.span>
          </AnimatePresence>
          <span className="relative ml-1 h-1.5 flex-1 overflow-hidden rounded-full bg-muted dark:bg-white/10">
            <motion.span
              className={cn(
                "absolute inset-y-0 left-0 overflow-hidden rounded-full",
                ready
                  ? "bg-success"
                  : "bg-gradient-to-r from-brand-violet-300 to-brand-violet-600",
              )}
              initial={false}
              animate={{ width: ready ? "100%" : drafting ? "90%" : "56%" }}
              transition={{ duration: ready ? 0.5 : 0.9, ease: [0.22, 1, 0.36, 1] }}
            >
              {!ready ? <span className="mock-shimmer absolute inset-0" /> : null}
            </motion.span>
          </span>
        </div>

        {/* Draft questions header — the AI tag pops once the draft is ready */}
        <div className="mt-5 flex items-center justify-between">
          <p className="text-sm font-bold text-foreground">
            {t("landing.ai.mock.heading")}
          </p>
          <motion.span
            className="inline-flex items-center gap-1.5 rounded-[var(--radius-pill)] bg-accent px-2.5 py-1 text-2xs font-semibold text-accent-foreground"
            initial={false}
            animate={{ opacity: ready ? 1 : 0.4, scale: ready ? 1 : 0.9 }}
            transition={{ type: "spring", stiffness: 420, damping: 22 }}
          >
            <Sparkles className="h-3 w-3" />
            {t("landing.ai.mock.tag")}
          </motion.span>
        </div>

        {/* Drafted question rows — skeleton shimmer resolves into the real text */}
        <div className="mt-3 space-y-2.5">
          {questions.map((q, i) => (
            <div
              key={i}
              className={cn(surfaceVariants({ radius: "md", padding: "none" }), "flex items-start gap-3 p-3 dark:bg-white/[0.03]")}
            >
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-muted text-xs font-bold text-muted-foreground dark:bg-white/10">
                {i + 1}
              </span>
              <div className="relative min-h-[2.25rem] min-w-0 flex-1">
                <p
                  className="text-13 leading-snug text-muted-foreground transition-opacity duration-500"
                  style={{ opacity: ready ? 1 : 0, transitionDelay: ready ? `${i * 110}ms` : "0ms" }}
                >
                  {q}
                </p>
                <div
                  aria-hidden
                  className="absolute inset-0 flex flex-col justify-center gap-1.5 transition-opacity duration-300"
                  style={{ opacity: ready ? 0 : 1 }}
                >
                  <span className="mock-shimmer h-2.5 w-full rounded-full bg-border dark:bg-white/10" />
                  <span className="mock-shimmer h-2.5 w-3/5 rounded-full bg-border dark:bg-white/10" />
                </div>
              </div>
              <motion.span
                className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-border px-2 py-1 text-2xs font-semibold text-muted-foreground"
                initial={false}
                animate={{ opacity: ready ? 1 : 0.3 }}
                transition={{ duration: 0.4, delay: ready ? i * 0.11 + 0.1 : 0 }}
              >
                <Pencil className="h-3 w-3" />
                {t("landing.ai.mock.action")}
              </motion.span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
