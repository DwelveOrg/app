import "server-only";

import type { z } from "zod";

import type { BackendRequestInit } from "@/lib/api/backend";
import { authedBackendJson } from "@/app/(authentication)/_lib/backend";
import { testSuccessResponseSchema } from "./tests.schemas";
import {
  attemptReviewResponseSchema,
  testResultsResponseSchema,
  testStatisticsResponseSchema,
  type GradeAttemptInput,
} from "./test-results.schemas";

/**
 * The teacher's half of test taking: who sat it, how they did, and how the
 * class did.
 *
 * Separate from `tests.api.ts` — which owns authoring — because these routes
 * have a different lifetime and a different audience. Authoring stops mattering
 * the moment a test is published; these start.
 */

type BackendRequester = <TSchema extends z.ZodTypeAny>(
  path: string,
  init: BackendRequestInit<TSchema>,
) => Promise<z.infer<TSchema>>;

/** `GET /tests/:testId/results` — one row per enrolled student. */
export function listTestResultsRequest(
  testId: string,
  query: { status?: string; search?: string; sort?: string; page?: number; limit?: number } = {},
  requestJson: BackendRequester = authedBackendJson,
) {
  return requestJson(`/tests/${testId}/results`, {
    query,
    responseSchema: testResultsResponseSchema,
  });
}

/** `GET /tests/:testId/statistics` — the cohort and per-question analysis. */
export function getTestStatisticsRequest(
  testId: string,
  requestJson: BackendRequester = authedBackendJson,
) {
  return requestJson(`/tests/${testId}/statistics`, {
    responseSchema: testStatisticsResponseSchema,
  });
}

/** `GET /attempts/:attemptId/review` — one student's paper, with the key. */
export function getAttemptReviewRequest(
  attemptId: string,
  requestJson: BackendRequester = authedBackendJson,
) {
  return requestJson(`/attempts/${attemptId}/review`, {
    responseSchema: attemptReviewResponseSchema,
  });
}

/**
 * `PATCH /attempts/:attemptId/grade` — mark the written answers.
 *
 * A batch, because a teacher marks a paper in one sitting and a request per
 * essay would leave a half-graded attempt behind the moment the connection
 * dropped. The backend recomputes the roll-ups and flips the attempt to
 * `GRADED` once nothing is left unmarked.
 */
export function gradeAttemptRequest(
  attemptId: string,
  body: Omit<GradeAttemptInput, "attemptId">,
  requestJson: BackendRequester = authedBackendJson,
) {
  return requestJson(`/attempts/${attemptId}/grade`, {
    method: "PATCH",
    body,
    responseSchema: testSuccessResponseSchema,
  });
}

/** `POST /tests/:testId/results/release` — only meaningful for MANUAL release. */
export function releaseResultsRequest(
  testId: string,
  body: { studentIds: string[] | null },
  requestJson: BackendRequester = authedBackendJson,
) {
  return requestJson(`/tests/${testId}/results/release`, {
    method: "POST",
    body,
    responseSchema: testSuccessResponseSchema,
  });
}
