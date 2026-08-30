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
  telegramTicketResponseSchema,
  authSuccessSchema,
  authTokensSchema,
  createSchoolResponseSchema,
  forgotPasswordResponseSchema,
  healthResponseSchema,
  joinSchoolResponseSchema,
  leaveSchoolResponseSchema,
  schoolBlocklistResponseSchema,
  schoolDetailResponseSchema,
  schoolMembersResponseSchema,
  teacherInviteListResponseSchema,
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
  type SchoolBlocklistEntry,
  type SchoolBlocklistResponse,
  type SchoolDetailResponse,
  type SchoolMembersResponse,
  type TeacherInviteListResponse,
  type TeacherInviteResponse,
  type TeacherInviteSummary,
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
  SchoolBlocklistEntry,
  SchoolBlocklistResponse,
  SchoolDetailResponse,
  SchoolMembersResponse,
  TeacherInviteListResponse,
  TeacherInviteResponse,
  TeacherInviteSummary,
};

/**
 * Session-creating calls forward the browser's identity. These requests are
 * made by the Next server, so without this the backend records the server's
 * own fetch — no user agent, loopback address — and the profile's "Active
 * sessions" list shows every device as "Unknown device".
 */
export function loginRequest(input: LoginFormField, headers?: HeadersInit) {
  return backendJson("/auth/login", {
    method: "POST",
    body: input,
    headers,
    responseSchema: authResponseSchema,
  });
}

export function signupRequest(input: RegularSignupFormField, headers?: HeadersInit) {
  return backendJson("/auth/signup", {
    method: "POST",
    body: input,
    headers,
    responseSchema: authResponseSchema,
  });
}

export function googleAuthRequest(idToken: string, headers?: HeadersInit) {
  return backendJson("/auth/google", {
    method: "POST",
    body: { idToken },
    headers,
    responseSchema: authResponseSchema,
  });
}

/** Opens bot sign-in: a one-time ticket plus the bot to send the user to. */
export function telegramTicketRequest(headers?: HeadersInit) {
  return backendJson("/auth/telegram/ticket", {
    method: "POST",
    body: {},
    headers,
    responseSchema: telegramTicketResponseSchema,
  });
}

/** Redeems the single-use link the bot delivered into the user's chat. */
export function telegramCompleteRequest(
  input: { token: string },
  headers?: HeadersInit,
) {
  return backendJson("/auth/telegram/complete", {
    method: "POST",
    body: input,
    headers,
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

/** `GET /schools/:schoolId/invites/teacher` — outstanding invites, without links. */
export function listTeacherInvitesRequest(
  schoolId: string,
  requestJson: BackendRequester = backendJson,
) {
  return requestJson(`/schools/${schoolId}/invites/teacher`, {
    responseSchema: teacherInviteListResponseSchema,
  });
}

/**
 * `POST /schools/:schoolId/invites/teacher/:inviteId/reissue` — mints a fresh
 * token for an outstanding invite and returns the usable link. The previous
 * link stops working, which is why this is a deliberate action and not a read.
 */
export function reissueTeacherInviteRequest(
  schoolId: string,
  inviteId: string,
  requestJson: BackendRequester = backendJson,
) {
  return requestJson(`/schools/${schoolId}/invites/teacher/${inviteId}/reissue`, {
    method: "POST",
    responseSchema: teacherInviteResponseSchema,
  });
}

export function revokeTeacherInviteRequest(
  schoolId: string,
  inviteId: string,
  requestJson: BackendRequester = backendJson,
) {
  return requestJson(`/schools/${schoolId}/invites/teacher/${inviteId}`, {
    method: "DELETE",
  });
}

/** `PATCH /schools/:schoolId/members/:memberId/role` — promote or demote. */
export function updateMemberRoleRequest(
  schoolId: string,
  memberId: string,
  body: { role: "ADMIN" | "TEACHER"; canManageAdmins?: boolean },
  requestJson: BackendRequester = backendJson,
) {
  return requestJson(`/schools/${schoolId}/members/${memberId}/role`, {
    method: "PATCH",
    body,
  });
}

export function listSchoolBlocklistRequest(
  schoolId: string,
  requestJson: BackendRequester = backendJson,
) {
  return requestJson(`/schools/${schoolId}/blocklist`, {
    responseSchema: schoolBlocklistResponseSchema,
  });
}

export function addSchoolBlocklistEntryRequest(
  schoolId: string,
  body: { memberId?: string; email?: string; reason?: string },
  requestJson: BackendRequester = backendJson,
) {
  return requestJson(`/schools/${schoolId}/blocklist`, {
    method: "POST",
    body,
  });
}

export function removeSchoolBlocklistEntryRequest(
  schoolId: string,
  entryId: string,
  requestJson: BackendRequester = backendJson,
) {
  return requestJson(`/schools/${schoolId}/blocklist/${entryId}`, {
    method: "DELETE",
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
