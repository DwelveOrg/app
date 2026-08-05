import { type Variants } from "motion/react";
import type { ExamItem, ExamTab } from "../_types";

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

export const examTabs: ExamTab[] = ["active", "completed"];

export const examTabLabelKeys: Record<ExamTab, string> = {
  active: "root.exams.tabs.active",
  completed: "root.exams.tabs.completed",
};

/**
 * Empty until `/assignments` is wired to the backend.
 *
 * This previously held three hard-coded exams — "Midterm", "Code Sprint",
 * "History Final" — with invented dates, durations, question counts and
 * `passingScore` values. The route sits in `protectedRoutes` and is reachable
 * by URL while the sidebar renders Assignments as a disabled "Coming soon", so
 * a signed-in user who typed the URL was shown fabricated marks as if they were
 * their own.
 *
 * That also contradicted the rule the dashboard already follows: see
 * `dashboard/page.tsx`, which renders an em dash rather than a fake zero
 * precisely so nothing on screen is a number the backend did not supply.
 *
 * `assignments/exams/page.tsx` already branches on `length === 0` and renders
 * `<Empty />`, so this needs no call-site change. Populate it from the API when
 * the feature lands — do not re-add literals here.
 */
export const examItems: ExamItem[] = [];
