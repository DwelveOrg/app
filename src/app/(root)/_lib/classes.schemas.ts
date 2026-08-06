import { z } from "zod";

/**
 * Zod schemas for the classes API. Shapes mirror the NestJS
 * `ClassesService.sanitizeClass` payload exactly (see backend
 * `src/classes/classes.service.ts`). `.passthrough()` keeps forward-compatible
 * fields from failing validation.
 */

/**
 * How a class admits students. Lives here because `sanitizeClass` returns it on
 * every class payload; `enrollment.schemas.ts` re-exports it for the enrollment
 * surfaces (keeping the import one-directional).
 */
export const enrollmentModeSchema = z.enum([
  "REQUEST_APPROVAL",
  "DIRECT_ASSIGNMENT",
  "OPEN",
]);
export type EnrollmentMode = z.infer<typeof enrollmentModeSchema>;

/**
 * Pagination envelope returned by every paginated list in the class domain
 * (join requests, teacher requests, assignable-member pickers). It lives here
 * for the same reason `enrollmentModeSchema` does: `enrollment.schemas.ts`
 * re-exports it, so the import stays one-directional.
 */
export const paginationMetaSchema = z.object({
  page: z.number(),
  limit: z.number(),
  total: z.number(),
  totalPages: z.number(),
  hasMore: z.boolean(),
});
export type PaginationMeta = z.infer<typeof paginationMetaSchema>;

/** A teacher or student attached to a class, as returned by the backend. */
export const classPersonSchema = z
  .object({
    id: z.string(),
    assignmentId: z.string().optional(),
    memberId: z.string().nullable().optional(),
    userId: z.string().optional(),
    fullName: z.string(),
    email: z.string().optional(),
    role: z.string().optional(),
  })
  .passthrough();

export const classItemSchema = z
  .object({
    id: z.string(),
    schoolId: z.string(),
    name: z.string(),
    description: z.string().nullable().optional(),
    pictureUrl: z.string().nullable().optional(),
    isActive: z.boolean(),
    // How the class admits students and its optional seat limit. Both are
    // backend-owned and drive the class identity/overview copy.
    enrollmentMode: enrollmentModeSchema.optional(),
    capacity: z.number().nullable().optional(),
    teachers: z.array(classPersonSchema).default([]),
    students: z.array(classPersonSchema).default([]),
    counts: z
      .object({ teachers: z.number(), students: z.number() })
      .partial()
      .optional(),
    createdAt: z.union([z.string(), z.date()]).optional(),
    updatedAt: z.union([z.string(), z.date()]).optional(),
  })
  .passthrough();

/** `GET /classes` - role-filtered list (admin: all; teacher/student: own). */
export const classesResponseSchema = z.object({
  classes: z.array(classItemSchema),
});

/** `GET /classes/:id`, `POST /classes`, `PATCH /classes/:id` all wrap one class. */
export const classDetailResponseSchema = z.object({
  class: classItemSchema,
});

export type ApiClassPerson = z.infer<typeof classPersonSchema>;
export type ApiClass = z.infer<typeof classItemSchema>;
export type ClassesResponse = z.infer<typeof classesResponseSchema>;
export type ClassDetailResponse = z.infer<typeof classDetailResponseSchema>;

/* -------------------------------------------------------------------------- */
/* Assignable-member pickers                                                   */
/* -------------------------------------------------------------------------- */

/**
 * A school member who may still be added to this class. Both pickers are
 * class-scoped and server-paginated: the backend returns only active members of
 * the selected school who are not already on the class roster, so the UI never
 * filters a school-wide roster itself. `GET /students` is admin-only and must
 * not be used for a teacher's student picker.
 */
export const assignableStudentSchema = z
  .object({
    // `StudentProfile.id` - what `POST /classes/:classId/students` expects.
    id: z.string(),
    memberId: z.string(),
    userId: z.string(),
    fullName: z.string(),
    email: z.string(),
    studentCode: z.string().nullable().optional(),
    phone: z.string().nullable().optional(),
  })
  .passthrough();
export type AssignableStudent = z.infer<typeof assignableStudentSchema>;

export const assignableTeacherSchema = z
  .object({
    // `TeacherProfile.id` - what `POST /classes/:classId/teachers` expects.
    id: z.string(),
    memberId: z.string(),
    userId: z.string(),
    fullName: z.string(),
    email: z.string(),
    phone: z.string().nullable().optional(),
    bio: z.string().nullable().optional(),
  })
  .passthrough();
export type AssignableTeacher = z.infer<typeof assignableTeacherSchema>;

/** `GET /classes/:classId/assignable-students` - ADMIN + assigned TEACHER. */
export const assignableStudentsResponseSchema = z.object({
  students: z.array(assignableStudentSchema),
  meta: paginationMetaSchema,
});
export type AssignableStudentsResponse = z.infer<
  typeof assignableStudentsResponseSchema
>;

/** `GET /classes/:classId/assignable-teachers` - ADMIN only. */
export const assignableTeachersResponseSchema = z.object({
  teachers: z.array(assignableTeacherSchema),
  meta: paginationMetaSchema,
});
export type AssignableTeachersResponse = z.infer<
  typeof assignableTeachersResponseSchema
>;

/** `POST /classes/:classId/teachers` returns the created assignment row. */
export const classTeacherMutationResponseSchema = z.object({
  classTeacher: z
    .object({
      id: z.string(),
      classId: z.string(),
      teacherId: z.string(),
    })
    .passthrough(),
});

/* -------------------------------------------------------------------------- */
/* Server-action input schemas                                                 */
/* -------------------------------------------------------------------------- */

/** `teacherId` is the `TeacherProfile.id` the picker returns as `id`. */
export const addClassTeacherSchema = z.object({
  classId: z.string().min(1),
  teacherId: z.string().min(1),
});
export type AddClassTeacherInput = z.infer<typeof addClassTeacherSchema>;

export const removeClassTeacherSchema = z.object({
  classId: z.string().min(1),
  teacherId: z.string().min(1),
});
export type RemoveClassTeacherInput = z.infer<typeof removeClassTeacherSchema>;
