"use server";

import { actionClient, ActionError } from "@/lib/safe-action";
import { BackendApiError, BackendResponseValidationError } from "@/lib/api/backend";
import {
  getAttemptRequest,
  getAttemptResultRequest,
  listMyTestsRequest,
  reportViolationRequest,
  saveAnswersRequest,
  startAttemptRequest,
  submitAttemptRequest,
} from "./attempts.api";
import {
  attemptIdSchema,
  reportViolationSchema,
  saveAnswersSchema,
  startAttemptSchema,
} from "./attempts.actions.schemas";
import type {
  AttemptResponse,
  AttemptResultResponse,
  StudentTestsResponse,
} from "./attempts.schemas";

/**
 * Server-action boundaries for taking a test.
 *
 * ## Why the rejections are named
 *
 * Every other feature in the product can map a 409 to one sentence. This one
 * cannot: "you have used all your attempts", "the window has closed", "this
 * attempt is already submitted" and "your time is up" are four different
 * situations with four different next steps, and a student who is told the
 * wrong one either gives up on a test they could still sit or keeps pressing a
 * button that will never work. So the backend's `code` is preserved and the UI
 * translates it.
 */

const NETWORK_ERROR = "exam.errors.network";
const GENERIC_ERROR = "exam.errors.generic";

/**
 * The error message is a **translation key**, not a sentence.
 *
 * `ActionError` can only carry a string, and the string crosses a server/client
 * boundary where `t()` does not exist. Sending the key lets the runtime render
 * "Your time is up" in the language the student is sitting the exam in, which
 * for two of the three supported languages is not English.
 */
function mapAttemptError(error: unknown): string {
  if (error instanceof BackendApiError) {
    const code = readCode(error.body);
    if (code) return `exam.errors.${code}`;
    if (error.status === 404) return "exam.errors.notFound";
    if (error.status === 403) return "exam.errors.forbidden";
    return error.message || GENERIC_ERROR;
  }
  if (error instanceof TypeError) return NETWORK_ERROR;
  if (error instanceof BackendResponseValidationError) {
    console.error("Attempt response validation error:", error);
    return GENERIC_ERROR;
  }
  console.error("Attempt action error:", error);
  return GENERIC_ERROR;
}

function readCode(body: unknown): string | null {
  if (!body || typeof body !== "object") return null;
  const code = (body as { code?: unknown }).code;
  return typeof code === "string" && /^[A-Z_]+$/.test(code) ? code : null;
}

/* -------------------------------------------------------------------------- */
/* Reads                                                                       */
/* -------------------------------------------------------------------------- */

export async function listMyTestsAction(input: {
  status?: string;
  page?: number;
  limit?: number;
}): Promise<StudentTestsResponse> {
  return listMyTestsRequest(input);
}

export async function getAttemptAction(input: {
  attemptId: string;
}): Promise<AttemptResponse> {
  return getAttemptRequest(input.attemptId);
}

export async function getAttemptResultAction(input: {
  attemptId: string;
}): Promise<AttemptResultResponse> {
  return getAttemptResultRequest(input.attemptId);
}

/* -------------------------------------------------------------------------- */
/* Mutations                                                                   */
/* -------------------------------------------------------------------------- */

export const startAttemptAction = actionClient
  .inputSchema(startAttemptSchema)
  .action(async ({ parsedInput }) => {
    try {
      return await startAttemptRequest(parsedInput.testId, {
        honorCodeAccepted: parsedInput.honorCodeAccepted,
      });
    } catch (error) {
      throw new ActionError(mapAttemptError(error));
    }
  });

/**
 * The autosave.
 *
 * Deliberately quiet about everything except whether the write landed: the
 * response carries a count and the clock, and nothing about correctness. A
 * grading hint in an autosave response is an answer key delivered mid-exam, one
 * network tab away.
 */
export const saveAnswersAction = actionClient
  .inputSchema(saveAnswersSchema)
  .action(async ({ parsedInput }) => {
    try {
      return await saveAnswersRequest(parsedInput.attemptId, {
        answers: parsedInput.answers,
      });
    } catch (error) {
      throw new ActionError(mapAttemptError(error));
    }
  });

export const reportViolationAction = actionClient
  .inputSchema(reportViolationSchema)
  .action(async ({ parsedInput }) => {
    try {
      return await reportViolationRequest(parsedInput.attemptId, {
        type: parsedInput.type,
        occurredAt: parsedInput.occurredAt,
      });
    } catch (error) {
      throw new ActionError(mapAttemptError(error));
    }
  });

export const submitAttemptAction = actionClient
  .inputSchema(attemptIdSchema)
  .action(async ({ parsedInput }) => {
    try {
      return await submitAttemptRequest(parsedInput.attemptId);
    } catch (error) {
      throw new ActionError(mapAttemptError(error));
    }
  });
