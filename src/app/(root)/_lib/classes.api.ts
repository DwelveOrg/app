import "server-only";

import type { z } from "zod";

import type { BackendRequestInit } from "@/lib/api/backend";
import { authedBackendJson } from "@/app/(authentication)/_lib/backend";
import {
  assignableStudentsResponseSchema,
  assignableTeachersResponseSchema,
  classDetailResponseSchema,
  classTeacherMutationResponseSchema,
  classesResponseSchema,
} from "./classes.schemas";

/**
 * Named endpoint functions for the classes API. Every call goes through
 * `authedBackendJson` (attaches the session bearer token) and validates the
 * response with a Zod schema, per `docs/architecture/ARCHITECTURE.md`.
 */

type BackendRequester = <TSchema extends z.ZodTypeAny>(
  path: string,
  init: BackendRequestInit<TSchema>,
) => Promise<z.infer<TSchema>>;

/** `GET /classes` - backend returns only classes the caller may see. */
export function getClassesRequest(requestJson: BackendRequester = authedBackendJson) {
  return requestJson("/classes", { responseSchema: classesResponseSchema });
}

/** `GET /classes/:id` - one class, visible to the caller. */
export function getClassRequest(
  classId: string,
  requestJson: BackendRequester = authedBackendJson,
) {
  return requestJson(`/classes/${classId}`, {
    responseSchema: classDetailResponseSchema,
  });
}

/** `POST /classes` - ADMIN only. Accepts multipart/form-data with optional picture. */
export function createClassRequest(
  body: FormData,
  requestJson: BackendRequester = authedBackendJson,
) {
  return requestJson("/classes", {
    method: "POST",
    body,
    responseSchema: classDetailResponseSchema,
  });
}

/** `PATCH /classes/:id` - ADMIN only. Accepts multipart/form-data. */
export function updateClassRequest(
  classId: string,
  body: FormData,
  requestJson: BackendRequester = authedBackendJson,
) {
  return requestJson(`/classes/${classId}`, {
    method: "PATCH",
    body,
    responseSchema: classDetailResponseSchema,
  });
}

/** `DELETE /classes/:id` - ADMIN only. Soft-deletes the class. */
export function deleteClassRequest(
  classId: string,
  requestJson: BackendRequester = authedBackendJson,
) {
  return requestJson(`/classes/${classId}`, {
    method: "DELETE",
  });
}

type PickerQuery = {
  search?: string;
  page?: number;
  limit?: number;
};

/**
 * `GET /classes/:classId/assignable-students` - ADMIN and teachers assigned to
 * the class. Returns active school students not already on this roster, with
 * server-side search and pagination.
 */
export function listAssignableStudentsRequest(
  classId: string,
  query: PickerQuery,
  requestJson: BackendRequester = authedBackendJson,
) {
  return requestJson(`/classes/${classId}/assignable-students`, {
    query,
    responseSchema: assignableStudentsResponseSchema,
  });
}

/** `GET /classes/:classId/assignable-teachers` - ADMIN only. */
export function listAssignableTeachersRequest(
  classId: string,
  query: PickerQuery,
  requestJson: BackendRequester = authedBackendJson,
) {
  return requestJson(`/classes/${classId}/assignable-teachers`, {
    query,
    responseSchema: assignableTeachersResponseSchema,
  });
}

/** `POST /classes/:classId/teachers` - ADMIN assigns a teacher to the class. */
export function addClassTeacherRequest(
  classId: string,
  body: { teacherId: string },
  requestJson: BackendRequester = authedBackendJson,
) {
  return requestJson(`/classes/${classId}/teachers`, {
    method: "POST",
    body,
    responseSchema: classTeacherMutationResponseSchema,
  });
}

/** `DELETE /classes/:classId/teachers/:teacherId` - ADMIN unassigns a teacher. */
export function removeClassTeacherRequest(
  classId: string,
  teacherId: string,
  requestJson: BackendRequester = authedBackendJson,
) {
  return requestJson(`/classes/${classId}/teachers/${teacherId}`, {
    method: "DELETE",
  });
}
