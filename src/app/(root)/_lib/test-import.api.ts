import "server-only";

import type { z } from "zod";

import type { BackendRequestInit } from "@/lib/api/backend";
import { authedBackendJson } from "@/app/(authentication)/_lib/backend";
import {
  createTestImportResponseSchema,
  testImportJobSchema,
  testImportLimitsSchema,
} from "./test-import.schemas";

/**
 * Named endpoint functions for the AI PDF import API. Every call goes through
 * `authedBackendJson` (session bearer token + selected-school context) and
 * validates the response with a Zod schema, per
 * `docs/architecture/ARCHITECTURE.md`.
 *
 * `STUDENT` receives 403 on every route here; the backend is the authorization
 * boundary, not the hidden buttons in the UI.
 */

type BackendRequester = <TSchema extends z.ZodTypeAny>(
  path: string,
  init: BackendRequestInit<TSchema>,
) => Promise<z.infer<TSchema>>;

/**
 * `GET /tests/imports/limits` — the caps, served rather than hard-coded so the
 * page counter, the question field, and the docs cannot drift from the values
 * the server actually enforces.
 */
export function getTestImportLimitsRequest(
  requestJson: BackendRequester = authedBackendJson,
) {
  return requestJson("/tests/imports/limits", {
    responseSchema: testImportLimitsSchema,
  });
}

/**
 * `POST /classes/:classId/tests/imports` — multipart upload plus the page
 * selection. Returns immediately with a job id; extraction runs in the
 * background, which is what lets the UI show a real stepper instead of a
 * spinner on a request that can run for minutes.
 */
export function createTestImportRequest(
  classId: string,
  body: FormData,
  requestJson: BackendRequester = authedBackendJson,
) {
  return requestJson(`/classes/${classId}/tests/imports`, {
    method: "POST",
    body,
    // The body is a slice of the chosen pages rather than the whole document,
    // but it is still up to the platform's ~4 MB ceiling, and a school
    // connection moves that slowly enough to outlast the shared JSON-request
    // timeout. Extraction itself starts only after this request returns and is
    // polled separately, so a generous window here costs nothing.
    timeoutMs: 120_000,
    responseSchema: createTestImportResponseSchema,
  });
}

/** `GET /tests/imports/:jobId` — the polled status, progress, and result. */
export function getTestImportRequest(
  jobId: string,
  requestJson: BackendRequester = authedBackendJson,
) {
  return requestJson(`/tests/imports/${jobId}`, {
    responseSchema: testImportJobSchema,
  });
}

/** `DELETE /tests/imports/:jobId` — cancels an in-flight import. */
export function cancelTestImportRequest(
  jobId: string,
  requestJson: BackendRequester = authedBackendJson,
) {
  return requestJson(`/tests/imports/${jobId}`, { method: "DELETE" });
}
