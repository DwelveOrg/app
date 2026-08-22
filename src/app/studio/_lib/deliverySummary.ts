import type { TFunction } from "i18next";

import type { TestDelivery } from "@/app/(root)/_lib/test-delivery";
import { activeIntegrityRules } from "@/app/(root)/_lib/test-delivery";

/**
 * One line per collapsed settings group, reading back what is currently set.
 *
 * A disclosure whose header says only "Exam integrity" hides *state*, not just
 * detail: a teacher who opened the Proctored mode and then scrolled past three
 * closed groups has no way to tell that fullscreen is now required. These lines
 * are what make collapsing the groups honest — the settings are out of the way,
 * their effect is not.
 */

const SEPARATOR = " · ";

export function duringSummary(
  delivery: TestDelivery,
  durationMinutes: number | null,
  t: TFunction,
): string {
  const parts: string[] = [];

  parts.push(
    durationMinutes == null
      ? t("root.tests.publish.summaryLine.untimed")
      : delivery.showTimer
        ? t("root.tests.publish.summaryLine.countdownOn")
        : t("root.tests.publish.summaryLine.countdownOff"),
  );

  parts.push(
    delivery.navigationMode === "ONE_AT_A_TIME"
      ? t("root.tests.publish.summaryLine.oneAtATime")
      : t("root.tests.publish.summaryLine.allAtOnce"),
  );

  if (delivery.shuffleOptions) {
    parts.push(t("root.tests.publish.summaryLine.shuffled"));
  }

  return parts.join(SEPARATOR);
}

export function integritySummary(delivery: TestDelivery, t: TFunction): string {
  const count = activeIntegrityRules(delivery).filter(
    // Navigation is reported by the group above; counting it here would make
    // "one question at a time" read as a lockdown the teacher did not set.
    (rule) => rule.key !== "oneAtATime" && rule.key !== "noBackNavigation" && rule.key !== "shuffleOptions",
  ).length;

  return count === 0
    ? t("root.tests.publish.summaryLine.noRules")
    : t("root.tests.publish.summaryLine.rules", { count });
}

export function resultsSummary(delivery: TestDelivery, t: TFunction): string {
  const parts = [
    t(`root.tests.publish.summaryLine.release.${delivery.resultsRelease}`),
    delivery.showScore
      ? t("root.tests.publish.summaryLine.scoreShown")
      : t("root.tests.publish.summaryLine.scoreHidden"),
  ];

  if (delivery.showScore && delivery.showCorrectAnswers) {
    parts.push(t("root.tests.publish.summaryLine.answersShown"));
  }

  return parts.join(SEPARATOR);
}
