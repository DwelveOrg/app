import { z } from "zod";

import { classItemSchema } from "./classes.schemas";
import { paginationMetaSchema } from "./enrollment.schemas";

/**
 * Zod schemas for the teacher class-request API (see
 * `docs/features/teacher-class-requests.md`). Teachers now receive every active
 * class in their selected school from `GET /classes`, each carrying three extra
 * fields that drive the request/enter call to action. Admins review pending
 * teacher requests via the `class-teacher-requests` endpoints. Shapes mirror the
 * NestJS `ClassesService` sanitizers exactly; `.passthrough()` keeps
 * backend-owned extras (timestamps, ids) from failing validation.
 */

/** Teacher-request lifecycle status. Distinct from the student enrollment enum. */
export const teacherRequestStatusSchema = z.enum([
  "PENDING",
  "APPROVED",
  "REJECTED",
  "CANCELLED",
  "REMOVED",
]);
export type TeacherRequestStatus = z.infer<typeof teacherRequestStatusSchema>;

/* -------------------------------------------------------------------------- */
/* Teacher class list (`GET /classes`, TEACHER caller)                         */
/* -------------------------------------------------------------------------- */

/**
 * One class in the teacher-visible list. It is the full sanitized class plus the
 * three request fields. `canEnter` is true only once an admin has assigned the
 * teacher; `canRequest` is true when they are not assigned and have no pending
 * request. The UI never reconstructs these rules — it consumes the flags.
 */
export const teacherClassSchema = classItemSchema.extend({
  teacherRequestStatus: teacherRequestStatusSchema.nullable(),
  canRequest: z.boolean(),
  canEnter: z.boolean(),
});
export type TeacherClass = z.infer<typeof teacherClassSchema>;

/** `GET /classes` for a TEACHER returns a flat list; search is client-side. */
export const teacherClassesResponseSchema = z.object({
  classes: z.array(teacherClassSchema),
});
export type TeacherClassesResponse = z.infer<typeof teacherClassesResponseSchema>;

/* -------------------------------------------------------------------------- */
/* Teacher requests (create/cancel summaries, admin review list)               */
/* -------------------------------------------------------------------------- */

/** Flat request returned by create/cancel/approve/reject (`{ request }`). */
export const teacherRequestSummarySchema = z
  .object({
    id: z.string(),
    schoolId: z.string(),
    classId: z.string(),
    teacherId: z.string(),
    status: teacherRequestStatusSchema,
    message: z.string().nullable().optional(),
    rejectionReason: z.string().nullable().optional(),
    requestedAt: z.union([z.string(), z.date()]).nullable().optional(),
    reviewedAt: z.union([z.string(), z.date()]).nullable().optional(),
    reviewedById: z.string().nullable().optional(),
    createdAt: z.union([z.string(), z.date()]).optional(),
    updatedAt: z.union([z.string(), z.date()]).optional(),
  })
  .passthrough();
export type TeacherRequestSummary = z.infer<typeof teacherRequestSummarySchema>;

/** The teacher attached to a review-list row. */
export const teacherRequestPersonSchema = z
  .object({
    id: z.string(),
    memberId: z.string(),
    userId: z.string(),
    fullName: z.string(),
    email: z.string(),
  })
  .passthrough();

/** A full request row in the admin review list (`GET .../teacher-join-requests`). */
export const teacherRequestSchema = teacherRequestSummarySchema.extend({
  teacher: teacherRequestPersonSchema,
});
export type TeacherRequestItem = z.infer<typeof teacherRequestSchema>;

/** `GET /classes/:classId/teacher-join-requests` - ADMIN paginated list. */
export const listTeacherRequestsResponseSchema = z.object({
  requests: z.array(teacherRequestSchema),
  meta: paginationMetaSchema,
});
export type ListTeacherRequestsResponse = z.infer<
  typeof listTeacherRequestsResponseSchema
>;

/** Wrapper returned by create/cancel/approve/reject. */
export const teacherRequestMutationResponseSchema = z.object({
  request: teacherRequestSummarySchema,
});
export type TeacherRequestMutationResponse = z.infer<
  typeof teacherRequestMutationResponseSchema
>;

/* -------------------------------------------------------------------------- */
/* Server-action input schemas                                                 */
/* -------------------------------------------------------------------------- */

const MESSAGE_MAX = 500;

export const requestToTeachSchema = z.object({
  classId: z.string().min(1),
  message: z.string().trim().max(MESSAGE_MAX).optional(),
});
export type RequestToTeachInput = z.infer<typeof requestToTeachSchema>;

export const cancelTeacherRequestSchema = z.object({
  classId: z.string().min(1),
});
export type CancelTeacherRequestInput = z.infer<typeof cancelTeacherRequestSchema>;

export const approveTeacherRequestSchema = z.object({
  requestId: z.string().min(1),
});
export type ApproveTeacherRequestInput = z.infer<typeof approveTeacherRequestSchema>;

export const rejectTeacherRequestSchema = z.object({
  requestId: z.string().min(1),
  reason: z.string().trim().max(MESSAGE_MAX).optional(),
});
export type RejectTeacherRequestInput = z.infer<typeof rejectTeacherRequestSchema>;
