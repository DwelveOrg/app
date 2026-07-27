import "server-only";

import { decodeJwt } from "jose";
import { z } from "zod";

import type { BackendRequestInit } from "@/lib/api/backend";
import {
  backendJson,
  BackendApiError,
  refreshTokensRequest,
  type AuthTokens,
} from "./api";
import { createSession, getSession } from "./session";
import type { SchoolRole, SessionPayload } from "../_types/auth";

/**
 * A single access-token expiry can cause several server requests to receive a
 * 401 at once. Refresh tokens are single-use, so those requests must share one
 * refresh operation instead of each attempting to rotate the same token.
 */
const pendingRefreshes = new Map<string, Promise<AuthTokens>>();

/** Thrown when an authenticated request has no usable session / access token. */
export class SessionExpiredError extends Error {
  constructor(message = "Your session expired. Please log in again.") {
    super(message);
    this.name = "SessionExpiredError";
  }
}

/**
 * Exchanges the refresh token for a new access token and rewrites the session.
 * The refresh endpoint does not return the user or memberships, so the existing
 * session's identity is preserved and only the tokens are rotated.
 */
async function refreshAccessToken(current: SessionPayload) {
  if (!current.refreshToken) {
    throw new SessionExpiredError();
  }

  const tokens = await refreshTokensOnce(current.refreshToken);
  const schoolContext = getSchoolContextFromAccessToken(tokens.accessToken);

  await createSession({
    userId: current.userId,
    email: current.email,
    fullName: current.fullName,
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    schoolId: schoolContext.schoolId,
    memberId: schoolContext.memberId,
    schoolRole: schoolContext.schoolRole,
    membershipCount: current.membershipCount,
  });

  return tokens.accessToken;
}

function refreshTokensOnce(refreshToken: string): Promise<AuthTokens> {
  const pendingRefresh = pendingRefreshes.get(refreshToken);

  if (pendingRefresh) {
    return pendingRefresh;
  }

  const refresh = refreshTokensRequest(refreshToken);
  pendingRefreshes.set(refreshToken, refresh);

  void refresh.then(
    () => {
      if (pendingRefreshes.get(refreshToken) === refresh) {
        pendingRefreshes.delete(refreshToken);
      }
    },
    () => {
      if (pendingRefreshes.get(refreshToken) === refresh) {
        pendingRefreshes.delete(refreshToken);
      }
    },
  );

  return refresh;
}

function getSchoolContextFromAccessToken(
  accessToken: string,
): Pick<SessionPayload, "schoolId" | "memberId" | "schoolRole"> {
  try {
    const payload = decodeJwt(accessToken);
    const schoolId = typeof payload.schoolId === "string" ? payload.schoolId : undefined;
    const memberId = typeof payload.memberId === "string" ? payload.memberId : undefined;
    const schoolRole: SchoolRole | undefined =
      payload.schoolRole === "ADMIN" ||
      payload.schoolRole === "TEACHER" ||
      payload.schoolRole === "STUDENT"
        ? payload.schoolRole
        : undefined;

    if (!schoolId || !memberId || !schoolRole) {
      return {};
    }

    return { schoolId, memberId, schoolRole };
  } catch {
    // The backend only returns signed access tokens. If one cannot be decoded,
    // keep the session conservative and require the normal authenticated flow.
    return {};
  }
}

function withAuthHeader<TSchema extends z.ZodTypeAny | undefined>(
  init: BackendRequestInit<TSchema>,
  accessToken: string,
): BackendRequestInit<TSchema> {
  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${accessToken}`);

  return {
    ...init,
    headers,
  };
}

/**
 * Performs a backend request authenticated with the current session's access token.
 *
 * On a 401 response, attempts to refresh the token using the stored refresh token,
 * updates the session, and retries the request once.
 */
export async function authedBackendJson<TSchema extends z.ZodTypeAny>(
  path: string,
  init: BackendRequestInit<TSchema>,
): Promise<z.infer<TSchema>>;
export async function authedBackendJson<TResponse = unknown>(
  path: string,
  init?: BackendRequestInit,
): Promise<TResponse>;
export async function authedBackendJson(
  path: string,
  init: BackendRequestInit = {},
): Promise<unknown> {
  const session = await getSession();

  if (!session?.accessToken) {
    throw new SessionExpiredError();
  }

  try {
    return await backendJson(path, withAuthHeader(init, session.accessToken));
  } catch (error) {
    const isUnauthorized = error instanceof BackendApiError && error.status === 401;

    if (!isUnauthorized || !session.refreshToken) {
      throw error;
    }

    const newAccessToken = await refreshAccessToken(session);

    return backendJson(path, withAuthHeader(init, newAccessToken));
  }
}
