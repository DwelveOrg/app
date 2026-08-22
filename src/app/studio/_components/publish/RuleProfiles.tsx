"use client";

import { Eye, ListChecks, ShieldCheck } from "lucide-react";
import { useTranslation } from "react-i18next";

import type { TestDelivery } from "@/app/(root)/_lib/test-delivery";
import Segmented from "@/components/ui/Segmented";
import Surface from "@/components/ui/Surface";

type FlowProfile = "flexible" | "focused";
type SupervisionProfile = "open" | "monitored";
type ResultsProfile = "review" | "score" | "held";
type ProfileValue<T extends string> = T | "custom";

/**
 * Three intent-level rules replace the old matrix of individual switches.
 *
 * Each choice owns every field in its category. This prevents contradictory
 * combinations such as requiring fullscreen but doing nothing when it is
 * exited, or hiding a score while separately enabling the answer key. A
 * legacy/custom delivery remains untouched until the teacher chooses a clear
 * replacement for that category.
 */
export default function RuleProfiles({
  delivery,
  shuffleQuestions,
  onDeliveryChange,
  onShuffleQuestionsChange,
  settingsLocked = false,
}: {
  delivery: TestDelivery;
  shuffleQuestions: boolean;
  onDeliveryChange: (next: Partial<TestDelivery>) => void;
  onShuffleQuestionsChange: (value: boolean) => void;
  /** Published tests cannot change the Test-row question order setting. */
  settingsLocked?: boolean;
}) {
  const { t } = useTranslation();

  const flow = readFlowProfile(delivery, shuffleQuestions) ?? "custom";
  const supervision = readSupervisionProfile(delivery) ?? "custom";
  const results = readResultsProfile(delivery) ?? "custom";

  return (
    <Surface padding="none" elevation={0} className="divide-y divide-border">
      {settingsLocked ? null : (
        <ProfileRow
          icon={ListChecks}
          title={t("root.tests.publish.rules.flow.label")}
          description={t("root.tests.publish.rules.flow.hint")}
          custom={flow === "custom" ? t("root.tests.publish.rules.custom") : undefined}
        >
          <Segmented<ProfileValue<FlowProfile>>
            value={flow}
            ariaLabel={t("root.tests.publish.rules.flow.label")}
            layoutId="publish-flow-profile"
            onChange={(value) => {
              if (value === "custom") return;
              onDeliveryChange(FLOW_PROFILES[value]);
              onShuffleQuestionsChange(value === "focused");
            }}
            options={([
              { value: "flexible", label: t("root.tests.publish.rules.flow.flexible") },
              { value: "focused", label: t("root.tests.publish.rules.flow.focused") },
            ] satisfies { value: FlowProfile; label: string }[])}
          />
        </ProfileRow>
      )}

      <ProfileRow
        icon={ShieldCheck}
        title={t("root.tests.publish.rules.supervision.label")}
        description={t("root.tests.publish.rules.supervision.hint")}
        custom={
          supervision === "custom" ? t("root.tests.publish.rules.custom") : undefined
        }
      >
        <Segmented<ProfileValue<SupervisionProfile>>
          value={supervision}
          ariaLabel={t("root.tests.publish.rules.supervision.label")}
          layoutId="publish-supervision-profile"
          onChange={(value) => {
            if (value !== "custom") onDeliveryChange(SUPERVISION_PROFILES[value]);
          }}
          options={([
            { value: "open", label: t("root.tests.publish.rules.supervision.open") },
            {
              value: "monitored",
              label: t("root.tests.publish.rules.supervision.monitored"),
            },
          ] satisfies { value: SupervisionProfile; label: string }[])}
        />
      </ProfileRow>

      <ProfileRow
        icon={Eye}
        title={t("root.tests.publish.rules.results.label")}
        description={t("root.tests.publish.rules.results.hint")}
        custom={results === "custom" ? t("root.tests.publish.rules.custom") : undefined}
      >
        <Segmented<ProfileValue<ResultsProfile>>
          value={results}
          ariaLabel={t("root.tests.publish.rules.results.label")}
          layoutId="publish-results-profile"
          onChange={(value) => {
            if (value !== "custom") onDeliveryChange(RESULTS_PROFILES[value]);
          }}
          options={([
            { value: "review", label: t("root.tests.publish.rules.results.review") },
            { value: "score", label: t("root.tests.publish.rules.results.score") },
            { value: "held", label: t("root.tests.publish.rules.results.held") },
          ] satisfies { value: ResultsProfile; label: string }[])}
        />
      </ProfileRow>
    </Surface>
  );
}

function ProfileRow({
  icon: Icon,
  title,
  description,
  custom,
  children,
}: {
  icon: typeof Eye;
  title: string;
  description: string;
  custom?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-3 px-4 py-3.5 sm:px-5 md:grid-cols-[minmax(0,1fr)_minmax(18rem,0.9fr)] md:items-center">
      <div className="flex min-w-0 items-start gap-3">
        <span
          aria-hidden="true"
          className="grid size-8 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground [&_svg]:size-4"
        >
          <Icon />
        </span>
        <div className="min-w-0">
          <p className="type-label text-foreground">{title}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
      <div className="min-w-0">
        {custom ? (
          <p className="mb-1.5 text-2xs text-muted-foreground">{custom}</p>
        ) : null}
        {children}
      </div>
    </div>
  );
}

const FLOW_PROFILES: Record<FlowProfile, Partial<TestDelivery>> = {
  flexible: {
    navigationMode: "ALL_AT_ONCE",
    allowBackNavigation: true,
    shuffleOptions: false,
  },
  focused: {
    navigationMode: "ONE_AT_A_TIME",
    allowBackNavigation: false,
    shuffleOptions: true,
  },
};

const SUPERVISION_PROFILES: Record<SupervisionProfile, Partial<TestDelivery>> = {
  open: {
    requireFullscreen: false,
    fullscreenExitAction: "WARN",
    detectLeaveScreen: false,
    leaveScreenAction: "WARN",
    violationLimit: 3,
    blockCopyPaste: false,
    blockContextMenu: false,
    requireHonorCode: false,
  },
  monitored: {
    requireFullscreen: true,
    fullscreenExitAction: "COUNT",
    detectLeaveScreen: true,
    leaveScreenAction: "COUNT",
    violationLimit: 3,
    blockCopyPaste: true,
    blockContextMenu: true,
    requireHonorCode: true,
  },
};

const RESULTS_PROFILES: Record<ResultsProfile, Partial<TestDelivery>> = {
  review: {
    resultsRelease: "IMMEDIATELY",
    showScore: true,
    showCorrectAnswers: true,
    showFeedback: true,
  },
  score: {
    resultsRelease: "IMMEDIATELY",
    showScore: true,
    showCorrectAnswers: false,
    showFeedback: true,
  },
  held: {
    resultsRelease: "MANUAL",
    showScore: true,
    showCorrectAnswers: false,
    showFeedback: true,
  },
};

function readFlowProfile(
  delivery: TestDelivery,
  shuffleQuestions: boolean,
): FlowProfile | null {
  if (
    delivery.navigationMode === "ALL_AT_ONCE" &&
    delivery.allowBackNavigation &&
    !delivery.shuffleOptions &&
    !shuffleQuestions
  ) {
    return "flexible";
  }

  if (
    delivery.navigationMode === "ONE_AT_A_TIME" &&
    !delivery.allowBackNavigation &&
    delivery.shuffleOptions &&
    shuffleQuestions
  ) {
    return "focused";
  }

  return null;
}

function readSupervisionProfile(delivery: TestDelivery): SupervisionProfile | null {
  if (
    !delivery.requireFullscreen &&
    !delivery.detectLeaveScreen &&
    !delivery.blockCopyPaste &&
    !delivery.blockContextMenu &&
    !delivery.requireHonorCode
  ) {
    return "open";
  }

  if (
    delivery.requireFullscreen &&
    delivery.fullscreenExitAction === "COUNT" &&
    delivery.detectLeaveScreen &&
    delivery.leaveScreenAction === "COUNT" &&
    delivery.violationLimit === 3 &&
    delivery.blockCopyPaste &&
    delivery.blockContextMenu &&
    delivery.requireHonorCode
  ) {
    return "monitored";
  }

  return null;
}

function readResultsProfile(delivery: TestDelivery): ResultsProfile | null {
  if (
    delivery.resultsRelease === "IMMEDIATELY" &&
    delivery.showScore &&
    delivery.showCorrectAnswers &&
    delivery.showFeedback
  ) {
    return "review";
  }

  if (
    delivery.resultsRelease === "IMMEDIATELY" &&
    delivery.showScore &&
    !delivery.showCorrectAnswers &&
    delivery.showFeedback
  ) {
    return "score";
  }

  if (
    delivery.resultsRelease === "MANUAL" &&
    delivery.showScore &&
    !delivery.showCorrectAnswers &&
    delivery.showFeedback
  ) {
    return "held";
  }

  return null;
}
