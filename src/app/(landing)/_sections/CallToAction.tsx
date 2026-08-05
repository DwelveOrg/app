"use client";

import React from "react";
import { useTranslation } from "react-i18next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";

import Button from "@/components/ui/Button";
import { LANDING_HEADING } from "../_components/SectionHeading";

export default function CallToAction() {
  const { t } = useTranslation();
  const shouldReduceMotion = useReducedMotion();

  return (
    <section id="cta" className="w-full scroll-mt-24 px-4 py-24 md:py-32">
      <motion.div
        className="relative mx-auto max-w-4xl overflow-hidden rounded-[2rem] border border-border bg-secondary px-6 py-16 text-center sm:px-12 sm:py-20"
        initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.4 }}
        transition={{ duration: 0.5 }}
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 -top-24 mx-auto h-64 w-[34rem] max-w-full rounded-full bg-[radial-gradient(closest-side,color-mix(in_srgb,var(--brand)_22%,transparent),transparent)] blur-2xl"
        />
        <div className="relative">
          <h2 className={`mx-auto max-w-2xl ${LANDING_HEADING} lg:text-[2.75rem]`}>
            {t("landing.cta.title")}
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base text-muted-foreground sm:text-lg">
            {t("landing.cta.subtitle")}
          </p>

          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <Button asChild variant="brand" size="xl">
            <Link href="/signup">
              {t("landing.cta.primary")}
            </Link>
          </Button>
            <Button asChild variant="outline" size="xl">
            <Link href="#how-it-works">
              {t("landing.cta.secondary")}
            <ArrowRight className="transition-transform duration-[var(--dur-2)] group-hover/button:translate-x-0.5" />
            </Link>
          </Button>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
