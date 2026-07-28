"use client";

import { useEffect, useState, useTransition } from "react";
import { Laptop, LoaderCircle, LogOut, Smartphone } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";

import {
  listProfileSessionsAction,
  revokeSessionAction,
} from "@/app/(root)/_lib/profile-actions";
import type { ProfileSession } from "@/app/(root)/_lib/profile.schemas";
import { RelativeTime } from "@/components/Custom/RelativeTime";
import { cn } from "@/lib/utils";

function pickDeviceIcon(userAgent: string | null | undefined) {
  if (!userAgent) return Laptop;
  return /Mobile|Android|iPhone|iPad/i.test(userAgent) ? Smartphone : Laptop;
}

function pickDeviceLabel(userAgent: string | null | undefined) {
  if (!userAgent) return null;
  const patterns: Array<[RegExp, string]> = [
    [/iPhone/i, "iPhone"],
    [/iPad/i, "iPad"],
    [/Android/i, "Android"],
    [/Mac OS X|Macintosh/i, "Mac"],
    [/Windows NT/i, "Windows"],
    [/Linux/i, "Linux"],
  ];
  for (const [re, name] of patterns) {
    if (re.test(userAgent)) return name;
  }
  return null;
}

function pickBrowserLabel(userAgent: string | null | undefined) {
  if (!userAgent) return null;
  const patterns: Array<[RegExp, string]> = [
    [/Edg\//, "Edge"],
    [/OPR\//, "Opera"],
    [/Chrome\//, "Chrome"],
    [/Firefox\//, "Firefox"],
    [/Safari\//, "Safari"],
  ];
  for (const [re, name] of patterns) {
    if (re.test(userAgent)) return name;
  }
  return null;
}

export function SessionsPanel() {
  const { t } = useTranslation();
  const router = useRouter();
  const [sessions, setSessions] = useState<ProfileSession[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    let alive = true;
    (async () => {
      const result = await listProfileSessionsAction();
      if (!alive) return;
      setSessions(result.sessions);
      setError(result.error ?? null);
    })();
    return () => {
      alive = false;
    };
  }, []);

  const handleRevoke = (sessionId: string) => {
    setPendingId(sessionId);
    startTransition(async () => {
      const result = await revokeSessionAction({ sessionId });
      setPendingId(null);
      if (result?.serverError) {
        toast.error(result.serverError);
        return;
      }
      // If the backend killed the current device the action already redirected
      // us to /login, so we won't reach here in that case.
      toast.success(t("root.profile.sessions.revoked"));
      const next = await listProfileSessionsAction();
      setSessions(next.sessions);
      setError(next.error ?? null);
      router.refresh();
    });
  };

  return (
    <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
      <header className="mb-4 flex items-start gap-3">
        <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-[color-mix(in_srgb,var(--primary)_12%,transparent)] text-[var(--primary)]">
          <Laptop className="h-[18px] w-[18px]" />
        </div>
        <div className="min-w-0">
          <h2 className="text-base font-bold text-[var(--foreground)]">
            {t("root.profile.sessions.title")}
          </h2>
          <p className="mt-0.5 text-sm text-[var(--muted-foreground)]">
            {t("root.profile.sessions.description")}
          </p>
        </div>
      </header>

      {sessions === null ? (
        <div className="grid place-items-center py-10 text-[var(--muted-foreground)]">
          <LoaderCircle className="h-5 w-5 animate-spin" />
        </div>
      ) : error && sessions.length === 0 ? (
        <p className="rounded-xl border border-dashed border-[var(--border)] bg-[var(--muted)] px-4 py-6 text-center text-sm text-[var(--muted-foreground)]">
          {error}
        </p>
      ) : sessions.length === 0 ? (
        <p className="rounded-xl border border-dashed border-[var(--border)] bg-[var(--muted)] px-4 py-6 text-center text-sm text-[var(--muted-foreground)]">
          {t("root.profile.sessions.empty")}
        </p>
      ) : (
        <ul className="divide-y divide-[var(--border)] overflow-hidden rounded-xl border border-[var(--border)]">
          {sessions.map((session) => {
            const Icon = pickDeviceIcon(session.userAgent);
            const device = pickDeviceLabel(session.userAgent);
            const browser = pickBrowserLabel(session.userAgent);
            const label =
              [device, browser].filter(Boolean).join(" · ") ||
              t("root.profile.sessions.unknownDevice");
            const isRevoking = pendingId === session.sessionId && isPending;

            return (
              <li
                key={session.sessionId}
                className="flex flex-col gap-3 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex items-start gap-3">
                  <span
                    className={cn(
                      "mt-0.5 grid size-9 shrink-0 place-items-center rounded-lg",
                      session.isCurrent
                        ? "bg-[color-mix(in_srgb,var(--primary)_12%,transparent)] text-[var(--primary)]"
                        : "bg-[var(--muted)] text-[var(--muted-foreground)]",
                    )}
                  >
                    <Icon className="h-[18px] w-[18px]" />
                  </span>
                  <div className="min-w-0">
                    <p className="flex flex-wrap items-center gap-2 text-sm font-semibold text-[var(--foreground)]">
                      <span className="truncate">{label}</span>
                      {session.isCurrent ? (
                        <span className="inline-flex items-center rounded-full bg-[color-mix(in_srgb,var(--success)_16%,transparent)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[var(--success)]">
                          {t("root.profile.sessions.current")}
                        </span>
                      ) : null}
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[var(--muted-foreground)]">
                      {session.ipAddress ? <span>{session.ipAddress}</span> : null}
                      {session.ipAddress ? (
                        <span aria-hidden className="text-[var(--border)]">·</span>
                      ) : null}
                      <RelativeTime date={session.createdAt} />
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleRevoke(session.sessionId)}
                  disabled={isRevoking}
                  className={cn(
                    "inline-flex h-9 items-center gap-1.5 self-start rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 text-xs font-semibold",
                    "text-[var(--muted-foreground)] transition hover:text-[var(--destructive)] hover:border-[color-mix(in_srgb,var(--destructive)_30%,transparent)]",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] disabled:opacity-70",
                    "sm:self-auto",
                  )}
                >
                  {isRevoking ? (
                    <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <LogOut className="h-3.5 w-3.5" />
                  )}
                  {t(
                    session.isCurrent
                      ? "root.profile.sessions.signOut"
                      : "root.profile.sessions.revoke",
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
