"use client";

import { motion, useReducedMotion } from "motion/react";

import {
  containerVariants,
  itemVariants,
  staticContainerVariants,
  staticItemVariants,
} from "../../_constants";
import type { ClassItem } from "../_types";
import ClassCard from "./ClassCard";

type ClassGridProps = {
  items: ClassItem[];
  isAdmin: boolean;
};

/**
 * Responsive, staggered grid of class cards. Shared by the Classes page and the School page's class
 * directory so both stay visually identical.
 */
export default function ClassGrid({ items, isAdmin }: ClassGridProps) {
  const reduce = useReducedMotion();

  return (
    <motion.div
      variants={reduce ? staticContainerVariants : containerVariants}
      initial="hidden"
      animate="show"
      className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
    >
      {items.map((item) => (
        <motion.div key={item.id} variants={reduce ? staticItemVariants : itemVariants}>
          <ClassCard item={item} isAdmin={isAdmin} />
        </motion.div>
      ))}
    </motion.div>
  );
}
