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
