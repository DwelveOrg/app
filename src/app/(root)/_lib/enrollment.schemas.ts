import { z } from "zod";

import {
  classItemSchema,
  enrollmentModeSchema,
  paginationMetaSchema,
} from "./classes.schemas";

/**
 * Zod schemas for the V1 class-enrollment API (see
 * `docs/features/DWELVE_CLASS_ENROLLMENT_FRONTEND.md`). Shapes mirror the NestJS
 * `ClassesService` sanitizers exactly. `.passthrough()` keeps forward-compatible
 * backend-owned fields (timestamps, ids) from failing validation.
 */

/** Enrollment lifecycle status shared by every enrollment surface. */
export const enrollmentStatusSchema = z.enum([
  "PENDING",
  "ACTIVE",
  "REJECTED",
  "CANCELLED",
  "REMOVED",
  "COMPLETED",
]);
export type EnrollmentStatus = z.infer<typeof enrollmentStatusSchema>;

/**
 * How a class admits students. Drives the directory-card call to action.
 * Defined with the class schemas (every class payload carries it) and
 * re-exported here so the enrollment surfaces have one import site.
 */
export { enrollmentModeSchema };
export type { EnrollmentMode } from "./classes.schemas";

/**
 * Pagination envelope returned by every paginated enrollment list. Declared with
 * the class schemas (the class-scoped pickers share it) and re-exported here so
 * the enrollment surfaces keep one import site.
 */
export { paginationMetaSchema };
export type { PaginationMeta } from "./classes.schemas";

/* -------------------------------------------------------------------------- */
/* Student overview                                                            */
/* -------------------------------------------------------------------------- */

/** `GET /schools/:schoolId/student-overview` - student-visible summary. */
export const studentOverviewResponseSchema = z
  .object({
    school: z
      .object({
        id: z.string(),
        name: z.string(),
        logoUrl: z.string().nullable().optional(),
        studentVisibleDescription: z.string().nullable().optional(),
      })
      .passthrough(),
    counts: z.object({
      availableClasses: z.number(),
      activeClasses: z.number(),
      pendingRequests: z.number(),
    }),
  })
  .passthrough();
export type StudentOverviewResponse = z.infer<typeof studentOverviewResponseSchema>;

/* -------------------------------------------------------------------------- */
/* Discover classes                                                            */
/* -------------------------------------------------------------------------- */

/** Primary teacher summary attached to a discoverable class. */
export const discoverTeacherSchema = z
  .object({
    id: z.string(),
    userId: z.string(),
    name: z.string(),
    avatarUrl: z.string().nullable().optional(),
  })
  .passthrough();

/** One card in the student class list (`GET /classes`, STUDENT caller). */
export const discoverableClassSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    description: z.string().nullable().optional(),
    pictureUrl: z.string().nullable().optional(),
    teacher: discoverTeacherSchema.nullable().optional(),
    enrollmentMode: enrollmentModeSchema,
    studentEnrollmentStatus: enrollmentStatusSchema.nullable().optional(),
    canRequest: z.boolean(),
    // `canEnter` gates opening the class detail; the backend returns 403 on
    // `GET /classes/:classId` when it is false, so the UI must not offer entry.
    canEnter: z.boolean(),
    capacity: z.number().nullable().optional(),
    activeStudentCount: z.number(),
  })
  .passthrough();
export type DiscoverableClass = z.infer<typeof discoverableClassSchema>;

/**
 * `GET /classes` for a STUDENT returns every active class in the selected
 * school as a flat list — no pagination envelope, no server-side search.
 * Filtering happens client-side.
 */
export const studentClassesResponseSchema = z.object({
  classes: z.array(discoverableClassSchema),
});
export type StudentClassesResponse = z.infer<typeof studentClassesResponseSchema>;

/* -------------------------------------------------------------------------- */
/* Enrollments (student requests, class join-requests)                         */
/* -------------------------------------------------------------------------- */

/** The student attached to an enrollment row (`StudentProfile` projection). */
export const enrollmentPersonSchema = z
  .object({
    id: z.string(),
    memberId: z.string().nullable().optional(),
    userId: z.string().optional(),
    fullName: z.string(),
    email: z.string().optional(),
    role: z.string().optional(),
  })
  .passthrough();

/** A full enrollment row: request/roster state plus its student and class. */
export const enrollmentSchema = z
  .object({
    id: z.string(),
    schoolId: z.string(),
    classId: z.string(),
    studentId: z.string(),
    status: enrollmentStatusSchema,
    method: z.string().optional(),
    message: z.string().nullable().optional(),
    rejectionReason: z.string().nullable().optional(),
    requestedAt: z.union([z.string(), z.date()]).nullable().optional(),
    reviewedAt: z.union([z.string(), z.date()]).nullable().optional(),
    createdAt: z.union([z.string(), z.date()]).optional(),
    updatedAt: z.union([z.string(), z.date()]).optional(),
    student: enrollmentPersonSchema,
    class: classItemSchema,
  })
  .passthrough();
export type ClassEnrollmentItem = z.infer<typeof enrollmentSchema>;

/** `GET /me/class-enrollments` and `GET /classes/:id/join-requests`. */
export const listEnrollmentsResponseSchema = z.object({
  enrollments: z.array(enrollmentSchema),
  meta: paginationMetaSchema,
});
export type ListEnrollmentsResponse = z.infer<typeof listEnrollmentsResponseSchema>;

/** `GET /me/classes?status=ACTIVE` - active roster classes only. */
export const myClassesResponseSchema = z.object({
  classes: z.array(classItemSchema),
});
export type MyClassesResponse = z.infer<typeof myClassesResponseSchema>;

/** Lightweight enrollment returned by request/cancel/assign mutations. */
export const enrollmentSummarySchema = z
  .object({
    id: z.string(),
    classId: z.string(),
    studentId: z.string(),
    status: enrollmentStatusSchema,
  })
  .passthrough();

export const enrollmentMutationResponseSchema = z.object({
  enrollment: enrollmentSummarySchema,
});
export type EnrollmentMutationResponse = z.infer<typeof enrollmentMutationResponseSchema>;

/* -------------------------------------------------------------------------- */
/* Server-action input schemas                                                 */
/* -------------------------------------------------------------------------- */

const MESSAGE_MAX = 500;

export const requestJoinClassSchema = z.object({
  classId: z.string().min(1),
  message: z.string().trim().max(MESSAGE_MAX).optional(),
});
export type RequestJoinClassInput = z.infer<typeof requestJoinClassSchema>;

export const cancelJoinRequestSchema = z.object({
  classId: z.string().min(1),
});
export type CancelJoinRequestInput = z.infer<typeof cancelJoinRequestSchema>;

export const approveEnrollmentSchema = z.object({
  enrollmentId: z.string().min(1),
});
export type ApproveEnrollmentInput = z.infer<typeof approveEnrollmentSchema>;

export const rejectEnrollmentSchema = z.object({
  enrollmentId: z.string().min(1),
  reason: z.string().trim().max(MESSAGE_MAX).optional(),
});
export type RejectEnrollmentInput = z.infer<typeof rejectEnrollmentSchema>;

export const assignStudentSchema = z.object({
  classId: z.string().min(1),
  studentId: z.string().min(1),
});
export type AssignStudentInput = z.infer<typeof assignStudentSchema>;

export const removeStudentSchema = z.object({
  classId: z.string().min(1),
  studentId: z.string().min(1),
});
export type RemoveStudentInput = z.infer<typeof removeStudentSchema>;
