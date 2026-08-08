import "server-only";

import { z } from "zod";

import type { BackendRequestInit } from "@/lib/api/backend";
import { backendJson, BackendApiError } from "./api";
import {
  canPersistSession,
  createSession,
  deleteSession,
  getSession,
} from "./session";
import { refreshTokensOnce, rotatedSessionProfile } from "./token-refresh";
import type { SessionPayload } from "../_types/auth";

/** Thrown when an authenticated request has no usable session / access token. */
export class SessionExpiredError extends BackendApiError {
  constructor(message = "Your session expired. Please log in again.") {
    // Session expiry is an authentication failure. Extending BackendApiError
    // lets every existing server-action error mapper present this safe message
    // instead of falling back to a feature-specific error or exposing the
    // backend's "Invalid refresh token" response.
    super(message, 401);
    this.name = "SessionExpiredError";
  }
}

/**
 * Drops a session once its credentials can no longer be refreshed. This helper
 * is also used by server-rendered reads, where Next.js does not allow cookie
 * mutation, so clearing the cookie is deliberately best-effort there. Server
 * actions—the usual source of a user-triggered error—will clear it and let the
 * user open the login page immediately.
 */
async function throwSessionExpired(): Promise<never> {
  await deleteSession().catch(() => undefined);
  throw new SessionExpiredError();
}

/**
 * Exchanges the refresh token for a new access token and rewrites the session.
 * Only ever called where cookies are writable — see `canPersistSession`.
 */
async function refreshAccessToken(current: SessionPayload) {
  if (!current.refreshToken) {
    throw new SessionExpiredError();
  }

  const tokens = await refreshTokensOnce(current.refreshToken);

  await createSession(rotatedSessionProfile(current, tokens));

  return tokens.accessToken;
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
    return throwSessionExpired();
  }

  try {
    return await backendJson(path, withAuthHeader(init, session.accessToken));
  } catch (error) {
    const isUnauthorized = error instanceof BackendApiError && error.status === 401;

    if (!isUnauthorized) {
      throw error;
    }

    if (!session.refreshToken) {
      return throwSessionExpired();
    }

    // Refresh tokens are single-use, so a refresh started where its replacement
    // cannot be saved — any Server Component render — would spend the token and
    // strand the session permanently. Leaving it unspent keeps the session
    // recoverable: the proxy refreshes it on the next navigation, where cookie
    // writes are allowed.
    if (!(await canPersistSession(session))) {
      throw new SessionExpiredError();
    }

    let newAccessToken: string;

    try {
      newAccessToken = await refreshAccessToken(session);
    } catch (refreshError) {
      // A refresh token can legitimately expire or be revoked while a user is
      // away. That is not actionable as "Invalid refresh token"; tell the
      // user exactly how to continue instead. Other failures (for example a
      // timeout or rate limit) retain their original messages.
      if (refreshError instanceof BackendApiError && refreshError.status === 401) {
        // Another request may have rotated the tokens between this one reading
        // the session and its refresh landing, which spends the token this call
        // is holding. That is a lost race, not an expired session, so retry
        // with whatever the winner wrote before giving up on the user.
        const rotated = await getSession();

        if (rotated?.accessToken && rotated.accessToken !== session.accessToken) {
          return backendJson(path, withAuthHeader(init, rotated.accessToken));
        }

        return throwSessionExpired();
      }

      throw refreshError;
    }

    return backendJson(path, withAuthHeader(init, newAccessToken));
  }
}
