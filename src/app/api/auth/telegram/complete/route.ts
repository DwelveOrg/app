import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { telegramCompleteRequest } from "@/app/(authentication)/_lib/api";
import { authResponseSessionProfile } from "@/app/(authentication)/_lib/auth-session";
import { buildSessionCookie } from "@/app/(authentication)/_lib/session-cookie";
import {
  clearTelegramNextCookie,
  TELEGRAM_NEXT_COOKIE,
  telegramReturnUrl,
} from "@/app/(authentication)/_lib/telegram-bot";
import { safeNextPath } from "@/app/(authentication)/_utils/next-path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Redeems the single-use link the bot sent. This runs in whichever browser
 * opened the link from Telegram, which is exactly the point: the session is
 * established for the person who owns the account, not for whoever started the
 * flow — a deep link can be forwarded, this link cannot be usefully stolen.
 */
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");
  const next = request.cookies.get(TELEGRAM_NEXT_COOKIE)?.value;

  if (!token) {
    return failure(request, next);
  }

  try {
    const authResponse = await telegramCompleteRequest({ token }, clientContextHeaders(request));
    const sessionCookie = await buildSessionCookie(authResponseSessionProfile(authResponse));
    const fallback = authResponse.isNewUser ? "/onboarding" : "/dashboard";
    const response = NextResponse.redirect(
      new URL(safeNextPath(next, fallback), request.url),
    );

    response.cookies.set(sessionCookie.name, sessionCookie.value, sessionCookie.options);
    clearTelegramNextCookie(response);
    response.headers.set("Cache-Control", "private, no-store, max-age=0");
    return response;
  } catch (error) {
    console.error(
      "[telegram-auth] complete failed:",
      error instanceof Error ? error.message : error,
    );

    return failure(request, next);
  }
}

/** An expired or already-used link is the ordinary case, so it reads as "expired". */
function failure(request: NextRequest, next?: string) {
  const response = NextResponse.redirect(
    telegramReturnUrl(request, "login", "expired", next),
  );
  clearTelegramNextCookie(response);
  response.headers.set("Cache-Control", "private, no-store, max-age=0");
  return response;
}

function clientContextHeaders(request: NextRequest): HeadersInit | undefined {
  const headers: Record<string, string> = {};
  const userAgent = request.headers.get("user-agent");
  const forwardedFor = request.headers.get("x-forwarded-for");

  if (userAgent) headers["User-Agent"] = userAgent;
  if (forwardedFor) headers["X-Forwarded-For"] = forwardedFor;
  return Object.keys(headers).length > 0 ? headers : undefined;
}
