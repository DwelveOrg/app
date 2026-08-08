"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { X } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

/**
 * The studio's only persistent chrome.
 *
 * It replaces the dashboard sidebar, so it has to carry the three things the
 * sidebar carried plus the two the builder needs: where you are, how to leave,
 * what state the document is in, and what you can do to it. Everything else
 * belongs to the page.
 *
 * `exitHref` is a real link rather than `router.back()`: a teacher arrives here
 * from the class list, from a notification, or from a bookmark, and "back"
 * means something different in each. Up is unambiguous.
 */
export default function StudioTopBar({
  exitHref,
  exitLabel,
  identity,
  status,
  center,
  actions,
  onExit,
}: {
  exitHref: string;
  exitLabel: string;
  /** Format mark, title, and anything else that names the document. */
  identity: ReactNode;
  /** Status badge and save state — facts, not controls. */
  status?: ReactNode;
  /** Optional middle slot: the wizard puts its step rail here. */
  center?: ReactNode;
  actions?: ReactNode;
  /**
   * Intercepts the exit so the builder can confirm unsaved work. When it
   * returns `false` the navigation is cancelled.
   */
  onExit?: () => boolean;
}) {
  return (
    <header
      className={cn(
        "z-30 flex shrink-0 items-center gap-3 border-b border-border bg-card px-3 py-2.5 shadow-elev-1 sm:px-4",
      )}
    >
      <Button
        asChild
        variant="ghost"
        size="icon-sm"
        aria-label={exitLabel}
        title={exitLabel}
        onClick={(event) => {
          if (onExit && !onExit()) event.preventDefault();
        }}
      >
        <Link href={exitHref}>
          <X />
        </Link>
      </Button>

      <div className="h-6 w-px shrink-0 bg-border" aria-hidden="true" />

      <div className="flex min-w-0 flex-1 items-center gap-3">{identity}</div>

      {center ? (
        <div className="hidden min-w-0 shrink-0 lg:flex lg:justify-center">{center}</div>
      ) : null}

      {status ? (
        <div className="hidden shrink-0 items-center gap-2 sm:flex">{status}</div>
      ) : null}

      {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
    </header>
  );
}
