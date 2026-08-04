"use client";

import type { LucideIcon } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";

import { cn } from "@/lib/utils";

/**
 * A flat segmented control: one tap to switch, with a sliding indicator.
 *
 * Promoted out of the settings route, which was the only place it lived even though it is the right
 * control for any small, mutually-exclusive choice. Replaces dropdown selects for theme, language,
 * and view switches. The selected segment is the only place the action accent appears.
 *
 * `fallback` renders the same geometry before hydration, so a client-only value (theme, locale)
 * doesn't shift the layout when it resolves.
 */
export type SegmentedOption<T extends string> = {
  value: T;
  label: string;
  icon?: LucideIcon;
};

export type SegmentedProps<T extends string> = {
  value: T;
  onChange: (value: T) => void;
  options: SegmentedOption<T>[];
  ariaLabel: string;
  /** Unique id so the sliding highlight animates only within this control. */
  layoutId: string;
  /** Render the placeholder instead of the control (pre-hydration). */
  pending?: boolean;
  className?: string;
};

const SHELL = "grid auto-cols-fr grid-flow-col gap-1 rounded-xl border border-border bg-muted p-1";

export default function Segmented<T extends string>({
  value,
  onChange,
  options,
  ariaLabel,
  layoutId,
  pending = false,
  className,
}: SegmentedProps<T>) {
  const reduce = useReducedMotion();

  if (pending) {
    return <div aria-hidden className={cn(SHELL, "h-11", className)} />;
  }

  return (
    <div role="radiogroup" aria-label={ariaLabel} className={cn(SHELL, className)}>
      {options.map((option) => {
        const Icon = option.icon;
        const active = option.value === value;

        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(option.value)}
            className={cn(
              "interactive-flat relative flex cursor-pointer items-center justify-center gap-2",
              "rounded-lg px-2.5 py-2 text-[13px] font-semibold",
              "outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
              active ? "text-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {active ? (
              <motion.span
                layoutId={layoutId}
                aria-hidden
                className="absolute inset-0 -z-10 rounded-lg border border-primary/25 bg-card shadow-elev-1"
                transition={{ duration: reduce ? 0 : 0.24, ease: [0.22, 1, 0.36, 1] }}
              />
            ) : null}
            {Icon ? (
              <Icon
                className={cn("size-4 shrink-0", active ? "text-primary" : "text-muted-foreground")}
              />
            ) : null}
            <span className="truncate">{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}

export { Segmented };
