import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE_NAME } from "./app/(authentication)/_constants/session";
import { protectedRoutes, publicRoutes} from "./app/(authentication)/_constants/routes";
import { buildSessionCookie } from './app/(authentication)/_lib/session-cookie';
import { decryptSession } from './app/(authentication)/_lib/session-token';
import {
    isAccessTokenExpiring,
    refreshTokensOnce,
    rotatedSessionProfile,
} from './app/(authentication)/_lib/token-refresh';
import type { SessionPayload } from './app/(authentication)/_types/auth';

function isRouteMatch(path: string, routes: readonly string[]) {
    return routes.some((route) => path === route || path.startsWith(`${route}/`));
}

export default async function proxy(req: NextRequest){
    const path = req.nextUrl.pathname;
    const isProtectedRoute = isRouteMatch(path, protectedRoutes)
    const isPublicRoute = isRouteMatch(path, publicRoutes)

    const cookie = req.cookies.get(SESSION_COOKIE_NAME)?.value
    const session = await decryptSession(cookie)

    if(isProtectedRoute && !session?.userId){
        return NextResponse.redirect(new URL('/login', req.url))
    }

    if(isPublicRoute && session?.userId){
        return NextResponse.redirect(new URL('/dashboard', req.url))
    }

    return withRefreshedSession(req, session);
}

/**
 * Rotates an expiring access token before the render that needs it runs.
 *
 * This has to happen here rather than in `authedBackendJson`, because Next only
 * allows cookie writes during the action phase: a Server Component render that
 * refreshed would spend the single-use refresh token and then be unable to save
 * its replacement, ending the session for good. Access tokens live 15 minutes
 * while the session cookie lives as long as the refresh token, so that is the
 * ordinary path for any session more than a few minutes old — not an edge case.
 */
async function withRefreshedSession(req: NextRequest, session: SessionPayload | null) {
    if (!session?.refreshToken || !isAccessTokenExpiring(session.accessToken)) {
        return NextResponse.next();
    }

    // Prefetches and `router.refresh()` rotate the token here too, rather than
    // being skipped. Next strips its own `next-router-prefetch` / `rsc` headers
    // before the proxy runs, so a prefetch is not distinguishable from a real
    // navigation — and it does not need to be: RSC requests are fetched with
    // `credentials: 'same-origin'`, so the rotated cookie is stored just the
    // same. `refreshTokensOnce` keeps a burst of them to one rotation.
    let cookie;

    try {
        const tokens = await refreshTokensOnce(session.refreshToken);
        cookie = await buildSessionCookie(rotatedSessionProfile(session, tokens));
    } catch {
        // Leave the existing cookie alone. A revoked or expired refresh token
        // surfaces as SessionExpiredError from the read that follows, and a
        // transient failure costs nothing more than one unrefreshed navigation.
        return NextResponse.next();
    }

    // Written onto the request as well as the response: the response cookie is
    // what the browser sends next time, while this render reads the request.
    req.cookies.set(cookie.name, cookie.value);

    const response = NextResponse.next({ request: { headers: req.headers } });
    response.cookies.set(cookie.name, cookie.value, cookie.options);

    return response;
}

/**
 * Skip the proxy for static assets and Next internals so session decryption only
 * runs on real navigations. Keeps request handling cheap and reduces surface.
 */
export const config = {
    matcher: ["/((?!_next/static|_next/image|favicon.ico|images|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
