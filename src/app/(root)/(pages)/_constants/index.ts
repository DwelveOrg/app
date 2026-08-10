import { type Variants } from "motion/react";

const entryEase = [0.22, 1, 0.36, 1] as const;

export const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.04,
    },
  },
};

export const itemVariants: Variants = {
  hidden: { opacity: 0, y: 18 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.26, ease: entryEase },
  },
};

/**
 * Reduced-motion equivalents.
 *
 * `prefers-reduced-motion` is a hard requirement (design-system §5), and a staggered translate is
 * exactly the kind of motion it exists to suppress. Callers select with `useReducedMotion()`;
 * content still ends up visible, it just arrives at once instead of sliding in.
 */
export const staticContainerVariants: Variants = {
  hidden: { opacity: 1 },
  show: { opacity: 1 },
};

export const staticItemVariants: Variants = {
  hidden: { opacity: 1, y: 0 },
  show: { opacity: 1, y: 0 },
};
