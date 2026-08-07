import 'server-only';
import { decodeJwt } from 'jose';
import { cookies } from 'next/headers';
import {
    SESSION_COOKIE_NAME,
    SESSION_DURATION_MS,
} from '../_constants/session';
import type { SessionPayload } from '../_types/auth';
import {
    decryptSession,
    encryptSession,
} from './session-token';

type SessionProfile = Omit<SessionPayload, 'expiresAt'>;

export async function createSession(profile: SessionProfile) {
    const cookieStore = await cookies();
    const expiresAt = getSessionExpiry(profile.refreshToken);
    const session = await encrypt({ ...profile, expiresAt: expiresAt.toISOString() });

    cookieStore.set(SESSION_COOKIE_NAME, session, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        expires: expiresAt,
    });
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
 * The encrypted frontend session stores the refresh token. It must stay valid
 * until that token expires, otherwise an access-token refresh cannot happen
 * after the frontend cookie's shorter lifetime has elapsed.
 *
 * The token is issued by our backend and kept inside an httpOnly encrypted
 * cookie. Decoding here only reads its standard `exp` claim to align the cookie
 * lifetime; the backend remains responsible for verifying and rotating it.
 */
function getSessionExpiry(refreshToken?: string) {
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
