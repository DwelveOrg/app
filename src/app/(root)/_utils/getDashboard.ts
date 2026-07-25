import "server-only";

import type { SchoolRole } from "@/app/(authentication)/_types/auth";
import {
  getDashboardFeedRequest,
  getDistributionsRequest,
  getScoreTrendRequest,
  getStaffDashboardSummaryRequest,
  getStudentDashboardSummaryRequest,
} from "../_lib/dashboard.api";
import type {
  DashboardFeed,
  Distributions,
  ScoreTrend,
  StaffDashboardSummary,
  StudentDashboardSummary,
} from "../_lib/dashboard.schemas";

/**
 * Boolean availability of each data domain, derived from the real responses.
 * This is the input an adaptive dashboard composes from: a module renders its
 * live view when its domain is present, and its empty/CTA view (or hides) when
 * it is not. `hasSubmissions` and `hasAttendance` are wired but currently always
 * false — the backend does not model them yet (see dashboard.schemas.ts).
 */
export type DashboardAvailability = {
  hasClasses: boolean;
  hasStudents: boolean;
  hasResults: boolean;
  hasUpcoming: boolean;
  hasActivity: boolean;
  hasSubmissions: boolean;
  hasAttendance: boolean;
};

export type DashboardData = {
  role: SchoolRole;
  summary: StaffDashboardSummary | StudentDashboardSummary | null;
  trend: ScoreTrend | null;
  distributions: Distributions | null;
  feed: DashboardFeed | null;
  availability: DashboardAvailability;
};

/** Resolves a promise to its value, or `null` on any rejection (fail soft). */
async function safe<T>(promise: Promise<T>): Promise<T | null> {
  try {
    return await promise;
  } catch {
    return null;
  }
}

function isStudentSummary(
  summary: StaffDashboardSummary | StudentDashboardSummary | null,
): summary is StudentDashboardSummary {
  return summary != null && "enrolledCourses" in summary;
}

function deriveAvailability(
  role: SchoolRole,
  summary: StaffDashboardSummary | StudentDashboardSummary | null,
  trend: ScoreTrend | null,
  distributions: Distributions | null,
  feed: DashboardFeed | null,
): DashboardAvailability {
  const gradedResults =
    (trend?.points.length ?? 0) > 0 ||
    (distributions?.grades.some((grade) => grade.count > 0) ?? false);

  if (isStudentSummary(summary)) {
    return {
      hasClasses: summary.enrolledCourses > 0,
      hasStudents: false,
      hasResults: gradedResults || summary.myAverage > 0,
      hasUpcoming: (feed?.upcoming.length ?? 0) > 0 || summary.dueThisWeek > 0,
      hasActivity: (feed?.recent.length ?? 0) > 0,
      hasSubmissions: false,
      hasAttendance: summary.attendancePct != null,
    };
  }

  const staff = summary as StaffDashboardSummary | null;
  return {
    hasClasses: (staff?.classes ?? 0) > 0,
    hasStudents:
      (staff?.students ?? 0) > 0 ||
      (distributions?.membersByRole.students ?? 0) > 0,
    hasResults: gradedResults || (staff?.avgScore ?? 0) > 0,
    hasUpcoming: (feed?.upcoming.length ?? 0) > 0,
    hasActivity: (feed?.recent.length ?? 0) > 0,
    hasSubmissions: false,
    hasAttendance: false,
  };
}

/**
 * Fetches the dashboard payload for the current member and derives an
 * availability profile. Every request fails soft to `null`, so a partial
 * backend outage degrades individual panels to their empty state instead of
 * blanking the page. Call only for a member with an active school context (the
 * endpoints are school-guarded).
 */
export async function getDashboard(role: SchoolRole): Promise<DashboardData> {
  const summaryPromise: Promise<
    StaffDashboardSummary | StudentDashboardSummary
  > =
    role === "STUDENT"
      ? getStudentDashboardSummaryRequest()
      : getStaffDashboardSummaryRequest();

  const [summary, trend, distributions, feed] = await Promise.all([
    safe(summaryPromise),
    safe(getScoreTrendRequest(6)),
    safe(getDistributionsRequest()),
    safe(getDashboardFeedRequest()),
  ]);

  return {
    role,
    summary,
    trend,
    distributions,
    feed,
    availability: deriveAvailability(role, summary, trend, distributions, feed),
  };
}
