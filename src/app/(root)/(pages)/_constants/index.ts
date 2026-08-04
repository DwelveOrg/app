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

export const examItems: ExamItem[] = [
  {
    id: "exam-01",
    title: "root.exams.items.midterm.title",
    subject: "root.exams.items.midterm.subject",
    instructor: "root.exams.items.midterm.instructor",
    date: "March 28, 2026",
    time: "09:30 AM",
    deadline: "March 27, 2026 • 11:59 PM",
    durationMinutes: 75,
    questions: 42,
    totalMarks: 100,
    passingScore: 65,
    completed: false,
  },
  {
    id: "exam-02",
    title: "root.exams.items.codeSprint.title",
    subject: "root.exams.items.codeSprint.subject",
    instructor: "root.exams.items.codeSprint.instructor",
    date: "March 20, 2026",
    time: "02:00 PM",
    deadline: "March 20, 2026 • 01:30 PM",
    durationMinutes: 60,
    questions: 30,
    totalMarks: 80,
    passingScore: 60,
    completed: false,
  },
  {
    id: "exam-03",
    title: "root.exams.items.historyFinal.title",
    subject: "root.exams.items.historyFinal.subject",
    instructor: "root.exams.items.historyFinal.instructor",
    date: "March 11, 2026",
    time: "11:00 AM",
    deadline: "March 10, 2026 • 11:59 PM",
    durationMinutes: 90,
    questions: 55,
    totalMarks: 120,
    passingScore: 70,
    completed: true,
  },
];
