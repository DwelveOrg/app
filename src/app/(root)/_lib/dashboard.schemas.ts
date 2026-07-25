import { z } from "zod";

/**
 * Zod schemas for the dashboard aggregate endpoints (`/api/v1/dashboard/*`).
 * Shapes mirror the NestJS `DashboardService` responses exactly. All are
 * role-scoped on the backend (student → self, teacher → their classes, admin →
 * whole school). `.passthrough()` keeps forward-compatible fields from failing.
 *
 * Two fields are intentionally "unavailable" on the backend today and must be
 * treated as empty, never faked:
 *   - `studentDashboardSummary.attendancePct` is always `null` (attendance is
 *     not modelled yet).
 *   - `submissions.byClass` is always `[]` (results carry no due/late/submitted
 *     timestamps, so on-time/late/missing cannot be derived).
 */

/** `GET /dashboard/summary` for ADMIN / TEACHER. */
export const staffDashboardSummarySchema = z
  .object({
    students: z.number(),
    classes: z.number(),
    exams: z.number(),
    teachers: z.number(),
    avgScore: z.number(),
  })
  .passthrough();

/** `GET /dashboard/summary` for STUDENT. */
export const studentDashboardSummarySchema = z
  .object({
    enrolledCourses: z.number(),
    dueThisWeek: z.number(),
    myAverage: z.number(),
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
 * `GET /dashboard/submissions?range=week`. The backend returns an empty
 * `byClass` today (see note above); the schema is ready for when the data model
 * gains submission timestamps.
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

/** `GET /dashboard/feed`. `recent.meta` is the raw notification payload. */
export const dashboardFeedSchema = z
  .object({
    upcoming: z.array(
      z.object({
        id: z.string(),
        title: z.string(),
        dueAt: z.union([z.string(), z.date()]),
        kind: z.string(),
      }),
    ),
    recent: z.array(
      z.object({
        id: z.string(),
        title: z.string(),
        meta: z.unknown().nullable().optional(),
        at: z.union([z.string(), z.date()]),
        kind: z.string(),
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
export type DashboardFeed = z.infer<typeof dashboardFeedSchema>;
