"use client";

import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { Pencil, Trash2, Check } from "lucide-react";

import { cn } from "@/lib/utils";
import SectionHeading from "../_components/SectionHeading";
import FeatureBullets from "../_components/FeatureBullets";
import { useMockSequence } from "../_hooks/useMockSequence";

const OPTIONS = ["A", "B", "C", "D"] as const;
const CORRECT = "B";

// Looping "demo video": the teacher scans the AI draft, the answer key lands on
// B, then the question is approved. APPROVED is last so it's the resting frame.
const REVIEWING = 0;
const SELECTING = 1;
const APPROVED = 2;
const TC_PHASES = [1900, 1300, 2800] as const;

export default function TeacherControl() {
  const { t } = useTranslation();
  const shouldReduceMotion = useReducedMotion();

  const bullets = [
    t("landing.teacherControl.b1"),
    t("landing.teacherControl.b2"),
    t("landing.teacherControl.b3"),
    t("landing.teacherControl.b4"),
    t("landing.teacherControl.b5"),
  ];

  return (
    <section
      id="teacher-control"
      className="w-full scroll-mt-24 border-y border-border/70 bg-muted/45 py-24 md:py-32"
    >
      <div className="mx-auto grid w-full max-w-6xl items-center gap-12 px-4 lg:grid-cols-2 [&>*]:min-w-0">
        <motion.div
          className="order-2 min-w-0 lg:order-1"
          initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.55 }}
        >
          <ReviewMock />
        </motion.div>

        <div className="order-1 min-w-0 lg:order-2">
          <SectionHeading
            align="left"
            title={t("landing.teacherControl.title")}
            subtitle={t("landing.teacherControl.subtitle")}
          />
          <FeatureBullets items={bullets} className="mt-8" />
        </div>
      </div>
    </section>
  );
}

function ReviewMock() {
  const { t } = useTranslation();
  const reduce = useReducedMotion();
  const { ref, phase } = useMockSequence(TC_PHASES);

  const reviewing = phase === REVIEWING;
  const approved = phase === APPROVED;
  const decided = phase >= SELECTING; // answer key revealed from the selecting beat on

  // While reviewing, sweep a soft highlight down the options like a reading
  // cursor. The index carries across cycles — harmless, since it's only read
  // while reviewing — which keeps this effect free of synchronous setState.
  const [scan, setScan] = useState(0);
  useEffect(() => {
    if (!reviewing) return;
    const id = setInterval(() => setScan((s) => (s + 1) % OPTIONS.length), 480);
    return () => clearInterval(id);
  }, [reviewing]);

  return (
    <div ref={ref} className="rounded-[28px] bg-muted p-3 sm:p-5 dark:bg-white/5">
      <div className="rounded-2xl bg-card p-5 shadow-elev-4">
        {/* Header: draft tag + review status flipping to approved */}
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-accent px-2.5 py-1 text-2xs font-semibold text-accent-foreground">
            {t("landing.ai.mock.tag")}
          </span>
          <AnimatePresence mode="wait" initial={false}>
            {approved ? (
              <motion.span
                key="approved"
                className="inline-flex items-center gap-1.5 rounded-full bg-success/10 px-2.5 py-1 text-2xs font-semibold text-success"
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 4 }}
                transition={{ duration: 0.22 }}
              >
                <Check className="h-3 w-3" strokeWidth={3} />
                {t("landing.teacherControl.stepApprove")}
              </motion.span>
            ) : (
              <motion.span
                key="review"
                className="inline-flex items-center gap-1.5 rounded-full bg-warning/10 px-2.5 py-1 text-2xs font-semibold text-warning"
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 4 }}
                transition={{ duration: 0.22 }}
              >
                <motion.span
                  className="h-1.5 w-1.5 rounded-full bg-warning"
                  animate={reduce ? undefined : { opacity: [1, 0.3, 1] }}
                  transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
                />
                {t("landing.teacherControl.stepReview")}
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        {/* Question under review */}
        <p className="mt-4 text-sm font-semibold leading-snug text-foreground">
          {t("landing.ai.mock.q1")}
        </p>

        {/* Answer options — the scan settles on B, the teacher's call */}
        <div className="mt-4 space-y-2">
          {OPTIONS.map((opt, i) => {
            const correct = opt === CORRECT;
            const showCorrect = correct && decided;
            const scanning = reviewing && scan === i;
            return (
              <motion.div
                key={opt}
                className={cn(
                  "flex items-center gap-3 rounded-xl border p-2.5 transition-colors duration-300",
                  showCorrect
                    ? "border-success/30 bg-success/10"
                    : scanning
                      ? "border-primary/30 bg-accent/60 dark:bg-primary/10"
                      : "border-border bg-card dark:bg-white/[0.03]",
                )}
                animate={{ scale: scanning ? 1.015 : 1 }}
                transition={{ duration: 0.25 }}
              >
                <span
                  className={cn(
                    "flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-xs font-bold transition-colors duration-300",
                    showCorrect
                      ? "bg-success text-success-foreground"
                      : "bg-muted text-muted-foreground dark:bg-white/10",
                  )}
                >
                  <AnimatePresence mode="wait" initial={false}>
                    {showCorrect ? (
                      <motion.span
                        key="check"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        transition={{ type: "spring", stiffness: 500, damping: 18 }}
                      >
                        <Check className="h-3.5 w-3.5" strokeWidth={3} />
                      </motion.span>
                    ) : (
                      <motion.span key="letter" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        {opt}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </span>
                <span
                  className={cn(
                    "h-2 rounded-full transition-all duration-300",
                    showCorrect
                      ? "w-2/5 bg-success/50"
                      : "w-1/2 bg-border dark:bg-white/10",
                  )}
                />
              </motion.div>
            );
          })}
        </div>

        {/* Teacher controls — Approve confirms with a pulse once the key is set */}
        <div className="mt-5 flex items-center gap-2 border-t border-border pt-4">
          <span className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs font-semibold text-muted-foreground">
            <Pencil className="h-3.5 w-3.5" />
            {t("landing.teacherControl.edit")}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs font-semibold text-muted-foreground">
            <Trash2 className="h-3.5 w-3.5" />
            {t("landing.teacherControl.remove")}
          </span>
          <motion.span
            className="ml-auto inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-b from-brand-violet-300 to-brand-violet-600 px-3 py-1.5 text-xs font-semibold text-white"
            initial={false}
            animate={{
              scale: approved && !reduce ? [1, 1.06, 1] : 1,
              boxShadow: approved
                ? "0 10px 26px -6px color-mix(in srgb, var(--brand) 75%, transparent)"
                : "0 8px 20px -6px color-mix(in srgb, var(--brand) 60%, transparent)",
            }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          >
            <Check className="h-3.5 w-3.5" strokeWidth={3} />
            {t("landing.teacherControl.approve")}
          </motion.span>
        </div>
      </div>
    </div>
  );
}
