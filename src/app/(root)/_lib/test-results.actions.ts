"use server";

import { z } from "zod";

import { actionClient, ActionError } from "@/lib/safe-action";
import { BackendApiError, BackendResponseValidationError } from "@/lib/api/backend";
import {
  gradeAttemptRequest,
  listTestResultsRequest,
  releaseResultsRequest,
} from "./test-results.api";
import { gradeAttemptSchema } from "./test-results.schemas";
import type { TestResultsResponse } from "./test-results.schemas";

/** Server actions for the teacher's results screens. */

const GENERIC = "Something went wrong. Please try again.";

function mapError(error: unknown, fallback: string): string {
  if (error instanceof BackendApiError) return error.message || fallback;
  if (error instanceof TypeError) return "Unable to reach Dwelve API. Please try again.";
  if (error instanceof BackendResponseValidationError) {
    console.error("Test results response validation error:", error);
    return fallback;
  }
  console.error("Test results action error:", error);
  return fallback;
}

export async function listTestResultsAction(input: {
  testId: string;
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}): Promise<TestResultsResponse> {
  const { testId, ...query } = input;
  return listTestResultsRequest(testId, query);
}

/**
 * Marking. One request for the whole paper.
 *
 * `pointsAwarded` is clamped server-side to the question's maximum; the form
 * clamps it too, so the teacher never types a number that will be silently
 * changed underneath them.
 */
export const gradeAttemptAction = actionClient
  .inputSchema(gradeAttemptSchema)
  .action(async ({ parsedInput }) => {
    try {
      return await gradeAttemptRequest(parsedInput.attemptId, {
        marks: parsedInput.marks,
      });
    } catch (error) {
      throw new ActionError(mapError(error, "Could not save these marks. Please try again."));
    }
  });

export const releaseResultsAction = actionClient
  .inputSchema(
    z.object({
      testId: z.string().min(1),
      /** `null` releases to everyone who has a result. */
      studentIds: z.array(z.string().min(1)).nullable().default(null),
    }),
  )
  .action(async ({ parsedInput }) => {
    try {
      return await releaseResultsRequest(parsedInput.testId, {
        studentIds: parsedInput.studentIds,
      });
    } catch (error) {
      throw new ActionError(mapError(error, GENERIC));
    }
  });
