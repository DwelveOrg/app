"use client";

import {
  Ban,
  ClipboardX,
  Clock3,
  Eye,
  EyeOff,
  Maximize,
  MonitorOff,
  Repeat,
  ScrollText,
  ShieldCheck,
  Shuffle,
  type LucideIcon,
} from "lucide-react";
import { useTranslation } from "react-i18next";

import type { TestDelivery } from "@/app/(root)/_lib/test-delivery";
import Surface from "@/components/ui/Surface";
import { cn } from "@/lib/utils";

/**
 * What the student will actually experience, restated from the current draft.
 *
 * This panel is the reason publishing is a route and not a dialog. Even three
 * rule profiles resolve to several concrete behaviours, and the teacher needs
 * to verify their combined effect before notifying a class.
 *
 * So every choice is mirrored here in the second person, live, in the order the
 * student meets it. It is deliberately prose-shaped rather than a settings
 * echo — "You have 60 minutes" reads as a consequence, "durationMinutes: 60"
 * does not.
 */
export default function StudentPreview({
  delivery,
  durationMinutes,
  attemptWindow,
}: {
  delivery: TestDelivery;
  durationMinutes: number | null;
  attemptWindow: { from: string | null; until: string | null };
}) {
  const { t } = useTranslation();

  const lines = buildLines(delivery, durationMinutes, t);

  return (
    <Surface padding="md" className="space-y-3">
      <div className="flex items-center gap-2">
        <ShieldCheck className="size-4 shrink-0 text-primary" aria-hidden="true" />
        <p className="type-label text-foreground">
          {t("root.tests.publish.preview.title")}
        </p>
      </div>

      <p className="text-2xs text-muted-foreground">
        {t("root.tests.publish.preview.subtitle")}
      </p>

      {attemptWindow.from || attemptWindow.until ? (
        <p className="rounded-lg bg-muted px-2.5 py-2 text-2xs text-foreground">
          {attemptWindow.from && attemptWindow.until
            ? t("root.tests.publish.preview.window", {
                from: attemptWindow.from,
                until: attemptWindow.until,
              })
            : attemptWindow.from
              ? t("root.tests.publish.preview.opensAt", { from: attemptWindow.from })
              : t("root.tests.publish.preview.closesAt", { until: attemptWindow.until })}
        </p>
      ) : null}

      <ul className="space-y-2">
        {lines.map((line) => (
          <li key={line.key} className="flex items-start gap-2">
            <line.icon
              aria-hidden="true"
              className={cn(
                "mt-px size-3.5 shrink-0",
                line.tone === "strict" ? "text-warning" : "text-muted-foreground",
              )}
            />
            <span
              className={cn(
                "text-2xs leading-relaxed",
                line.tone === "strict" ? "text-foreground" : "text-muted-foreground",
              )}
            >
              {line.text}
            </span>
          </li>
        ))}
      </ul>
    </Surface>
  );
}

type PreviewLine = {
  key: string;
  icon: LucideIcon;
  text: string;
  tone: "normal" | "strict";
};

function buildLines(
  delivery: TestDelivery,
  durationMinutes: number | null,
  t: (key: string, options?: Record<string, unknown>) => string,
): PreviewLine[] {
  const lines: PreviewLine[] = [];

  /* --- Before the first question ---------------------------------------- */

  if (delivery.requireHonorCode) {
    lines.push({
      key: "honorCode",
      icon: ShieldCheck,
      text: t("root.tests.publish.preview.honorCode"),
      tone: "strict",
    });
  }

  if (delivery.requireFullscreen) {
    lines.push({
      key: "fullscreen",
      icon: Maximize,
      text: t("root.tests.publish.preview.fullscreen"),
      tone: "strict",
    });
  }

  /* --- Timing ------------------------------------------------------------ */

  lines.push({
    key: "duration",
    icon: Clock3,
    text: durationMinutes
      ? delivery.showTimer
        ? t("root.tests.publish.preview.timedVisible", { count: durationMinutes })
        : t("root.tests.publish.preview.timedHidden", { count: durationMinutes })
      : t("root.tests.publish.preview.untimed"),
    tone: "normal",
  });

  if (durationMinutes && delivery.autoSubmitOnExpiry) {
    lines.push({
      key: "autoSubmit",
      icon: Clock3,
      text: t("root.tests.publish.preview.autoSubmit"),
      tone: "strict",
    });
  }

  /* --- Moving through the paper ------------------------------------------ */

  lines.push({
    key: "navigation",
    icon: ScrollText,
    text:
      delivery.navigationMode === "ONE_AT_A_TIME"
        ? delivery.allowBackNavigation
          ? t("root.tests.publish.preview.oneAtATime")
          : t("root.tests.publish.preview.oneAtATimeNoBack")
        : t("root.tests.publish.preview.allAtOnce"),
    tone: delivery.navigationMode === "ONE_AT_A_TIME" ? "strict" : "normal",
  });

  if (delivery.shuffleOptions) {
    lines.push({
      key: "shuffleOptions",
      icon: Shuffle,
      text: t("root.tests.publish.preview.shuffleOptions"),
      tone: "normal",
    });
  }

  /* --- Rules that can end the attempt ------------------------------------ */

  if (delivery.detectLeaveScreen) {
    lines.push({
      key: "leaveScreen",
      icon: MonitorOff,
      text: t(`root.tests.publish.preview.leaveScreen.${delivery.leaveScreenAction}`, {
        count: delivery.violationLimit ?? 0,
      }),
      tone: "strict",
    });
  }

  if (delivery.requireFullscreen) {
    lines.push({
      key: "fullscreenExit",
      icon: Maximize,
      text: t(
        `root.tests.publish.preview.fullscreenExit.${delivery.fullscreenExitAction}`,
        { count: delivery.violationLimit ?? 0 },
      ),
      tone: "strict",
    });
  }

  if (delivery.blockCopyPaste) {
    lines.push({
      key: "copyPaste",
      icon: ClipboardX,
      text: t("root.tests.publish.preview.blockCopyPaste"),
      tone: "strict",
    });
  }

  if (delivery.blockContextMenu) {
    lines.push({
      key: "contextMenu",
      icon: Ban,
      text: t("root.tests.publish.preview.blockContextMenu"),
      tone: "strict",
    });
  }

  /* --- Attempts and results ---------------------------------------------- */

  lines.push({
    key: "attempts",
    icon: Repeat,
    text:
      delivery.attemptsAllowed === 1
        ? t("root.tests.publish.preview.singleAttempt")
        : t("root.tests.publish.preview.multipleAttempts", {
            count: delivery.attemptsAllowed,
          }),
    tone: delivery.attemptsAllowed === 1 ? "strict" : "normal",
  });

  lines.push({
    key: "results",
    icon: delivery.showScore ? Eye : EyeOff,
    text: !delivery.showScore
      ? t("root.tests.publish.preview.noScore")
      : t(`root.tests.publish.preview.results.${delivery.resultsRelease}`),
    tone: "normal",
  });

  if (delivery.showScore && delivery.showCorrectAnswers) {
    lines.push({
      key: "answers",
      icon: Eye,
      text: t("root.tests.publish.preview.showAnswers"),
      tone: "normal",
    });
  }

  return lines;
}
