"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";

import { optionLabel } from "@/app/(root)/_lib/test-form";
import type { PaperOption } from "@/lib/tests/paper.schemas";
import { cn } from "@/lib/utils";

export default function CrossOutRail({
  questionId,
  options,
  crossed,
  onToggle,
  className,
}: {
  questionId: string;
  options: PaperOption[];
  crossed: Set<string> | undefined;
  onToggle: (questionId: string, optionId: string) => void;
  className?: string;
}) {
  const { t } = useTranslation();
  const [enabled, setEnabled] = useState(false);

  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      <button
        type="button"
        aria-pressed={enabled}
        onClick={() => setEnabled((current) => !current)}
        title={t("exam.sat.crossOutHint")}
        className={cn(
          "interactive-flat cursor-pointer rounded-md border px-2 py-1 text-2xs font-bold tracking-wider outline-none",
          "focus-visible:ring-2 focus-visible:ring-ring/50",
          enabled
            ? "border-primary bg-accent text-accent-foreground"
            : "border-border text-muted-foreground hover:text-foreground",
        )}
      >
        <span className="line-through">ABC</span>
        <span className="sr-only">{t("exam.sat.crossOut")}</span>
      </button>

      {enabled ? (
        <div className="flex items-center gap-1">
          {options.map((option, position) => {
            const label = option.label || optionLabel(position);
            const struck = crossed?.has(option.id) ?? false;

            return (
              <button
                key={option.id}
                type="button"
                aria-pressed={struck}
                aria-label={t(struck ? "exam.sat.undoCrossOut" : "exam.sat.crossOutOption", {
                  label,
                })}
                onClick={() => onToggle(questionId, option.id)}
                className={cn(
                  "interactive-flat grid size-6 cursor-pointer place-items-center rounded-full border text-2xs font-semibold outline-none",
                  "focus-visible:ring-2 focus-visible:ring-ring/50",
                  struck
                    ? "border-muted-foreground/50 text-muted-foreground line-through"
                    : "border-border text-foreground hover:border-primary/50",
                )}
              >
                {label}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
