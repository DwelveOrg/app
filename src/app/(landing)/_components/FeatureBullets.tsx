"use client";

import React from "react";
import { Check } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";

import { cn } from "@/lib/utils";

/**
 * Check-marked benefit list shared by the AI, teacher-control, and analytics
 * sections. Staggered reveal over an already-visible default, so the content
 * ships even if the in-view transition never fires.
 */
export default function FeatureBullets({ items, className }: { items: string[]; className?: string }) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.ul
      className={cn("space-y-3.5", className)}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.3 }}
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: shouldReduceMotion ? 0 : 0.07 } },
      }}
    >
      {items.map((item) => (
        <motion.li
          key={item}
          className="flex items-start gap-3"
          variants={{
            hidden: { opacity: 0, x: shouldReduceMotion ? 0 : -10 },
            visible: { opacity: 1, x: 0, transition: { duration: 0.35 } },
          }}
        >
          <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground">
            <Check className="h-3.5 w-3.5" strokeWidth={3} />
          </span>
          <span className="text-15 leading-relaxed text-muted-foreground">{item}</span>
        </motion.li>
      ))}
    </motion.ul>
  );
}
