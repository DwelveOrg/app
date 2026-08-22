"use client";

import { ArrowLeft } from "lucide-react";
import { useTranslation } from "react-i18next";

import DwelveLogo from "@/components/Custom/DwelveLogo";

type OnboardingChromeProps = {
  /** Zero-based index of the step on screen. */
  current: number;
  total: number;
  onBack: () => void;
  busy: boolean;
};

/**
 * The whole of onboarding's navigation: where you are, and the way back.
 *
 * This replaced a 336px left rail that listed every step with its icon, label
 * and done state. The rail answered "how long is this?" but cost a third of the
 * screen to do it, competed with the step for attention, and turned a flow that
 * is meant to be one question at a time into a dashboard of pending work. A
 * counter and a hairline answer the same question in 64px.
 *
 * The left slot swaps rather than disabling: on the first step there is nothing
 * to go back to, so the brand occupies the space instead of a dead control.
 */
export default function OnboardingChrome({
  current,
  total,
  onBack,
  busy,
}: OnboardingChromeProps) {
  const { t } = useTranslation();
  const percent = Math.round(((current + 1) / total) * 100);

  return (
    <header className="sticky top-0 z-20 bg-background/80 backdrop-blur">
      <div className="mx-auto w-full max-w-3xl px-6">
        <div className="flex h-16 items-center justify-between gap-4">
          {current > 0 ? (
            <button
              type="button"
              onClick={onBack}
              disabled={busy}
              className="interactive -ml-1.5 inline-flex items-center gap-1.5 rounded-md px-1.5 py-1 text-sm text-muted-foreground outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/40 disabled:pointer-events-none disabled:opacity-50"
            >
              <ArrowLeft className="size-4" />
              {t("onboarding.actions.back")}
            </button>
          ) : (
            <DwelveLogo variant="form" />
          )}

          <span className="numeric shrink-0 type-caption text-muted-foreground">
            {t("onboarding.progress.counter", { current: current + 1, total })}
          </span>
        </div>

        {/*
          A hairline, not the 6px pill the rail carried. At this width a thick
          track reads as a loading bar — something the page is waiting on —
          rather than as a position marker. The fill is `foreground` for the
          same reason the primary button is ink: violet is identity here, not
          progress.
        */}
        <div
          className="h-px w-full bg-border"
          role="progressbar"
          aria-valuenow={current + 1}
          aria-valuemin={1}
          aria-valuemax={total}
          aria-label={t("onboarding.progress.eyebrow")}
        >
          <div
            className="h-px bg-foreground transition-[width] duration-[var(--dur-4)] ease-[var(--ease-out-expo)]"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>
    </header>
  );
}
