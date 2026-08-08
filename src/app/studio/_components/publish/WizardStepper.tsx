"use client";

import { Check } from "lucide-react";

import { cn } from "@/lib/utils";

export type WizardStep<TId extends string> = {
  id: TId;
  label: string;
  /** Blocks forward movement past this step — only the readiness check does. */
  blocked?: boolean;
};

/**
 * The wizard's progress rail.
 *
 * Steps behind the current one are clickable, steps ahead are not. That is not
 * a gate for its own sake: each step writes into one shared draft, and letting
 * a teacher jump to "Confirm" from step one would show a summary of defaults
 * they have not seen and invite them to publish it. Going back is always fine,
 * because everything they entered is still there.
 */
export default function WizardStepper<TId extends string>({
  steps,
  current,
  onSelect,
  ariaLabel,
}: {
  steps: WizardStep<TId>[];
  current: TId;
  onSelect: (id: TId) => void;
  ariaLabel: string;
}) {
  const currentIndex = steps.findIndex((step) => step.id === current);

  return (
    <ol aria-label={ariaLabel} className="flex items-center gap-1">
      {steps.map((step, index) => {
        const isCurrent = step.id === current;
        const isDone = index < currentIndex;
        const reachable = index <= currentIndex;

        return (
          <li key={step.id} className="flex items-center gap-1">
            {index > 0 ? (
              <span
                aria-hidden="true"
                className={cn(
                  "h-px w-4 shrink-0",
                  isDone || isCurrent ? "bg-primary/40" : "bg-border",
                )}
              />
            ) : null}

            <button
              type="button"
              disabled={!reachable}
              aria-current={isCurrent ? "step" : undefined}
              onClick={() => onSelect(step.id)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-2xs font-medium outline-none",
                "focus-visible:ring-2 focus-visible:ring-ring/40",
                reachable ? "cursor-pointer" : "cursor-default",
                isCurrent
                  ? "bg-accent text-accent-foreground"
                  : isDone
                    ? "text-muted-foreground hover:bg-muted hover:text-foreground"
                    : "text-muted-foreground opacity-55",
              )}
            >
              <span
                aria-hidden="true"
                className={cn(
                  "grid size-4 shrink-0 place-items-center rounded-full text-3xs font-semibold tabular-nums",
                  isDone
                    ? "bg-primary text-primary-foreground"
                    : isCurrent
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground",
                )}
              >
                {isDone ? <Check className="size-2.5" strokeWidth={3} /> : index + 1}
              </span>
              <span className="hidden xl:inline">{step.label}</span>
            </button>
          </li>
        );
      })}
    </ol>
  );
}
