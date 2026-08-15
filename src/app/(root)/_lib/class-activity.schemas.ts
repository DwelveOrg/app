import { z } from "zod";


export const classActivityTypeSchema = z.enum([
  "TEST_SUBMITTED",
  "TEST_STARTED",
  "STUDENT_JOINED",
  "TEST_PUBLISHED",
]);
export type ClassActivityType = z.infer<typeof classActivityTypeSchema>;

export const classActivityItemSchema = z
  .object({
    id: z.string(),
    type: classActivityTypeSchema,
    at: z.string(),
    actor: z
      .object({
        id: z.string(),
        fullName: z.string(),
        avatarUrl: z.string().nullable().optional(),
      })
      .nullable()
      .optional(),
    test: z.object({ id: z.string(), title: z.string() }).nullable().optional(),
    attemptId: z.string().optional(),
    isLate: z.boolean().nullable().optional(),
    score: z.number().nullable().optional(),
    maxScore: z.number().nullable().optional(),
  })
  .passthrough();
export type ClassActivityItem = z.infer<typeof classActivityItemSchema>;

export const classActivityResponseSchema = z
  .object({ items: z.array(classActivityItemSchema).default([]) })
  .passthrough();
export type ClassActivityResponse = z.infer<typeof classActivityResponseSchema>;
