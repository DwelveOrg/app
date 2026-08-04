"use client";

import React from "react";
import { motion, useReducedMotion } from "motion/react";

import { cn } from "@/lib/utils";

type SectionHeadingProps = {
  /** Optional kicker. Used sparingly — not every section carries one, by design. */
  label?: string;
  title: string;
  subtitle?: string;
  align?: "center" | "left";
  className?: string;
};

/**
 * Shared heading for the landing sections: optional kicker, title, subtitle.
 * One source of truth for the marketing type scale and entrance motion so the
 * new sections read as a single system rather than copy-pasted Tailwind.
 */
/**
 * The marketing heading style. Four sections bypassed `SectionHeading` and re-declared this exact
 * string inline, so a change here used to reach only some of the page.
 */
export const LANDING_HEADING =
  "text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl";

export default function SectionHeading({
  label,
  title,
  subtitle,
  align = "center",
  className,
}: SectionHeadingProps) {
  const shouldReduceMotion = useReducedMotion();
  const isCenter = align === "center";

  return (
    <motion.div
      className={cn(isCenter ? "mx-auto max-w-2xl text-center" : "max-w-xl text-left", className)}
      initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.5 }}
      transition={{ duration: 0.45 }}
    >
      {label ? (
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
          {label}
        </p>
      ) : null}
      <h2
        className={cn(
          LANDING_HEADING,
          label && "mt-3",
        )}
      >
        {title}
      </h2>
      {subtitle ? (
        <p
          className={cn(
            "mt-4 text-base leading-relaxed text-muted-foreground",
            isCenter && "mx-auto max-w-2xl",
          )}
        >
          {subtitle}
        </p>
      ) : null}
    </motion.div>
  );
}
