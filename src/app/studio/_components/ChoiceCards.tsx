"use client";

import type { ReactNode } from "react";
import { Check } from "lucide-react";

import { cn } from "@/lib/utils";

export type ChoiceCardOption<TValue extends string> = {
  value: TValue;
  label: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
  /** A short consequence line — what a student will actually experience. */
  effect?: ReactNode;
  disabled?: boolean;
};

/**
 * A radio group rendered as cards, for choices where the options need
 * explaining rather than merely naming.
 *
 * Delivery modes need this much room because each one describes a complete
 * student experience, not just a short enum label. Built on native radio inputs
 * so it is a real radio group to a screen reader and arrow keys work without
 * any roving-tabindex code of ours.
 *
 * Selection is marked by a check icon as well as the tint, per
 * `docs/design/design-system.md` — a colour-only selected state fails the same
 * test the correct-answer marker does.
 */
export default function ChoiceCards<TValue extends string>({
  name,
  value,
  onChange,
  options,
  columns = 1,
  disabled,
  ariaLabel,
  className,
}: {
  name: string;
  value: TValue;
  onChange: (value: TValue) => void;
  options: ChoiceCardOption<TValue>[];
  columns?: 1 | 2 | 3;
  disabled?: boolean;
  ariaLabel: string;
  className?: string;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className={cn(
        "grid gap-2",
        columns === 2 && "sm:grid-cols-2",
        columns === 3 && "sm:grid-cols-3",
        className,
      )}
    >
      {options.map((option) => {
        const selected = option.value === value;
        const isDisabled = disabled || option.disabled;

        return (
          <label
            key={option.value}
            className={cn(
              "interactive-flat relative flex cursor-pointer gap-3 rounded-xl border p-3 text-left outline-none",
              "focus-within:ring-2 focus-within:ring-ring/40",
              selected
                ? "border-primary/45 bg-accent"
                : "border-border bg-card hover:border-primary/25 hover:bg-muted",
              isDisabled && "pointer-events-none opacity-55",
            )}
          >
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={selected}
              disabled={isDisabled}
              onChange={() => onChange(option.value)}
              className="sr-only"
            />

            {option.icon ? (
              <span
                aria-hidden="true"
                className={cn(
                  "mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg [&_svg]:size-4",
                  selected ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground",
                )}
              >
                {option.icon}
              </span>
            ) : null}

            <span className="min-w-0 flex-1">
              <span
                className={cn(
                  "type-label block",
                  selected ? "text-accent-foreground" : "text-foreground",
                )}
              >
                {option.label}
              </span>
              {option.description ? (
                <span className="mt-0.5 block text-xs text-muted-foreground">
                  {option.description}
                </span>
              ) : null}
              {option.effect ? (
                <span className="mt-1.5 block text-2xs text-muted-foreground italic">
                  {option.effect}
                </span>
              ) : null}
            </span>

            <span
              aria-hidden="true"
              className={cn(
                "mt-0.5 grid size-4 shrink-0 place-items-center rounded-full border transition-colors duration-[var(--dur-1)]",
                selected
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border",
              )}
            >
              {selected ? <Check className="size-2.5" strokeWidth={3} /> : null}
            </span>
          </label>
        );
      })}
    </div>
  );
}
