"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { GraduationCap, X } from "lucide-react";

import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/Button";

/**
 * The exam room's only chrome.
 *
 * Modelled on `StudioTopBar` and different in one deliberate way: **during an
 * attempt there is no exit control.** The studio's `X` is right there because
 * leaving a draft costs nothing; leaving a live exam is either abandoning it or
 * submitting it, and both are decisions that belong to a considered press of
 * Submit rather than to a close button sitting where muscle memory expects one.
 *
 * `exitHref` therefore exists only for the cover and result screens, where
 * leaving is exactly what the student may want.
 */
export default function ExamTopBar({
  title,
  subtitle,
  status,
  actions,
  exitHref,
  exitLabel,
}: {
  title: string;
  subtitle?: string;
  /** Timer and save state — facts, not controls. */
  status?: ReactNode;
  actions?: ReactNode;
  exitHref?: string;
  /** Defaults to a generic "Close" — the pages are server components with no `t`. */
  exitLabel?: string;
}) {
  const { t } = useTranslation();
  const label = exitLabel ?? t("exam.close");

  return (
    <header className="sticky top-0 z-30 flex shrink-0 items-center gap-3 border-b border-border bg-card px-3 py-2.5 shadow-elev-1 sm:px-4">
      {exitHref ? (
        <Button asChild variant="ghost" size="icon-sm" aria-label={label} title={label}>
          <Link href={exitHref}>
            <X />
          </Link>
        </Button>
      ) : (
        <span
          aria-hidden="true"
          className="grid size-7 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground"
        >
          <GraduationCap className="size-4" />
        </span>
      )}

      <div className="h-6 w-px shrink-0 bg-border" aria-hidden="true" />

      <div className="min-w-0 flex-1">
        {title ? (
          <p className="truncate text-sm font-semibold text-foreground">{title}</p>
        ) : null}
        {subtitle ? (
          <p className="truncate text-2xs text-muted-foreground tabular-nums">{subtitle}</p>
        ) : null}
      </div>

      {status ? (
        <div className="flex shrink-0 items-center gap-2">{status}</div>
      ) : null}

      {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
    </header>
  );
}
