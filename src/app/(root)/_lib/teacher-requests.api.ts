import "server-only";

import type { z } from "zod";

import type { BackendRequestInit } from "@/lib/api/backend";
import { authedBackendJson } from "@/app/(authentication)/_lib/backend";
import {
  listTeacherRequestsResponseSchema,
  teacherClassesResponseSchema,
  teacherRequestMutationResponseSchema,
} from "./teacher-requests.schemas";

/**
 * Named endpoint functions for the teacher class-request API. Every call goes
 * through `authedBackendJson` (attaches the session bearer token and uses the
 * selected-school JWT context) and validates JSON the UI relies on with a Zod
 * schema, per `docs/architecture/ARCHITECTURE.md`.
 */

type BackendRequester = <TSchema extends z.ZodTypeAny>(
  path: string,
  init: BackendRequestInit<TSchema>,
) => Promise<z.infer<TSchema>>;

type ListQuery = {
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
};

/**
 * `GET /schools/:schoolId/classes` for a TEACHER - every active class in the
 * school directory with request/enter flags. The My Classes page remains
 * `GET /classes` and includes only classes the teacher has been assigned.
 */
export function getTeacherClassesRequest(
  schoolId: string,
  requestJson: BackendRequester = authedBackendJson,
) {
  return requestJson(`/schools/${schoolId}/classes`, {
    responseSchema: teacherClassesResponseSchema,
  });
}

/** `POST /classes/:classId/teacher-join-requests` - TEACHER requests to teach. */
export function createTeacherJoinRequest(
  classId: string,
  body: { message?: string },
  requestJson: BackendRequester = authedBackendJson,
) {
  return requestJson(`/classes/${classId}/teacher-join-requests`, {
    method: "POST",
    body,
    responseSchema: teacherRequestMutationResponseSchema,
  });
}

/** `DELETE /classes/:classId/teacher-join-request` - TEACHER cancels a request. */
export function cancelTeacherJoinRequest(
  classId: string,
  requestJson: BackendRequester = authedBackendJson,
) {
  return requestJson(`/classes/${classId}/teacher-join-request`, {
    method: "DELETE",
    responseSchema: teacherRequestMutationResponseSchema,
  });
}

/** `GET /classes/:classId/teacher-join-requests` - ADMIN pending requests. */
export function listTeacherJoinRequests(
  classId: string,
  query: ListQuery,
  requestJson: BackendRequester = authedBackendJson,
) {
  return requestJson(`/classes/${classId}/teacher-join-requests`, {
    query,
    responseSchema: listTeacherRequestsResponseSchema,
  });
}

/** `POST /class-teacher-requests/:requestId/approve` - ADMIN approve. */
export function approveTeacherJoinRequest(
  requestId: string,
  requestJson: BackendRequester = authedBackendJson,
) {
  return requestJson(`/class-teacher-requests/${requestId}/approve`, {
    method: "POST",
    responseSchema: teacherRequestMutationResponseSchema,
  });
}

/** `POST /class-teacher-requests/:requestId/reject` - ADMIN reject. */
export function rejectTeacherJoinRequest(
  requestId: string,
  body: { reason?: string },
  requestJson: BackendRequester = authedBackendJson,
) {
  return requestJson(`/class-teacher-requests/${requestId}/reject`, {
    method: "POST",
    body,
    responseSchema: teacherRequestMutationResponseSchema,
  });
}
