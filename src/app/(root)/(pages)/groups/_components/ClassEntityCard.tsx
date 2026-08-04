"use client";

import type { ReactNode } from "react";
import { Clock, Lock, Users, XCircle, type LucideIcon } from "lucide-react";

import Avatar from "@/components/ui/Avatar";
import Badge from "@/components/ui/badge";
import { Button } from "@/components/ui/Button";
import Surface from "@/components/ui/Surface";
import { cn } from "@/lib/utils";

/**
 * One class in a browse list.
 *
 * `StudentClassCard` and `TeacherClassCard` were the same card written twice — identical tile,
 * title, badge, subtitle, description clamp, chip row, and footer — differing only in which chips
 * they showed and which action the backend flags resolved to. The two had already drifted (the
 * student card offered a filled "Open", the teacher card an outline one, for the same act of
 * entering a class).
 *
 * The shell lives here; the *decision* of which action to show stays in each caller, because those
 * rules genuinely differ and are driven by different backend flags. What is shared is how each
 * resulting state looks — hence the exported action blocks below.
 */
export type ClassEntityCardProps = {
  name: string;
  pictureUrl?: string | null;
  /** Accent classes for the initial tile, from `classAccent(id)`. */
  accentClassName?: string;
  /** The lead teacher, or the "no teacher yet" fallback — always present so cards align. */
  subtitle: string;
  description?: string | null;
  /** "Enrolled" / "Teaching" — the viewer's relationship to this class. */
  badge?: string;
  /** The chip row: seats, enrolment mode, student count. */
  chips?: ReactNode;
  action: ReactNode;
  /** The card's dialog, rendered as a sibling. */
  children?: ReactNode;
};

export default function ClassEntityCard({
  name,
  pictureUrl,
  accentClassName,
  subtitle,
  description,
  badge,
  chips,
  action,
  children,
}: Readonly<ClassEntityCardProps>) {
  return (
    <Surface className="flex h-full flex-col">
      <div className="flex items-start gap-3">
        <Avatar
          name={name}
          src={pictureUrl}
          size="md"
          shape="rounded"
          className={accentClassName}
        />

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="truncate text-15 font-semibold text-foreground">{name}</h3>
            {badge ? (
              <Badge variant="primary" size="xs">
                {badge}
              </Badge>
            ) : null}
          </div>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">{subtitle}</p>
        </div>
      </div>

      {description ? (
        <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">{description}</p>
      ) : null}

      {chips ? <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">{chips}</div> : null}

      {/* Pushes the action to the bottom so a row of cards has one action line. */}
      <div className="mt-4 flex-1" />

      <div className="mt-2">{action}</div>

      {children}
    </Surface>
  );
}

/** A fact chip in the card's meta row. `outline` reads as a mode, `fill` as a count. */
export function ClassCardChip({
  icon: Icon = Users,
  showIcon = true,
  variant = "fill",
  children,
}: Readonly<{
  icon?: LucideIcon;
  showIcon?: boolean;
  variant?: "fill" | "outline";
  children: ReactNode;
}>) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 font-medium text-muted-foreground",
        variant === "fill" ? "bg-muted" : "border border-border",
      )}
    >
      {showIcon ? <Icon aria-hidden className="size-3.5" /> : null}
      {children}
    </span>
  );
}

/** Awaiting an admin decision, with the way to withdraw. */
export function ClassCardPendingAction({
  label,
  cancelLabel,
  isCancelling,
  onCancel,
}: Readonly<{
  label: string;
  cancelLabel: string;
  isCancelling: boolean;
  onCancel: () => void;
}>) {
  return (
    <div className="flex flex-col gap-2">
      <span className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-warning/12 px-2.5 py-2 text-sm font-medium text-warning">
        <Clock aria-hidden className="size-4" />
        {label}
      </span>
      <Button
        variant="outline"
        className="w-full"
        loading={isCancelling}
        onClick={onCancel}
      >
        {cancelLabel}
      </Button>
    </div>
  );
}

/**
 * Not joinable. Always states the reason — a disabled control with no explanation is a dead end,
 * and the reason is the only thing that tells the user whether to wait or to ask someone.
 */
export function ClassCardLockedAction({ label }: Readonly<{ label: string }>) {
  return (
    <span className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-border px-2.5 py-2 text-sm font-medium text-muted-foreground">
      <Lock aria-hidden className="size-3.5" />
      {label}
    </span>
  );
}

/** A prior request was declined. Sits above a fresh request button. */
export function ClassCardRejectedNotice({ label }: Readonly<{ label: string }>) {
  return (
    <span className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-[color-mix(in_srgb,var(--destructive)_12%,transparent)] px-2.5 py-2 text-sm font-medium text-destructive">
      <XCircle aria-hidden className="size-4" />
      {label}
    </span>
  );
}

export { ClassEntityCard };
