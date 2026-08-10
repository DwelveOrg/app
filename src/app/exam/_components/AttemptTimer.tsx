"use client";

import { Clock3 } from "lucide-react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";
import { formatRemaining } from "../_hooks/useAttemptClock";

/**
 * The countdown.
 *
 * Three deliberate choices, all of them about not making an anxious person more
 * anxious while also not letting them run out of time by surprise:
 *
 * - **`tabular-nums`.** Proportional digits make the whole clock jitter once a
 *   second, which draws the eye back to it constantly.
 * - **The warning state is a colour *and* a word**, never a colour alone — the
 *   product rule, and here it also means the state survives being glanced at
 *   peripherally by someone concentrating on a passage.
 * - **No pulsing.** A clock that animates in the last five minutes is a clock
 *   that makes the last five minutes worse. The change of tone is enough, and
 *   it is the one state change that has to read instantly.
 *
 * Rendered only when `delivery.showTimer`; a hidden timer is a real choice a
 * teacher makes for exactly this reason.
 */
export default function AttemptTimer({
  remaining,
  warning,
}: {
  remaining: number | null;
  warning: boolean;
}) {
  const { t } = useTranslation();

  if (remaining === null) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
        <Clock3 className="size-3.5" aria-hidden="true" />
        {t("exam.runtime.untimed")}
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-13 font-semibold tabular-nums transition-colors duration-[var(--dur-2)]",
        warning
          ? "bg-[color-mix(in_srgb,var(--warning)_16%,transparent)] text-warning"
          : "bg-muted text-foreground",
      )}
      /*
       * Polite, not assertive: the clock updates every second, and an assertive
       * live region would have a screen reader announce the time continuously
       * over the question the student is trying to read. The warning threshold
       * is announced once, by the text beside it changing.
       */
      role="timer"
      aria-live="off"
    >
      <Clock3 className="size-3.5" aria-hidden="true" />
      <span className="sr-only">{t("exam.runtime.timeLeft")}</span>
      {formatRemaining(remaining)}
      {warning ? (
        <span className="text-2xs font-medium">{t("exam.runtime.hurry")}</span>
      ) : null}
    </span>
  );
}
