import "server-only";

import {
  type BackendRequestInit,
  backendJson,
  BackendApiError,
  BackendResponseValidationError,
} from "@/lib/api/backend";
import type { z } from "zod";
import type {
  JoinSchoolFormField,
  LoginFormField,
  RegularSignupFormField,
} from "@/app/(authentication)/_types/_schemas";
import {
  acceptTeacherInviteResponseSchema,
  authResponseSchema,
  authSuccessSchema,
  authTokensSchema,
  createSchoolResponseSchema,
  forgotPasswordResponseSchema,
  healthResponseSchema,
  joinSchoolResponseSchema,
  leaveSchoolResponseSchema,
  schoolDetailResponseSchema,
  schoolMembersResponseSchema,
  teacherInviteResponseSchema,
  type AcceptTeacherInviteResponse,
  type AuthResponse,
  type AuthSuccess,
  type AuthTokens,
  type BackendMember,
  type BackendSchool,
  type BackendUser,
  type CreateSchoolResponse,
  type ForgotPasswordResponse,
  type HealthResponse,
  type JoinSchoolResponse,
  type LeaveSchoolResponse,
  type SchoolDetailResponse,
  type SchoolMembersResponse,
  type TeacherInviteResponse,
} from "./api.schemas";

type BackendRequester = <TSchema extends z.ZodTypeAny>(
  path: string,
  init: BackendRequestInit<TSchema>,
) => Promise<z.infer<TSchema>>;

export { backendJson, BackendApiError, BackendResponseValidationError };
export type {
  AcceptTeacherInviteResponse,
  AuthResponse,
  AuthSuccess,
  AuthTokens,
  BackendMember,
  BackendSchool,
  BackendUser,
  CreateSchoolResponse,
  ForgotPasswordResponse,
  HealthResponse,
  JoinSchoolResponse,
  LeaveSchoolResponse,
  SchoolDetailResponse,
  SchoolMembersResponse,
  TeacherInviteResponse,
};

export function loginRequest(input: LoginFormField) {
  return backendJson("/auth/login", {
    method: "POST",
    body: input,
    responseSchema: authResponseSchema,
  });
}

export function signupRequest(input: RegularSignupFormField) {
  return backendJson("/auth/signup", {
    method: "POST",
    body: input,
    responseSchema: authResponseSchema,
  });
}

export function googleAuthRequest(idToken: string) {
  return backendJson("/auth/google", {
    method: "POST",
    body: { idToken },
    responseSchema: authResponseSchema,
  });
}

export function forgotPasswordRequest(input: { email: string }) {
  return backendJson("/auth/forgot-password", {
    method: "POST",
    body: { email: input.email.trim() },
    responseSchema: forgotPasswordResponseSchema,
  });
}

export function resetPasswordRequest(input: { token: string; password: string }) {
  return backendJson("/auth/reset-password", {
    method: "POST",
    body: { token: input.token.trim(), password: input.password },
    responseSchema: authSuccessSchema,
  });
}

export function refreshTokensRequest(refreshToken: string) {
  return backendJson("/auth/refresh", {
    method: "POST",
    body: { refreshToken },
    responseSchema: authTokensSchema,
  });
}

export function logoutRequest(refreshToken: string) {
  return backendJson("/auth/logout", {
    method: "POST",
    body: { refreshToken },
  });
}

/**
 * Deletes every Redis refresh session for the signed-in user. Requires a valid
 * access token, so it must be called through `authedBackendJson`.
 */
export function logoutAllRequest(requestJson: BackendRequester = backendJson) {
  return requestJson("/auth/logout-all", {
    method: "POST",
    responseSchema: authSuccessSchema,
  });
}

/**
 * Reports API, PostgreSQL, and Redis status. Public endpoint intended for
 * admin/dev diagnostics — do not call this on every user page load.
 */
export function healthRequest(requestJson: BackendRequester = backendJson) {
  return requestJson("/health", {
    responseSchema: healthResponseSchema,
  });
}

/**
 * `POST /schools` accepts multipart/form-data with an optional `logo` file.
 * The caller builds the FormData so binary uploads are streamed through the
 * request stack instead of being JSON-encoded.
 */
export function createSchoolRequest(
  body: FormData,
  requestJson: BackendRequester = backendJson,
) {
  return requestJson("/schools", {
    method: "POST",
    body,
    responseSchema: createSchoolResponseSchema,
  });
}

export function joinSchoolRequest(
  input: JoinSchoolFormField,
  requestJson: BackendRequester = backendJson,
) {
  return requestJson("/schools/join", {
    method: "POST",
    body: { code: input.code.trim() },
    responseSchema: joinSchoolResponseSchema,
  });
}

/**
 * Redeems a teacher invite token for the signed-in user. Requires a valid access
 * token (the invited email must match the account), so call it through
 * `authedBackendJson`.
 */
export function acceptTeacherInviteRequest(
  token: string,
  requestJson: BackendRequester = backendJson,
) {
  return requestJson("/schools/invites/teacher/accept", {
    method: "POST",
    body: { token: token.trim() },
    responseSchema: acceptTeacherInviteResponseSchema,
  });
}

export function getSchoolRequest(schoolId: string, requestJson: BackendRequester = backendJson) {
  return requestJson(`/schools/${schoolId}`, {
    responseSchema: schoolDetailResponseSchema,
  });
}

/**
 * `PATCH /schools/:schoolId` accepts multipart/form-data with optional `logo`
 * upload or `removeLogo=true`. Text fields (`name`, `description`, ...) travel
 * in the same FormData.
 */
export function updateSchoolRequest(
  schoolId: string,
  body: FormData,
  requestJson: BackendRequester = backendJson,
) {
  return requestJson(`/schools/${schoolId}`, {
    method: "PATCH",
    body,
    responseSchema: schoolDetailResponseSchema,
  });
}

export function getSchoolMembersRequest(
  schoolId: string,
  requestJson: BackendRequester = backendJson,
) {
  return requestJson(`/schools/${schoolId}/members`, {
    responseSchema: schoolMembersResponseSchema,
  });
}

/** Removes an active TEACHER or STUDENT membership. ADMINs cannot be removed. */
export function removeSchoolMemberRequest(
  schoolId: string,
  memberId: string,
  requestJson: BackendRequester = backendJson,
) {
  return requestJson(`/schools/${schoolId}/members/${memberId}`, {
    method: "DELETE",
  });
}

/** Teachers and students can leave their selected school and receive no-school tokens. */
export function leaveSchoolRequest(
  schoolId: string,
  requestJson: BackendRequester = backendJson,
) {
  return requestJson(`/schools/${schoolId}/membership`, {
    method: "DELETE",
    responseSchema: leaveSchoolResponseSchema,
  });
}

export function createTeacherInviteRequest(
  schoolId: string,
  body: { email: string },
  requestJson: BackendRequester = backendJson,
) {
  return requestJson(`/schools/${schoolId}/invites/teacher`, {
    method: "POST",
    body,
    responseSchema: teacherInviteResponseSchema,
  });
}

/**
 * `DELETE /schools/:schoolId` (ADMIN, selected-school context). Marks the school
 * inactive and cascades roster/enrollment removal on the backend. The UI does
 * not consume the response body, so no response schema is attached.
 */
export function deleteSchoolRequest(
  schoolId: string,
  requestJson: BackendRequester = backendJson,
) {
  return requestJson(`/schools/${schoolId}`, {
    method: "DELETE",
  });
}
