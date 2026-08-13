"use server";

import { actionClient, ActionError } from "@/lib/safe-action";
import { BackendApiError, BackendResponseValidationError } from "@/lib/api/backend";
import {
  cancelTestImportRequest,
  createTestImportRequest,
  getTestImportLimitsRequest,
  getTestImportRequest,
} from "./test-import.api";
import {
  createTestImportSchema,
  testImportJobIdSchema,
} from "./test-import.actions.schemas";
import {
  FALLBACK_IMPORT_LIMITS,
  testImportErrorCodeSchema,
  type TestImportLimits,
} from "./test-import.schemas";

/**
 * Server actions for the AI PDF import.
 *
 * The upload action exists because a `File` cannot cross the client/server
 * boundary as JSON — it is rebuilt into `FormData` here, the same shape
 * `uploadTestMediaAction` uses for question images.
 */

const NETWORK_ERROR = "Unable to reach Dwelve API. Please try again.";
const IMPORT_ERROR = "Could not start the import. Please try again.";

/**
 * Backend failures the teacher can act on get their own message; everything
 * else falls back.
 *
 * A 429 is the daily quota rather than generic rate limiting on this route, so
 * it is worth naming — "try again tomorrow" is a different instruction from
 * "try again".
 */
function mapImportError(error: unknown, fallback: string): string {
  if (error instanceof BackendApiError) {
    const code = testImportErrorCodeSchema.safeParse(
      error.body && typeof error.body === "object" && !Array.isArray(error.body)
        ? (error.body as Record<string, unknown>).errorCode
        : undefined,
    );
    if (code.success) return code.data;

    if (error.status === 413) {
      return error.message || "That PDF is too large to import.";
    }
    if (error.status === 429) {
      return error.message || "This school has reached today's import limit.";
    }
    if (error.status === 503) {
      return error.message || "PDF import is currently unavailable.";
    }
    return error.message || fallback;
  }
  if (error instanceof BackendResponseValidationError) {
    return fallback;
  }
  if (error instanceof Error) {
    return NETWORK_ERROR;
  }
  return fallback;
}

/**
 * `GET /tests/imports/limits`.
 *
 * Falls back rather than throwing: the import screen must still render if this
 * one request fails, and the server enforces the real caps regardless of what
 * the UI displayed.
 */
export const getTestImportLimitsAction = actionClient.action(
  async (): Promise<TestImportLimits> => {
    try {
      return await getTestImportLimitsRequest();
    } catch (error) {
      if (mapImportError(error, "") === "DISABLED") {
        return { ...FALLBACK_IMPORT_LIMITS, enabled: false };
      }
      return FALLBACK_IMPORT_LIMITS;
    }
  },
);

/** `POST /classes/:classId/tests/imports` — starts the background job. */
export const createTestImportAction = actionClient
  .inputSchema(createTestImportSchema)
  .action(async ({ parsedInput }) => {
    try {
      const form = new FormData();
      form.append("file", parsedInput.file);
      form.append("pages", parsedInput.pages);
      if (parsedInput.maxQuestions !== undefined) {
        form.append("maxQuestions", String(parsedInput.maxQuestions));
      }
      if (parsedInput.title) {
        form.append("title", parsedInput.title);
      }
      if (parsedInput.format) {
        form.append("format", parsedInput.format);
      }

      const { jobId } = await createTestImportRequest(parsedInput.classId, form);
      return { jobId };
    } catch (error) {
      throw new ActionError(mapImportError(error, IMPORT_ERROR));
    }
  });

/** `GET /tests/imports/:jobId` — polled by the vertical loader. */
export const getTestImportAction = actionClient
  .inputSchema(testImportJobIdSchema)
  .action(async ({ parsedInput }) => {
    try {
      return await getTestImportRequest(parsedInput.jobId);
    } catch (error) {
      throw new ActionError(
        mapImportError(error, "Could not check the import status."),
      );
    }
  });

/** `DELETE /tests/imports/:jobId` — the teacher backing out of a running import. */
export const cancelTestImportAction = actionClient
  .inputSchema(testImportJobIdSchema)
  .action(async ({ parsedInput }) => {
    try {
      await cancelTestImportRequest(parsedInput.jobId);
      return { jobId: parsedInput.jobId };
    } catch (error) {
      throw new ActionError(mapImportError(error, "Could not cancel the import."));
    }
  });
