"use client";

import type { ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";
import type { LucideIcon } from "lucide-react";

import SectionHeader from "@/app/(root)/_components/SectionHeader";
import Surface from "@/components/ui/Surface";

const MotionSurface = motion.create(Surface);

const entryEase = [0.22, 1, 0.36, 1] as const;

/**
 * A titled panel: surface + icon header + body.
 *
 * Both halves are now shared — `Surface` owns the container and `SectionHeader` owns the icon-chip
 * header that seven other files were each writing out by hand.
 */
export function SectionCard({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  children: ReactNode;
}) {
  const reduce = useReducedMotion();

  return (
    <MotionSurface
      as="section"
      initial={reduce ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduce ? 0 : 0.26, ease: entryEase }}
    >
      <SectionHeader icon={Icon} title={title} description={description} />
      <div className="mt-6 space-y-4">{children}</div>
    </MotionSurface>
  );
}
