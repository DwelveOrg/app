import "server-only";

import type { z } from "zod";

import type { BackendRequestInit } from "@/lib/api/backend";
import { authedBackendJson } from "@/app/(authentication)/_lib/backend";
import {
  changePasswordResponseSchema,
  deleteAccountResponseSchema,
  profileResponseSchema,
  profileSessionsResponseSchema,
  revokeSessionResponseSchema,
} from "./profile.schemas";

/**
 * Named endpoint functions for the `/profile` API. Every call goes through
 * `authedBackendJson` (attaches the session bearer token) and validates the
 * response with a Zod schema, per `docs/architecture/ARCHITECTURE.md` and the
 * shape documented in `docs/features/profile-page-contract.md`.
 */

type BackendRequester = <TSchema extends z.ZodTypeAny>(
  path: string,
  init: BackendRequestInit<TSchema>,
) => Promise<z.infer<TSchema>>;

/** `GET /profile` — page bootstrap. */
export function getProfileRequest(requestJson: BackendRequester = authedBackendJson) {
  return requestJson("/profile", { responseSchema: profileResponseSchema });
}

/** `PATCH /profile` — rename the account. */
export function updateProfileRequest(
  body: { fullName: string },
  requestJson: BackendRequester = authedBackendJson,
) {
  return requestJson("/profile", {
    method: "PATCH",
    body,
    responseSchema: profileResponseSchema,
  });
}

/**
 * `PATCH /profile/avatar` — multipart form. Pass either a file or the
 * `removeAvatar` flag; never both (backend returns 400 if both are set).
 */
export function updateAvatarRequest(
  form: FormData,
  requestJson: BackendRequester = authedBackendJson,
) {
  return requestJson("/profile/avatar", {
    method: "PATCH",
    body: form,
    responseSchema: profileResponseSchema,
  });
}

/**
 * `PATCH /profile/school-profile` — updates teacher/student role fields for the
 * currently selected school. Admin members do not have this profile; do not
 * call this for admin sessions.
 */
export function updateSchoolProfileRequest(
  body: { phone?: string | null; bio?: string | null },
  requestJson: BackendRequester = authedBackendJson,
) {
  return requestJson("/profile/school-profile", {
    method: "PATCH",
    body,
    responseSchema: profileResponseSchema,
  });
}

/**
 * `POST /profile/change-password` — returns fresh tokens; older refreshes are
 * revoked. `currentPassword` is omitted for first-time password setup on accounts
 * without a password yet (e.g. Google-only users); see `profile-page-contract.md`.
 */
export function changePasswordRequest(
  body: { currentPassword?: string; newPassword: string },
  requestJson: BackendRequester = authedBackendJson,
) {
  const payload: { currentPassword?: string; newPassword: string } = {
    newPassword: body.newPassword,
  };
  if (body.currentPassword !== undefined) {
    payload.currentPassword = body.currentPassword;
  }

  return requestJson("/profile/change-password", {
    method: "POST",
    body: payload,
    responseSchema: changePasswordResponseSchema,
  });
}

/**
 * `DELETE /profile` — permanently deletes the authenticated account and the
 * relations configured to cascade, then revokes its refresh sessions. Never
 * retry this automatically.
 */
export function deleteAccountRequest(requestJson: BackendRequester = authedBackendJson) {
  return requestJson("/profile", {
    method: "DELETE",
    responseSchema: deleteAccountResponseSchema,
  });
}

/** `GET /profile/sessions` — active refresh sessions for the current user. */
export function getProfileSessionsRequest(requestJson: BackendRequester = authedBackendJson) {
  return requestJson("/profile/sessions", {
    responseSchema: profileSessionsResponseSchema,
  });
}

/**
 * `DELETE /profile/sessions/:sessionId` — revoke one session. If
 * `revokedCurrent` is `true` the caller should clear local tokens and route the
 * user to login.
 */
export function revokeProfileSessionRequest(
  sessionId: string,
  requestJson: BackendRequester = authedBackendJson,
) {
  return requestJson(`/profile/sessions/${encodeURIComponent(sessionId)}`, {
    method: "DELETE",
    responseSchema: revokeSessionResponseSchema,
  });
}
