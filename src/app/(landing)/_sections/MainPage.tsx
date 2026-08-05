"use client";

import React from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { motion, useReducedMotion } from "motion/react";
import { ArrowRight, Sparkle } from "lucide-react";

import Button from "@/components/ui/Button";

// Lazy, client-only: the three.js scene is its own chunk and never blocks paint.
// The CSS glow behind it stays visible while it loads and if WebGL is missing.
const HeroScene = dynamic(() => import("../_components/HeroScene"), { ssr: false });

// Avatar tints come from the chart ramp, not raw Tailwind hues. The four-hue rainbow that used to
// live here (and, verbatim, in the login and signup panels) was the loudest violation of the
// one-palette rule and would have clashed with any brand change.
const SOCIAL_PROOF_AVATARS = [
  { initials: "AY", color: "var(--chart-1)" },
  { initials: "KM", color: "var(--chart-2)" },
  { initials: "SR", color: "var(--chart-3)" },
  { initials: "NB", color: "var(--chart-4)" },
] as const;
const USE_CASES = ["quizzes", "placement", "mock", "homework", "finals", "progress"] as const;

function MainPage() {
  const { t } = useTranslation();
  const shouldReduceMotion = useReducedMotion();

  const fade = (delay = 0) => ({
    initial: { opacity: 0, y: shouldReduceMotion ? 0 : 16 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5, delay: shouldReduceMotion ? 0 : delay },
  });

  return (
    <section id="home" className="w-full scroll-mt-24 px-4 pb-12 pt-14 md:pt-20">
      <div className="mx-auto grid w-full max-w-6xl items-center gap-12 lg:grid-cols-2">
        {/* Left: copy */}
        <motion.div className="flex flex-col items-start text-left" {...fade(0)}>
          <span className="inline-flex items-center gap-2 rounded-full bg-accent px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-accent-foreground">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success/70" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
            </span>
            {t("landing.main.badge")}
          </span>

          <h1 className="mt-6 max-w-xl text-balance text-[clamp(2.5rem,6vw,3.85rem)] font-bold leading-[1.05] tracking-[-0.02em] text-foreground">
            {t("landing.main.title")}
          </h1>

          <p className="mt-5 max-w-lg text-base leading-relaxed text-muted-foreground sm:text-lg">
            {t("landing.main.subtitle")}
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Button asChild variant="brand" size="xl">
            <Link href="/signup">
              {t("landing.main.primaryCta")}
            </Link>
          </Button>
            <Button asChild variant="outline" size="xl">
            <Link href="/login">
              {t("landing.main.secondaryCta")}
            <ArrowRight className="transition-transform duration-[var(--dur-2)] group-hover/button:translate-x-0.5" />
            </Link>
          </Button>
          </div>

          <div className="mt-9 flex items-center gap-3">
            <div className="flex -space-x-2.5">
              {SOCIAL_PROOF_AVATARS.map((avatar) => (
                <div
                  key={avatar.initials}
                  style={{ background: avatar.color }}
                  className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-background text-3xs font-bold text-white shadow-elev-2"
                >
                  {avatar.initials}
                </div>
              ))}
              <div className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-border bg-secondary text-xs font-semibold text-foreground shadow-sm">
                +
              </div>
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">
                {t("landing.main.socialProofTitle")}
              </p>
              <p className="text-xs text-muted-foreground">
                {t("landing.main.socialProofSubtitle")}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Right: 3D hero scene — the pipeline tower: five stacked decks
            (material → AI draft → approval → class → analytics) on a glowing
            spine, one short pulse riding bottom → top. Pointer interaction is
            fenced to this box. */}
        <motion.div className="relative" {...fade(0.15)}>
          <div className="relative mx-auto aspect-square w-full max-w-[600px] overflow-hidden sm:aspect-[5/4] lg:aspect-square">
            {/* Brand glow / WebGL fallback backdrop — two layers for depth: a soft
                frame-wide violet fill under a brighter, concentrated core behind the
                sheet + chart. Also the graceful fallback when WebGL is unavailable. */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 rounded-[36px] bg-[radial-gradient(92%_84%_at_50%_50%,color-mix(in_srgb,var(--brand)_12%,transparent),transparent_74%)] dark:bg-[radial-gradient(92%_84%_at_50%_50%,color-mix(in_srgb,var(--brand)_15%,transparent),transparent_74%)]"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 rounded-[36px] bg-[radial-gradient(54%_48%_at_50%_44%,color-mix(in_srgb,var(--brand)_30%,transparent),transparent_66%)] dark:bg-[radial-gradient(54%_48%_at_50%_44%,color-mix(in_srgb,var(--brand)_28%,transparent),transparent_66%)]"
            />
            {/* Labels are drawn onto the 3D surfaces themselves (see HeroScene),
                so the narrative reads as part of the model, not as floating tags. */}
            <HeroScene
              className="absolute inset-0 h-full w-full"
              labels={{
                quiz: t("landing.main.scene.quiz"),
                review: t("landing.teacherControl.stepReview"),
                approved: t("landing.teacherControl.stepApprove"),
                graded: t("landing.main.scene.graded"),
                average: t("landing.main.scene.average"),
              }}
            />
            <span className="sr-only">{t("landing.main.scene.alt")}</span>
          </div>
        </motion.div>
      </div>

      {/* School / learning-center positioning band — a flowing ribbon of real use
          cases. The continuous scroll reads as "and everything in between". */}
      <SchoolsBand reduceMotion={!!shouldReduceMotion} />
    </section>
  );
}

/** Renders one pass of the use-case ribbon: a violet spark before each phrase. */
function UseCaseItems() {
  const { t } = useTranslation();
  return (
    <>
      {USE_CASES.map((key) => (
        <li key={key} className="flex items-center gap-3 whitespace-nowrap">
          <Sparkle className="h-3.5 w-3.5 shrink-0 text-primary" fill="currentColor" />
          <span className="text-lg font-medium text-foreground/80 sm:text-xl">
            {t(`landing.main.useCases.${key}`)}
          </span>
        </li>
      ))}
    </>
  );
}

function SchoolsBand({ reduceMotion }: { reduceMotion: boolean }) {
  const { t } = useTranslation();
  const edgeFade = {
    maskImage: "linear-gradient(to right, transparent, #000 8%, #000 92%, transparent)",
    WebkitMaskImage: "linear-gradient(to right, transparent, #000 8%, #000 92%, transparent)",
  };

  return (
    <motion.div
      className="mx-auto mt-24 w-full max-w-6xl border-t border-border/60 pt-12"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, amount: 0.4 }}
      transition={{ duration: 0.6 }}
    >
      <p className="mx-auto max-w-2xl text-center text-sm font-medium text-muted-foreground">
        {t("landing.main.schoolsTitle")}
      </p>

      {reduceMotion ? (
        <ul className="mt-7 flex flex-wrap items-center justify-center gap-x-8 gap-y-3.5">
          <UseCaseItems />
        </ul>
      ) : (
        <div className="landing-marquee group relative mt-7 flex overflow-hidden" style={edgeFade}>
          <div className="landing-marquee-track flex w-max items-center">
            <ul className="flex w-max items-center gap-x-10 pr-10">
              <UseCaseItems />
            </ul>
            <ul aria-hidden className="flex w-max items-center gap-x-10 pr-10">
              <UseCaseItems />
            </ul>
          </div>
        </div>
      )}
    </motion.div>
  );
}

export default MainPage;
