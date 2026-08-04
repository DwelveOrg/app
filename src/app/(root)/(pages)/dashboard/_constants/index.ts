import type { SchoolRole } from "@/app/(authentication)/_types/auth";

/**
 * Demo dashboard data. The backend does not yet expose grades, attendance,
 * upcoming deadlines, or an activity feed, so — like the pre-existing stat
 * placeholders — these are representative values. Numeric/letter *values* live
 * here (they are data, not copy); every label is looked up through i18n so all
 * three catalogs stay the single source of truth for text.
 */

/** Semantic tone shared by stat deltas, upcoming dots, and activity badges. */
export type Tone = "success" | "warning" | "info" | "primary" | "neutral";

export type DashboardStat = {
  /** i18n leaf under `root.dashboard.cards.<group>.<key>` giving `{ label, hint }`. */
  key: string;
  /** Demo value shown large (e.g. "6", "A-", "96%"). Data, not translated. */
  value: string;
  /** Colour of the supporting hint line. */
  tone: Tone;
};

/** Student-facing KPIs — mirrors the reference dashboard. */
export const STUDENT_STATS: readonly DashboardStat[] = [
  { key: "courses", value: "6", tone: "success" },
  { key: "pending", value: "4", tone: "warning" },
  { key: "grade", value: "A-", tone: "success" },
  { key: "attendance", value: "96%", tone: "success" },
];

/** Admin / teacher KPIs — the organisation-level numbers staff care about. */
export const STAFF_STATS: readonly DashboardStat[] = [
  { key: "students", value: "128", tone: "success" },
  { key: "classes", value: "6", tone: "neutral" },
  { key: "exams", value: "24", tone: "success" },
  { key: "avgScore", value: "76%", tone: "success" },
];

export function statsForRole(role: SchoolRole | undefined): readonly DashboardStat[] {
  return role === "ADMIN" || role === "TEACHER" ? STAFF_STATS : STUDENT_STATS;
}

/** A month's average, 0–100, used for both bar height and the hover value. */
export type TrendPoint = { monthKey: string; value: number };

export const GRADE_TREND: readonly TrendPoint[] = [
  { monthKey: "jan", value: 78 },
  { monthKey: "feb", value: 83 },
  { monthKey: "mar", value: 74 },
  { monthKey: "apr", value: 88 },
  { monthKey: "may", value: 92 },
  { monthKey: "jun", value: 96 },
];

export type UpcomingItem = { key: string; tone: Tone };

export const UPCOMING: readonly UpcomingItem[] = [
  { key: "math", tone: "warning" },
  { key: "physics", tone: "primary" },
  { key: "english", tone: "info" },
  { key: "history", tone: "neutral" },
];

export type ActivityItem = {
  key: string;
  /** Single-letter badge glyph. */
  initial: string;
  tone: Tone;
};

export const RECENT_ACTIVITY: readonly ActivityItem[] = [
  { key: "quiz", initial: "C", tone: "success" },
  { key: "material", initial: "B", tone: "info" },
  { key: "assignment", initial: "A", tone: "primary" },
  { key: "announcement", initial: "P", tone: "neutral" },
];

/**
 * Tone → Tailwind class fragments. Kept in one place so a dot, a badge, and a
 * delta line for the same tone can never drift apart.
 *
 * These used to darken the semantic tokens toward black for small text, because the old fills
 * failed AA at label sizes on white. The v2 palette tunes every light semantic to clear 5:1 as
 * text *and* as a fill under white, so the plain token is now correct in both themes.
 */
export const TONE_TEXT: Record<Tone, string> = {
  success: "text-success",
  warning: "text-warning",
  info: "text-info",
  primary: "text-primary",
  neutral: "text-muted-foreground",
};

export const TONE_DOT: Record<Tone, string> = {
  success: "bg-success",
  warning: "bg-warning",
  info: "bg-info",
  primary: "bg-primary",
  neutral: "bg-muted-foreground",
};

export const TONE_BADGE: Record<Tone, string> = {
  success: "bg-[color-mix(in_srgb,var(--success)_14%,transparent)] text-success",
  warning: "bg-[color-mix(in_srgb,var(--warning)_14%,transparent)] text-warning",
  info: "bg-[color-mix(in_srgb,var(--info)_14%,transparent)] text-info",
  primary: "bg-[color-mix(in_srgb,var(--primary)_13%,transparent)] text-primary",
  neutral: "bg-muted text-muted-foreground",
};
