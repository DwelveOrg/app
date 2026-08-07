import { decodeJwt } from 'jose';

import { SESSION_COOKIE_NAME, SESSION_DURATION_MS } from '../_constants/session';
import type { SessionPayload } from '../_types/auth';
import { encryptSession } from './session-token';

export type SessionProfile = Omit<SessionPayload, 'expiresAt'>;

export type SessionCookieOptions = {
    httpOnly: true;
    secure: boolean;
    sameSite: 'lax';
    path: '/';
    expires: Date;
};

/** The encrypted session cookie, ready for whoever is able to write it. */
export type SessionCookie = {
    name: typeof SESSION_COOKIE_NAME;
    value: string;
    options: SessionCookieOptions;
};

/**
 * The attributes every write of the session cookie must carry. Exported so a
 * caller re-writing the existing value cannot accidentally drop `httpOnly` or
 * `secure` by omitting them — a plain `set(name, value)` would do exactly that.
 */
export function sessionCookieOptions(expires: Date): SessionCookieOptions {
    return {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        expires,
    };
}

/**
 * Builds the session cookie without touching `next/headers`, so the proxy can
 * write the same cookie the app does.
 *
 * That split matters: Next only allows cookie writes during the action phase,
 * so a Server Component render cannot persist a rotated token. The proxy is the
 * one place on a plain navigation where it can — see `src/proxy.ts`.
 */
export async function buildSessionCookie(profile: SessionProfile): Promise<SessionCookie> {
    const expires = getSessionExpiry(profile.refreshToken);

    return {
        name: SESSION_COOKIE_NAME,
        value: await encryptSession({ ...profile, expiresAt: expires.toISOString() }),
        options: sessionCookieOptions(expires),
    };
}

/**
 * The encrypted frontend session stores the refresh token. It must stay valid
 * until that token expires, otherwise an access-token refresh cannot happen
 * after the frontend cookie's shorter lifetime has elapsed.
 *
 * The token is issued by our backend and kept inside an httpOnly encrypted
 * cookie. Decoding here only reads its standard `exp` claim to align the cookie
 * lifetime; the backend remains responsible for verifying and rotating it.
 */
export function getSessionExpiry(refreshToken?: string) {
    if (refreshToken) {
        try {
            const expiresAt = decodeJwt(refreshToken).exp;

            if (typeof expiresAt === 'number' && expiresAt * 1000 > Date.now()) {
                return new Date(expiresAt * 1000);
            }
        } catch {
            // Preserve the existing short-lived fallback for malformed tokens.
        }
    }

    return new Date(Date.now() + SESSION_DURATION_MS);
}
