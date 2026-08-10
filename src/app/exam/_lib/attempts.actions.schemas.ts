import { z } from "zod";

import { answerValueSchema } from "@/lib/tests/answers";
import { violationTypeSchema } from "./attempts.schemas";

/**
 * Input schemas for the test-taking server actions.
 *
 * A plain module rather than the `"use server"` file, which may only export
 * async functions — the same split the rest of the product uses so the client
 * hooks can import the types.
 */

export const startAttemptSchema = z.object({
  testId: z.string().min(1),
  /** Required when `delivery.requireHonorCode`; the backend rejects it otherwise. */
  honorCodeAccepted: z.boolean().optional(),
});
export type StartAttemptInput = z.infer<typeof startAttemptSchema>;

export const saveAnswersSchema = z.object({
  attemptId: z.string().min(1),
  answers: z
    .array(
      z.object({
        questionId: z.string().min(1),
        /** `null` clears the answer, which is not the same as never answering. */
        value: answerValueSchema.nullable(),
        timeSpentSeconds: z.number().int().min(0).optional(),
      }),
    )
    .min(1)
    // One autosave carries at most the questions touched since the last one.
    // A cap keeps a wedged client from posting the whole paper every 2.5s.
    .max(60),
});
export type SaveAnswersInput = z.infer<typeof saveAnswersSchema>;

export const reportViolationSchema = z.object({
  attemptId: z.string().min(1),
  type: violationTypeSchema,
  occurredAt: z.string().min(1),
});
export type ReportViolationInput = z.infer<typeof reportViolationSchema>;

export const attemptIdSchema = z.object({ attemptId: z.string().min(1) });
export type AttemptIdInput = z.infer<typeof attemptIdSchema>;
