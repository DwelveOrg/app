import { z } from "zod";

/**
 * Zod schemas for the dashboard aggregate endpoints (`/api/v1/dashboard/*`).
 * Shapes mirror the NestJS `DashboardService` responses exactly. All are
 * role-scoped on the backend (student → self, teacher → their classes, admin →
 * whole school). `.passthrough()` keeps forward-compatible fields from failing.
 *
 * Attendance remains intentionally unavailable. Submission analytics are
 * derived only from modern TestAttempt records; the legacy Result model does
 * not contain enough timing information to infer them safely.
 */

/** `GET /dashboard/summary` for ADMIN / TEACHER. */
export const staffDashboardSummarySchema = z
  .object({
    students: z.number(),
    classes: z.number(),
    exams: z.number(),
    assessments: z.number().optional(),
    teachers: z.number(),
    avgScore: z.number(),
    scoredResults: z.number().optional(),
    completedAttempts: z.number().optional(),
    completionRate: z.number().nullable().optional(),
    pendingGrading: z.number().optional(),
  })
  .passthrough();

/** `GET /dashboard/summary` for STUDENT. */
export const studentDashboardSummarySchema = z
  .object({
    enrolledCourses: z.number(),
    dueThisWeek: z.number(),
    myAverage: z.number(),
    assessments: z.number().optional(),
    completedAssessments: z.number().optional(),
    inProgressAssessments: z.number().optional(),
    attendancePct: z.number().nullable(),
  })
  .passthrough();

/** `GET /dashboard/score-trend?months=N` — monthly average, oldest first. */
export const scoreTrendSchema = z
  .object({
    points: z.array(
      z.object({
        /** `YYYY-MM`. */
        month: z.string(),
        /** Percentage average for the month, 0–100. */
        avg: z.number(),
      }),
    ),
  })
  .passthrough();

export const gradeBucketSchema = z.enum(["A", "B", "C", "D/F"]);

/** `GET /dashboard/distributions`. */
export const distributionsSchema = z
  .object({
    grades: z.array(
      z.object({
        bucket: gradeBucketSchema,
        count: z.number(),
      }),
    ),
    membersByRole: z.object({
      students: z.number(),
      teachers: z.number(),
      admins: z.number(),
    }),
  })
  .passthrough();

/**
 * `GET /dashboard/submissions?range=week` — modern test submission state for
 * tests whose due date fell in the rolling seven-day window.
 */
export const submissionsSchema = z
  .object({
    byClass: z.array(
      z.object({
        classId: z.string(),
        className: z.string(),
        onTime: z.number(),
        late: z.number(),
        missing: z.number(),
      }),
    ),
  })
  .passthrough();

/** `GET /dashboard/class-performance` — role-scoped class comparison rows. */
export const classPerformanceSchema = z
  .object({
    classes: z.array(
      z.object({
        classId: z.string(),
        className: z.string(),
        studentCount: z.number(),
        completedAssessments: z.number(),
        averageScore: z.number().nullable(),
        completionRate: z.number().nullable(),
      }),
    ),
  })
  .passthrough();

/** `GET /dashboard/feed`. `recent.meta` is the raw notification payload. */
export const dashboardFeedSchema = z
  .object({
    upcoming: z.array(
      z.object({
        id: z.string(),
        title: z.string(),
        dueAt: z.union([z.string(), z.date()]),
        kind: z.string(),
        timing: z.enum(["DUE", "OPENS"]).optional(),
        href: z.string().nullable().optional(),
      }),
    ),
    recent: z.array(
      z.object({
        id: z.string(),
        title: z.string(),
        meta: z.unknown().nullable().optional(),
        at: z.union([z.string(), z.date()]),
        kind: z.string(),
        href: z.string().nullable().optional(),
      }),
    ),
  })
  .passthrough();

export type StaffDashboardSummary = z.infer<typeof staffDashboardSummarySchema>;
export type StudentDashboardSummary = z.infer<typeof studentDashboardSummarySchema>;
export type ScoreTrend = z.infer<typeof scoreTrendSchema>;
export type GradeBucket = z.infer<typeof gradeBucketSchema>;
export type Distributions = z.infer<typeof distributionsSchema>;
export type Submissions = z.infer<typeof submissionsSchema>;
export type ClassPerformance = z.infer<typeof classPerformanceSchema>;
export type DashboardFeed = z.infer<typeof dashboardFeedSchema>;
