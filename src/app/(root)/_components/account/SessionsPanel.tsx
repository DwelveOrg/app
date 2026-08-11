"use client";

import { useEffect, useState, useTransition } from "react";
import { Laptop, LogOut, Smartphone } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";

import {
  listProfileSessionsAction,
  revokeSessionAction,
} from "@/app/(root)/_lib/profile-actions";
import type { ProfileSession } from "@/app/(root)/_lib/profile.schemas";
import SectionHeader from "@/app/(root)/_components/SectionHeader";
import { RelativeTime } from "@/components/Custom/RelativeTime";
import { Button } from "@/components/ui/Button";
import { SkeletonList } from "@/components/ui/Skeleton";
import { cn } from "@/lib/utils";
import Surface from "@/components/ui/Surface";
import Badge from "@/components/ui/badge";

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
    <Surface as="section">
      <SectionHeader
        icon={Laptop}
        title={t("root.profile.sessions.title")}
        description={t("root.profile.sessions.description")}
        className="mb-5"
      />

      {sessions === null ? (
        // A list is loading, so it gets the list skeleton — a bare spinner said nothing about
        // what was coming and made this the one panel in the product that loaded differently.
        <SkeletonList count={2} itemClassName="h-20" />
      ) : error && sessions.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border bg-muted px-4 py-6 text-center text-sm text-muted-foreground">
          {error}
        </p>
      ) : sessions.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border bg-muted px-4 py-6 text-center text-sm text-muted-foreground">
          {t("root.profile.sessions.empty")}
        </p>
      ) : (
        <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border">
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
                        ? "bg-[color-mix(in_srgb,var(--primary)_12%,transparent)] text-primary"
                        : "bg-muted text-muted-foreground",
                    )}
                  >
                    <Icon className="h-[18px] w-[18px]" />
                  </span>
                  <div className="min-w-0">
                    <p className="flex flex-wrap items-center gap-2 text-sm font-semibold text-foreground">
                      <span className="truncate">{label}</span>
                      {session.isCurrent ? (
                        <Badge variant="success" size="xs" uppercase>
                          {t("root.profile.sessions.current")}
                        </Badge>
                      ) : null}
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                      {session.ipAddress ? <span>{session.ipAddress}</span> : null}
                      {session.ipAddress ? (
                        <span aria-hidden className="text-border">·</span>
                      ) : null}
                      <RelativeTime date={session.createdAt} />
                    </div>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleRevoke(session.sessionId)}
                  loading={isRevoking}
                  className="self-start font-semibold text-muted-foreground hover:border-destructive/30 hover:text-destructive sm:self-auto"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  {t(
                    session.isCurrent
                      ? "root.profile.sessions.signOut"
                      : "root.profile.sessions.revoke",
                  )}
                </Button>
              </li>
            );
          })}
        </ul>
      )}
    </Surface>
  );
}
