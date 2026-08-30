import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { telegramTicketRequest } from "@/app/(authentication)/_lib/api";
import {
  clearTelegramNextCookie,
  TELEGRAM_NEXT_COOKIE,
  telegramAuthSource,
  telegramNextCookieOptions,
  telegramReturnUrl,
} from "@/app/(authentication)/_lib/telegram-bot";
import { safeNextPath } from "@/app/(authentication)/_utils/next-path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Opens bot sign-in: asks the backend for a one-time ticket and sends the
 * browser to the bot's deep link. Nothing here proves identity — the bot
 * replies into the user's own chat with the link that actually signs them in.
 */
export async function GET(request: NextRequest) {
  const source = telegramAuthSource(request.nextUrl.searchParams.get("source"));
  const next = safeNextPath(request.nextUrl.searchParams.get("next"), "").slice(0, 1024);

  try {
    const { ticket, botUsername } = await telegramTicketRequest(
      clientContextHeaders(request),
    );
    const response = NextResponse.redirect(
      `https://t.me/${botUsername}?start=${encodeURIComponent(ticket)}`,
    );

    if (next) {
      response.cookies.set(TELEGRAM_NEXT_COOKIE, next, telegramNextCookieOptions());
    } else {
      clearTelegramNextCookie(response);
    }

    response.headers.set("Cache-Control", "private, no-store, max-age=0");
    return response;
  } catch (error) {
    // The user only ever sees "unavailable", so the reason has to reach the log.
    console.error(
      "[telegram-auth] could not open bot sign-in:",
      error instanceof Error ? error.message : error,
    );

    return NextResponse.redirect(telegramReturnUrl(request, source, "unavailable", next));
  }
}

/**
 * The ticket endpoint is rate limited per IP, and every request reaches it from
 * this server — so without forwarding the browser's address, one Vercel egress
 * IP would carry the limit for every user at once.
 */
function clientContextHeaders(request: NextRequest): HeadersInit | undefined {
  const headers: Record<string, string> = {};
  const userAgent = request.headers.get("user-agent");
  const forwardedFor = request.headers.get("x-forwarded-for");

  if (userAgent) headers["User-Agent"] = userAgent;
  if (forwardedFor) headers["X-Forwarded-For"] = forwardedFor;
  return Object.keys(headers).length > 0 ? headers : undefined;
}
