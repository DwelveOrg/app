"use client";

import { Check } from "lucide-react";
import { useTranslation } from "react-i18next";

import DwelveLogo from "@/components/Custom/DwelveLogo";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import type { StepDef } from "../_lib/steps";

type StepRailProps = {
  steps: StepDef[];
  current: number;
  /** Translation prefix for step labels, e.g. `onboarding.roles.admin`. */
  labelBase: string;
  title: string;
  eyebrow: string;
  onSelect: (index: number) => void;
  onSkipAll: () => void;
  busy: boolean;
};

/**
 * The persistent left rail: brand, journey, progress, and the escape hatch.
 *
 * Keeping the step list visible is the point — the previous single-card design
 * gave no sense of how long the flow was, so "skip" was the only way to find
 * out. Steps already behind the user stay clickable; steps ahead do not,
 * because reaching them may depend on work the current step performs.
 */
export default function StepRail({
  steps,
  current,
  labelBase,
  title,
  eyebrow,
  onSelect,
  onSkipAll,
  busy,
}: StepRailProps) {
  const { t } = useTranslation();
  const completed = steps.filter((step, index) => step.done || index < current).length;
  const percent = Math.round((completed / steps.length) * 100);

  return (
    // `overflow-y-auto` so a long step list or a wrapped hint cannot be clipped
    // by the bottom of a short viewport.
    <aside className="flex flex-col gap-8 border-b border-border bg-sidebar px-6 py-7 lg:sticky lg:top-0 lg:h-dvh lg:w-[336px] lg:shrink-0 lg:justify-between lg:overflow-y-auto lg:border-b-0 lg:border-r lg:px-8 lg:py-9">
      <div className="min-w-0">
        <DwelveLogo variant="form" />

        <p className="mt-8 type-micro text-primary">{eyebrow}</p>
        <h1 className="mt-2 type-heading text-foreground">{title}</h1>

        <div className="mt-5 flex items-center gap-3">
          <div
            className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted"
            role="progressbar"
            aria-valuenow={completed}
            aria-valuemin={0}
            aria-valuemax={steps.length}
            aria-label={eyebrow}
          >
            <div
              className="h-full rounded-full bg-primary transition-[width] duration-500 ease-out"
              style={{ width: `${percent}%` }}
            />
          </div>
          <span className="shrink-0 type-caption font-medium tabular-nums text-muted-foreground">
            {completed}/{steps.length}
          </span>
        </div>

        {/* Horizontal on small screens so the rail costs one band, not a column. */}
        <ol className="mt-7 flex gap-2 overflow-x-auto pb-1 lg:mt-8 lg:flex-col lg:gap-1.5 lg:overflow-visible lg:pb-0">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const active = index === current;
            const passed = step.done || index < current;
            const reachable = passed || index < current;

            return (
              <li key={step.key} className="min-w-0 shrink-0 lg:shrink">
                <button
                  type="button"
                  onClick={() => reachable && onSelect(index)}
                  disabled={!reachable || busy}
                  aria-current={active ? "step" : undefined}
                  className={cn(
                    "group flex w-full items-center gap-3 rounded-xl px-2.5 py-2.5 text-left transition-colors",
                    active && "bg-card shadow-elev-1",
                    !active && reachable && "hover:bg-card/60",
                    !reachable && "cursor-default",
                  )}
                >
                  <span
                    className={cn(
                      "inline-flex size-9 shrink-0 items-center justify-center rounded-lg border transition-colors",
                      passed && !active && "border-success/40 bg-success/10 text-success",
                      active && "border-primary bg-primary text-primary-foreground",
                      !passed && !active && "border-border bg-card text-muted-foreground",
                    )}
                  >
                    {passed && !active ? (
                      <Check className="size-4" />
                    ) : (
                      <Icon className="size-4" />
                    )}
                  </span>
                  <span className="hidden min-w-0 flex-1 lg:block">
                    <span
                      className={cn(
                        "block truncate text-sm font-semibold",
                        active ? "text-foreground" : "text-muted-foreground",
                      )}
                    >
                      {t(`${labelBase}.${step.key}.nav`)}
                    </span>
                    {passed && !active ? (
                      <span className="block truncate type-caption text-success">
                        {t("onboarding.progress.done")}
                      </span>
                    ) : null}
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      </div>

      {/* The all-at-once escape. Deliberately quiet and separated from the
          per-step skip in the footer, so the two are not mistaken for each other. */}
      <div className="hidden lg:block">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onSkipAll}
          disabled={busy}
          className="w-full justify-start text-muted-foreground"
        >
          {t("onboarding.actions.skipAll")}
        </Button>
        <p className="mt-1.5 px-3 type-caption text-muted-foreground">
          {t("onboarding.actions.skipAllHint")}
        </p>
      </div>
    </aside>
  );
}
