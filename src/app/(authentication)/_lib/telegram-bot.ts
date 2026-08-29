import "server-only";

import type { NextResponse } from "next/server";

import type { TelegramAuthStatus } from "../_utils/telegram-start";
import { safeNextPath } from "../_utils/next-path";
import type { NextRequest } from "next/server";

/**
 * The post-sign-in path, remembered across the trip through Telegram.
 *
 * Only `next` needs a cookie now. Bot sign-in has no `state` to compare and no
 * PKCE verifier to hold: the credential that establishes the session is issued
 * by the backend and delivered through the user's own Telegram chat, so nothing
 * secret is ever parked in the browser that started the flow.
 */
export const TELEGRAM_NEXT_COOKIE = "dwelve_telegram_next";

export function telegramNextCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/api/auth/telegram",
    maxAge: 10 * 60,
    priority: "high" as const,
  };
}

export function clearTelegramNextCookie(response: NextResponse) {
  response.cookies.set(TELEGRAM_NEXT_COOKIE, "", {
    ...telegramNextCookieOptions(),
    maxAge: 0,
  });
}

export function telegramReturnUrl(
  request: NextRequest,
  source: "login" | "signup",
  status: TelegramAuthStatus,
  next?: string,
) {
  const url = new URL(source === "signup" ? "/signup" : "/login", request.url);
  url.searchParams.set("telegram", status);

  const safeNext = safeNextPath(next, "");
  if (safeNext) {
    url.searchParams.set("next", safeNext);
  }

  return url;
}

export function telegramAuthSource(value: string | undefined | null): "login" | "signup" {
  return value === "signup" ? "signup" : "login";
}
