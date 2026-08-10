import "server-only";

import type { z } from "zod";

import type { BackendRequestInit } from "@/lib/api/backend";
import { authedBackendJson } from "@/app/(authentication)/_lib/backend";
import type { AnswerValue } from "@/lib/tests/answers";
import {
  attemptResponseSchema,
  attemptResultResponseSchema,
  saveAnswersResponseSchema,
  studentTestsResponseSchema,
  submitResponseSchema,
  takerOverviewResponseSchema,
  violationResponseSchema,
  type ViolationType,
} from "./attempts.schemas";

/**
 * Named endpoint functions for taking a test.
 *
 * Every call goes through `authedBackendJson` — session bearer token, selected
 * school context, one retry on 401 — and validates its response with a Zod
 * schema, per `docs/architecture/ARCHITECTURE.md`. No component or hook talks
 * to a URL.
 *
 * `ADMIN`/`TEACHER` receive 403 on the attempt routes and `STUDENT` receives
 * 403 on the review and statistics routes. The backend is the authorization
 * boundary; the role checks in the pages only decide which UI to draw.
 */

type BackendRequester = <TSchema extends z.ZodTypeAny>(
  path: string,
  init: BackendRequestInit<TSchema>,
) => Promise<z.infer<TSchema>>;

/** `GET /me/tests` — the student's own list, filtered by state. */
export function listMyTestsRequest(
  query: { status?: string; page?: number; limit?: number } = {},
  requestJson: BackendRequester = authedBackendJson,
) {
  return requestJson("/me/tests", {
    query,
    responseSchema: studentTestsResponseSchema,
  });
}

/**
 * `GET /tests/:testId/taker` — the cover screen.
 *
 * Carries no questions. A student who has not started must not be able to read
 * the paper out of a network response, and the cover has no use for it.
 */
export function getTakerOverviewRequest(
  testId: string,
  requestJson: BackendRequester = authedBackendJson,
) {
  return requestJson(`/tests/${testId}/taker`, {
    responseSchema: takerOverviewResponseSchema,
  });
}

/**
 * `POST /tests/:testId/attempts` — start, or resume the one already open.
 *
 * Idempotent on the backend: a refresh, a second tab, or a double-press
 * returns the existing `IN_PROGRESS` attempt rather than starting another and
 * burning one of the student's allowed tries.
 */
export function startAttemptRequest(
  testId: string,
  body: { honorCodeAccepted?: boolean },
  requestJson: BackendRequester = authedBackendJson,
) {
  return requestJson(`/tests/${testId}/attempts`, {
    method: "POST",
    body,
    responseSchema: attemptResponseSchema,
  });
}

/** `GET /attempts/:attemptId` — the paper, the clock, and the answers so far. */
export function getAttemptRequest(
  attemptId: string,
  requestJson: BackendRequester = authedBackendJson,
) {
  return requestJson(`/attempts/${attemptId}`, {
    responseSchema: attemptResponseSchema,
  });
}

/**
 * `PATCH /attempts/:attemptId/answers` — the autosave.
 *
 * A batch, not one request per keystroke: forty questions answered over an hour
 * is a few dozen requests this way and several thousand the other. `value:
 * null` clears an answer.
 */
export function saveAnswersRequest(
  attemptId: string,
  body: {
    answers: { questionId: string; value: AnswerValue | null; timeSpentSeconds?: number }[];
  },
  requestJson: BackendRequester = authedBackendJson,
) {
  return requestJson(`/attempts/${attemptId}/answers`, {
    method: "PATCH",
    body,
    responseSchema: saveAnswersResponseSchema,
  });
}

/**
 * `POST /attempts/:attemptId/violations` — report an integrity event.
 *
 * Reports; does not decide. The server resolves the configured action, counts
 * it, and ends the attempt itself if that is what the rule says — because the
 * client is the thing under suspicion, and an attempt ended by client code is
 * an attempt a modified client never ends.
 */
export function reportViolationRequest(
  attemptId: string,
  body: { type: ViolationType; occurredAt: string },
  requestJson: BackendRequester = authedBackendJson,
) {
  return requestJson(`/attempts/${attemptId}/violations`, {
    method: "POST",
    body,
    responseSchema: violationResponseSchema,
  });
}

/** `POST /attempts/:attemptId/submit` — grade and close. Idempotent. */
export function submitAttemptRequest(
  attemptId: string,
  requestJson: BackendRequester = authedBackendJson,
) {
  return requestJson(`/attempts/${attemptId}/submit`, {
    method: "POST",
    responseSchema: submitResponseSchema,
  });
}

/** `GET /attempts/:attemptId/result` — the student's own result, if released. */
export function getAttemptResultRequest(
  attemptId: string,
  requestJson: BackendRequester = authedBackendJson,
) {
  return requestJson(`/attempts/${attemptId}/result`, {
    responseSchema: attemptResultResponseSchema,
  });
}
