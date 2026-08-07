import { decodeJwt } from "jose";

import { refreshTokensRequest, type AuthTokens } from "./api";
import type { SessionProfile } from "./session-cookie";
import type { SchoolRole, SessionPayload } from "../_types/auth";

/**
 * Token rotation, shared by the two runtimes that perform it: the proxy, which
 * refreshes ahead of a render because that is where cookie writes are allowed,
 * and `authedBackendJson`, which refreshes reactively inside a server action.
 *
 * Nothing here touches `next/headers`, so it is safe in middleware.
 */

/**
 * Refresh an access token this long before it actually expires, so a token that
 * is alive when the proxy checks it is still alive when the render using it
 * reaches the backend.
 */
export const ACCESS_TOKEN_SKEW_SECONDS = 30;

/**
 * A single access-token expiry can cause several requests to receive a 401 at
 * once. Refresh tokens are single-use, so those requests must share one refresh
 * operation instead of each attempting to rotate the same token. The map is per
 * runtime instance; the backend's atomic take is the authoritative guard.
 */
const pendingRefreshes = new Map<string, Promise<AuthTokens>>();

export function refreshTokensOnce(refreshToken: string): Promise<AuthTokens> {
  const pendingRefresh = pendingRefreshes.get(refreshToken);

  if (pendingRefresh) {
    return pendingRefresh;
  }

  const refresh = refreshTokensRequest(refreshToken);
  pendingRefreshes.set(refreshToken, refresh);

  const forget = () => {
    if (pendingRefreshes.get(refreshToken) === refresh) {
      pendingRefreshes.delete(refreshToken);
    }
  };

  void refresh.then(forget, forget);

  return refresh;
}

/**
 * The session to store after a rotation. The refresh endpoint returns tokens
 * only, so the existing session's identity is preserved and just the school
 * context is re-read from the new access token.
 */
export function rotatedSessionProfile(
  session: SessionPayload,
  tokens: AuthTokens,
): SessionProfile {
  const { schoolId, memberId, schoolRole } = getSchoolContextFromAccessToken(
    tokens.accessToken,
  );

  return {
    userId: session.userId,
    email: session.email,
    fullName: session.fullName,
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    schoolId,
    memberId,
    schoolRole,
    membershipCount: session.membershipCount,
  };
}

export function getSchoolContextFromAccessToken(
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

/**
 * A token that cannot be read is treated as expiring, so a malformed access
 * token is replaced rather than sent to the backend to be rejected.
 */
export function isAccessTokenExpiring(accessToken: string | undefined) {
  if (!accessToken) {
    return true;
  }

  try {
    const expiresAt = decodeJwt(accessToken).exp;

    if (typeof expiresAt !== "number") {
      return true;
    }

    return expiresAt - ACCESS_TOKEN_SKEW_SECONDS <= Date.now() / 1000;
  } catch {
    return true;
  }
}
