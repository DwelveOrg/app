import "server-only";

import type { z } from "zod";

import type { BackendRequestInit } from "@/lib/api/backend";
import { authedBackendJson } from "@/app/(authentication)/_lib/backend";
import {
  enrollmentMutationResponseSchema,
  leaveClassResponseSchema,
  listEnrollmentsResponseSchema,
  myClassesResponseSchema,
  studentClassesResponseSchema,
  studentOverviewResponseSchema,
} from "./enrollment.schemas";

/**
 * Named endpoint functions for the V1 class-enrollment API. Every call goes
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

/** `GET /schools/:schoolId/student-overview` - STUDENT summary counts. */
export function getStudentOverviewRequest(
  schoolId: string,
  requestJson: BackendRequester = authedBackendJson,
) {
  return requestJson(`/schools/${schoolId}/student-overview`, {
    responseSchema: studentOverviewResponseSchema,
  });
}

/**
 * `GET /schools/:schoolId/classes` - the student-visible directory on the
 * School page. It contains requestable classes as well as active classes; the
 * user-facing Classes page is backed by `GET /classes` instead.
 */
export function getStudentClassesRequest(
  schoolId: string,
  requestJson: BackendRequester = authedBackendJson,
) {
  return requestJson(`/schools/${schoolId}/classes`, {
    responseSchema: studentClassesResponseSchema,
  });
}

/** `GET /me/classes?status=ACTIVE` - the student's active roster classes. */
export function getMyClassesRequest(
  requestJson: BackendRequester = authedBackendJson,
) {
  return requestJson("/me/classes", {
    query: { status: "ACTIVE" },
    responseSchema: myClassesResponseSchema,
  });
}

/** `GET /me/class-enrollments` - the student's own enrollments (default PENDING). */
export function listMyEnrollmentsRequest(
  query: ListQuery,
  requestJson: BackendRequester = authedBackendJson,
) {
  return requestJson("/me/class-enrollments", {
    query,
    responseSchema: listEnrollmentsResponseSchema,
  });
}

/** `GET /classes/:classId/join-requests` - ADMIN/TEACHER pending requests. */
export function listClassJoinRequestsRequest(
  classId: string,
  query: ListQuery,
  requestJson: BackendRequester = authedBackendJson,
) {
  return requestJson(`/classes/${classId}/join-requests`, {
    query,
    responseSchema: listEnrollmentsResponseSchema,
  });
}

/** `POST /classes/:classId/join-requests` - STUDENT requests to join. */
export function createJoinRequestRequest(
  classId: string,
  body: { message?: string },
  requestJson: BackendRequester = authedBackendJson,
) {
  return requestJson(`/classes/${classId}/join-requests`, {
    method: "POST",
    body,
    responseSchema: enrollmentMutationResponseSchema,
  });
}

/** `DELETE /classes/:classId/join-request` - STUDENT cancels a pending request. */
export function cancelJoinRequestRequest(
  classId: string,
  requestJson: BackendRequester = authedBackendJson,
) {
  return requestJson(`/classes/${classId}/join-request`, {
    method: "DELETE",
    responseSchema: enrollmentMutationResponseSchema,
  });
}

/**
 * `DELETE /classes/:classId/membership` - the caller leaves this class itself.
 *
 * STUDENT and TEACHER only, and it always acts on the session's own membership:
 * a student's roster row is dropped and their active enrollment becomes
 * `REMOVED`, a teacher's class assignment is deleted. School membership is
 * untouched either way, so — unlike leaving a school — no session token has to
 * be rotated afterwards. Removing *somebody else* stays on the admin roster
 * routes below.
 */
export function leaveClassRequest(
  classId: string,
  requestJson: BackendRequester = authedBackendJson,
) {
  return requestJson(`/classes/${classId}/membership`, {
    method: "DELETE",
    responseSchema: leaveClassResponseSchema,
  });
}

/** `POST /class-enrollments/:enrollmentId/approve` - ADMIN/TEACHER approve. */
export function approveEnrollmentRequest(
  enrollmentId: string,
  requestJson: BackendRequester = authedBackendJson,
) {
  return requestJson(`/class-enrollments/${enrollmentId}/approve`, {
    method: "POST",
  });
}

/** `POST /class-enrollments/:enrollmentId/reject` - ADMIN/TEACHER reject. */
export function rejectEnrollmentRequest(
  enrollmentId: string,
  body: { reason?: string },
  requestJson: BackendRequester = authedBackendJson,
) {
  return requestJson(`/class-enrollments/${enrollmentId}/reject`, {
    method: "POST",
    body,
  });
}

/** `POST /classes/:classId/students` - ADMIN/TEACHER direct-assign a student. */
export function addClassStudentRequest(
  classId: string,
  body: { studentId: string },
  requestJson: BackendRequester = authedBackendJson,
) {
  return requestJson(`/classes/${classId}/students`, {
    method: "POST",
    body,
    responseSchema: enrollmentMutationResponseSchema,
  });
}

/** `DELETE /classes/:classId/students/:studentId` - ADMIN/TEACHER remove. */
export function removeClassStudentRequest(
  classId: string,
  studentId: string,
  requestJson: BackendRequester = authedBackendJson,
) {
  return requestJson(`/classes/${classId}/students/${studentId}`, {
    method: "DELETE",
  });
}
