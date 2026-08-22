import 'server-only';
import { cookies } from 'next/headers';
import {
    SESSION_COOKIE_NAME,
} from '../_constants/session';
import type { SessionPayload } from '../_types/auth';
import {
    buildSessionCookie,
    getSessionExpiry,
    sessionCookieOptions,
    type SessionProfile,
} from './session-cookie';
import {
    decryptSession,
    encryptSession,
} from './session-token';

export type { SessionProfile };

export async function createSession(profile: SessionProfile) {
    const cookieStore = await cookies();
    const { name, value, options } = await buildSessionCookie(profile);

    cookieStore.set(name, value, options);
}

export async function deleteSession(){
    const cookieStore = await cookies()
    cookieStore.delete(SESSION_COOKIE_NAME)
}

export async function getSession() {
    const cookieStore = await cookies();
    return decrypt(cookieStore.get(SESSION_COOKIE_NAME)?.value);
}

export async function encrypt(payload: SessionPayload){
    return encryptSession(payload);
}

export async function decrypt(session: string | undefined = '') {
    return decryptSession(session);
}

/**
 * Whether a rotated session could actually be saved right now.
 *
 * Next only allows cookie writes during the action phase; a Server Component
 * render gets a sealed store whose `set` throws. Refresh tokens are single-use,
 * so starting a refresh in a render would spend the token and then fail to save
 * its replacement — killing the session for good. Probing first by rewriting
 * the cookie we already hold is a no-op when writes are allowed, and tells us
 * to back off before anything is spent when they are not.
 *
 * The rewrite goes through `sessionCookieOptions` so the probe cannot leave a
 * weaker cookie behind than the one it replaced.
 */
export async function canPersistSession(session: SessionPayload) {
    const cookieStore = await cookies();
    const current = cookieStore.get(SESSION_COOKIE_NAME);

    if (!current) {
        return false;
    }

    try {
        cookieStore.set(
            SESSION_COOKIE_NAME,
            current.value,
            sessionCookieOptions(getSessionExpiry(session.refreshToken)),
        );

        return true;
    } catch {
        return false;
    }
}
