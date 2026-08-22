"use client";

import React from "react";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { motion, useReducedMotion } from "motion/react";
import { ArrowRight, Check } from "lucide-react";

import Button from "@/components/ui/Button";

/**
 * The page's closing band.
 *
 * Nine sections have argued the case on the product's own surfaces — canvas,
 * card, hairline. This is where the page stops arguing and asks, so it is the
 * one place the landing goes fully brand: a deep violet slab (`.cta-band` in
 * globals.css) that reads as the bottom of the document rather than as one more
 * panel on it.
 *
 * It is a split, not a centred stack. The centred heading-subtitle-buttons block
 * is the default shape of every SaaS closing CTA, and it leaves the last
 * objections — *what does it cost, what do I have to install, how long is this
 * going to take* — unanswered at the exact moment they are loudest. The right
 * column answers all three before the visitor has to ask, which is worth more
 * than the symmetry it costs.
 *
 * The band is the same slab in both themes; see the note on `.cta-band` for why
 * the copy on it is plain white rather than a theme token.
 */

const POINTS = ["point1", "point2", "point3"] as const;

export default function CallToAction() {
  const { t } = useTranslation();
  const shouldReduceMotion = useReducedMotion();

  return (
    <section id="cta" className="w-full scroll-mt-24 px-4 py-24 sm:px-6 md:py-32">
      <motion.div
        className="cta-band relative mx-auto max-w-6xl overflow-hidden rounded-3xl px-6 py-14 sm:px-12 sm:py-16 lg:px-16 lg:py-20"
        initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.35 }}
        transition={{ duration: 0.5 }}
      >
        {/* Ruled paper, masked so it dies before every edge. */}
        <div aria-hidden="true" className="cta-rules pointer-events-none absolute inset-0" />

        <div className="relative grid gap-10 lg:grid-cols-[1.15fr_minmax(0,0.85fr)] lg:items-center lg:gap-16">
          <div>
            <p className="type-micro text-white/70">{t("landing.cta.eyebrow")}</p>

            <h2 className="mt-4 text-balance text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-[2.6rem] lg:leading-[1.08]">
              {t("landing.cta.title")}
            </h2>

            <p className="mt-4 max-w-lg text-base leading-relaxed text-white/75">
              {t("landing.cta.subtitle")}
            </p>

            <div className="mt-9 flex flex-wrap items-center gap-3">
              <Button asChild variant="inverse" size="xl">
                <Link href="/signup">{t("landing.cta.primary")}</Link>
              </Button>
              <Button asChild variant="inverse-ghost" size="xl">
                <Link href="#how-it-works">
                  {t("landing.cta.secondary")}
                  <ArrowRight className="transition-transform duration-[var(--dur-2)] group-hover/button:translate-x-0.5" />
                </Link>
              </Button>
            </div>
          </div>

          {/* The last three objections, answered without being asked. A hairline
              rather than a card: a panel here would read as a second surface on
              a surface, and the band is meant to be one plane. */}
          <ul className="space-y-4 border-t border-white/15 pt-8 lg:border-l lg:border-t-0 lg:pl-12 lg:pt-0">
            {POINTS.map((key) => (
              <li key={key} className="flex items-start gap-3">
                <span
                  aria-hidden="true"
                  className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-white/15"
                >
                  <Check className="size-3 text-white" strokeWidth={3} />
                </span>
                <span className="text-sm leading-relaxed text-white/85">
                  {t(`landing.cta.${key}`)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </motion.div>
    </section>
  );
}
