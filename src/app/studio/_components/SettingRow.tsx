"use client";

import type { ReactNode } from "react";

import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

/**
 * One decision, stated in full.
 *
 * A publishing value can change what happens to a real student mid-exam. A
 * bare label beside a control is not enough for that: every row states what the
 * setting does, because a teacher should never have to publish once to find out.
 *
 * `children` is the dependent detail — the follow-up control a rule reveals when
 * it is on. Nesting it inside the row rather than placing it as a sibling is
 * what makes "leaving the screen ends the attempt after 3 warnings" read as one
 * rule instead of three unrelated controls.
 */
export function SettingRow({
  icon,
  title,
  description,
  control,
  children,
  danger = false,
  className,
}: {
  icon?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  /** The control itself — a `Switch`, a `Segmented`, a number input. */
  control: ReactNode;
  /** Dependent settings, shown only when the parent is on. */
  children?: ReactNode;
  /** Marks a rule that can end a student's attempt. */
  danger?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("px-4 py-3.5 sm:px-5", className)}>
      <div className="flex items-start gap-3">
        {icon ? (
          <span
            aria-hidden="true"
            className={cn(
              "mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg [&_svg]:size-4",
              danger
                ? "bg-[color-mix(in_srgb,var(--warning)_14%,transparent)] text-warning"
                : "bg-muted text-muted-foreground",
            )}
          >
            {icon}
          </span>
        ) : null}

        <div className="min-w-0 flex-1">
          <p className="type-label text-foreground">{title}</p>
          {description ? (
            <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
          ) : null}
        </div>

        <div className="flex shrink-0 items-center pt-0.5">{control}</div>
      </div>

      {children ? (
        // Indented to the icon column so the dependency is spatial, not just
        // conditional — a follow-up flush with its parent reads as a peer.
        <div className="mt-3 ml-0 space-y-3 border-l-2 border-border pl-3 sm:ml-11">
          {children}
        </div>
      ) : null}
    </div>
  );
}

/** The common case: a labelled switch. */
export function SwitchSetting({
  icon,
  title,
  description,
  checked,
  onCheckedChange,
  disabled,
  danger,
  children,
}: {
  icon?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  danger?: boolean;
  children?: ReactNode;
}) {
  return (
    <SettingRow
      icon={icon}
      title={title}
      description={description}
      danger={danger}
      control={
        <Switch
          checked={checked}
          onCheckedChange={onCheckedChange}
          disabled={disabled}
          aria-label={typeof title === "string" ? title : undefined}
        />
      }
    >
      {checked ? children : null}
    </SettingRow>
  );
}

export default SettingRow;
