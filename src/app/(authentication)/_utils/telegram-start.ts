import { safeNextPath } from "./next-path";

export type TelegramAuthStatus = "cancelled" | "expired" | "failed" | "unavailable";

const TELEGRAM_AUTH_STATUSES: readonly TelegramAuthStatus[] = [
  "cancelled",
  "expired",
  "failed",
  "unavailable",
];

export function parseTelegramAuthStatus(value?: string): TelegramAuthStatus | undefined {
  return TELEGRAM_AUTH_STATUSES.includes(value as TelegramAuthStatus)
    ? (value as TelegramAuthStatus)
    : undefined;
}

export function telegramStartHref(source: "login" | "signup", next?: string) {
  const params = new URLSearchParams({ source });
  const safeNext = safeNextPath(next, "");
  if (safeNext) params.set("next", safeNext);
  return `/api/auth/telegram/start?${params.toString()}`;
}
