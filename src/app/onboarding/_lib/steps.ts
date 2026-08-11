import {
  BarChart3,
  BookOpenCheck,
  Compass,
  GraduationCap,
  LayoutGrid,
  MailCheck,
  School,
  Sparkles,
  UserPlus,
  Users,
  type LucideIcon,
} from "lucide-react";

import type { SchoolRole } from "@/app/(authentication)/_types/auth";

/**
 * Which journey the account is on.
 *
 * `access` is for an account with no membership yet — it is choosing how to get
 * into a school. `role` is the tour for an account that already belongs to one,
 * whether it just joined or created the school months ago.
 */
export type OnboardingFlow = "access" | "role";

export type StepKey = string;

export type StepDef = {
  key: StepKey;
  icon: LucideIcon;
  /**
   * True when the thing this step asks for already exists. A returning admin
   * who created classes long ago should see that step settled, not be asked to
   * do it again.
   */
  done?: boolean;
};

/** The account has no membership: pick a way in, then use it. */
export const ACCESS_STEPS: StepDef[] = [
  { key: "welcome", icon: Sparkles },
  { key: "path", icon: Compass },
  { key: "connect", icon: MailCheck },
];

const ROLE_STEPS: Record<SchoolRole, StepDef[]> = {
  ADMIN: [
    { key: "ready", icon: School },
    { key: "class", icon: LayoutGrid },
    { key: "people", icon: UserPlus },
    { key: "workspace", icon: BarChart3 },
  ],
  TEACHER: [
    { key: "ready", icon: School },
    { key: "classes", icon: Users },
    { key: "tests", icon: BookOpenCheck },
    { key: "analytics", icon: BarChart3 },
  ],
  STUDENT: [
    { key: "ready", icon: School },
    { key: "classes", icon: GraduationCap },
    { key: "assignments", icon: BookOpenCheck },
    { key: "progress", icon: BarChart3 },
  ],
};

export type WorkspaceFacts = {
  /** Classes visible to this member — taught, enrolled, or owned. */
  classCount: number;
  /** Whether the school has a student join code to share. */
  hasJoinCode: boolean;
  /** Classes a student could still request to join. */
  availableClasses: number;
};

/**
 * Resolves the steps for the current member, marking the ones whose work is
 * already done.
 *
 * This is what makes the page read correctly for an account that is already
 * part of a school: the same four steps appear, but the ones it has outgrown
 * are settled rather than nagging, so the tour is a summary instead of a
 * checklist it has already completed.
 */
export function resolveSteps(
  flow: OnboardingFlow,
  role: SchoolRole | null,
  facts: WorkspaceFacts,
): StepDef[] {
  if (flow === "access" || !role) {
    return ACCESS_STEPS;
  }

  return ROLE_STEPS[role].map((step) => {
    switch (step.key) {
      // The member is looking at the page, so access plainly exists.
      case "ready":
        return { ...step, done: true };
      case "class":
      case "classes":
        return { ...step, done: facts.classCount > 0 };
      case "people":
        return { ...step, done: facts.hasJoinCode && facts.classCount > 0 };
      default:
        return step;
    }
  });
}

/** Clamps a persisted resume point to a step that currently exists. */
export function clampStep(step: number, total: number) {
  if (!Number.isFinite(step)) return 0;
  return Math.min(Math.max(Math.trunc(step), 0), Math.max(total - 1, 0));
}
