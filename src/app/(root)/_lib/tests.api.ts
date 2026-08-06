import "server-only";

import type { z } from "zod";

import type { BackendRequestInit } from "@/lib/api/backend";
import { authedBackendJson } from "@/app/(authentication)/_lib/backend";
import {
  testDetailResponseSchema,
  testFormatsResponseSchema,
  testMediaResponseSchema,
  testSuccessResponseSchema,
  testSummaryResponseSchema,
  testsListResponseSchema,
  testValidationResponseSchema,
} from "./tests.schemas";
import type { SaveSectionInput } from "./tests.actions.schemas";

/**
 * Named endpoint functions for the tests authoring API. Every call goes through
 * `authedBackendJson` (attaches the session bearer token and the selected-school
 * JWT context) and validates the response with a Zod schema, per
 * `docs/architecture/ARCHITECTURE.md`.
 *
 * `STUDENT` receives 403 on every route here; the backend is the authorization
 * boundary, not the hidden buttons in the UI.
 */

type BackendRequester = <TSchema extends z.ZodTypeAny>(
  path: string,
  init: BackendRequestInit<TSchema>,
) => Promise<z.infer<TSchema>>;

type ListTestsQuery = {
  status?: string;
  page?: number;
  limit?: number;
};

/** `GET /tests/formats` - the format blueprints and question-type catalogue. */
export function getTestFormatsRequest(
  requestJson: BackendRequester = authedBackendJson,
) {
  return requestJson("/tests/formats", {
    responseSchema: testFormatsResponseSchema,
  });
}

/** `GET /classes/:classId/tests` - paginated, filtered by status. */
export function listClassTestsRequest(
  classId: string,
  query: ListTestsQuery = {},
  requestJson: BackendRequester = authedBackendJson,
) {
  return requestJson(`/classes/${classId}/tests`, {
    query,
    responseSchema: testsListResponseSchema,
  });
}

/** `POST /classes/:classId/tests` - creates a DRAFT from a title and format. */
export function createTestRequest(
  classId: string,
  body: { title: string; format: string },
  requestJson: BackendRequester = authedBackendJson,
) {
  return requestJson(`/classes/${classId}/tests`, {
    method: "POST",
    body,
    responseSchema: testSummaryResponseSchema,
  });
}

/** `GET /tests/:testId` - the full tree, including the answer key. */
export function getTestRequest(
  testId: string,
  requestJson: BackendRequester = authedBackendJson,
) {
  return requestJson(`/tests/${testId}`, {
    responseSchema: testDetailResponseSchema,
  });
}

/**
 * `PUT /tests/:testId/structure` - the whole-tree save. Rows whose id the
 * server recognises are updated, rows without an id are created, and rows
 * absent from the payload are deleted. DRAFT-only; a published test answers
 * 409.
 */
export function saveTestStructureRequest(
  testId: string,
  body: { sections: SaveSectionInput[] },
  requestJson: BackendRequester = authedBackendJson,
) {
  return requestJson(`/tests/${testId}/structure`, {
    method: "PUT",
    body,
    responseSchema: testDetailResponseSchema,
  });
}

/** `PATCH /tests/:testId` - metadata only, never the tree. */
export function updateTestRequest(
  testId: string,
  body: Record<string, unknown>,
  requestJson: BackendRequester = authedBackendJson,
) {
  return requestJson(`/tests/${testId}`, {
    method: "PATCH",
    body,
    responseSchema: testSummaryResponseSchema,
  });
}

/** `GET /tests/:testId/validation` - live publish-readiness issues. */
export function getTestValidationRequest(
  testId: string,
  requestJson: BackendRequester = authedBackendJson,
) {
  return requestJson(`/tests/${testId}/validation`, {
    responseSchema: testValidationResponseSchema,
  });
}

/** `POST /tests/:testId/publish` - validates, publishes, notifies the class. */
export function publishTestRequest(
  testId: string,
  requestJson: BackendRequester = authedBackendJson,
) {
  return requestJson(`/tests/${testId}/publish`, {
    method: "POST",
    responseSchema: testSummaryResponseSchema,
  });
}

/** `POST /tests/:testId/unpublish` - back to DRAFT so the tree can be edited. */
export function unpublishTestRequest(
  testId: string,
  requestJson: BackendRequester = authedBackendJson,
) {
  return requestJson(`/tests/${testId}/unpublish`, {
    method: "POST",
    responseSchema: testSuccessResponseSchema,
  });
}

/** `POST /tests/:testId/duplicate` - deep clone as a new DRAFT. */
export function duplicateTestRequest(
  testId: string,
  requestJson: BackendRequester = authedBackendJson,
) {
  return requestJson(`/tests/${testId}/duplicate`, {
    method: "POST",
    responseSchema: testSummaryResponseSchema,
  });
}

/** `DELETE /tests/:testId` - drafts are deleted, anything else is archived. */
export function deleteTestRequest(
  testId: string,
  requestJson: BackendRequester = authedBackendJson,
) {
  return requestJson(`/tests/${testId}`, { method: "DELETE" });
}

/** `POST /tests/:testId/media` - multipart image upload, returns `{ url }`. */
export function uploadTestMediaRequest(
  testId: string,
  body: FormData,
  requestJson: BackendRequester = authedBackendJson,
) {
  return requestJson(`/tests/${testId}/media`, {
    method: "POST",
    body,
    responseSchema: testMediaResponseSchema,
  });
}
