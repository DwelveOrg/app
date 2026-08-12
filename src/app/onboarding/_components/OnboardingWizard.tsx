"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, SkipForward } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";

import type { SchoolRole } from "@/app/(authentication)/_types/auth";
import { updateOnboardingAction } from "@/app/(root)/_lib/onboarding-actions";
import { readSafeActionData } from "@/lib/actions/read-safe-action-result";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { clampStep, resolveSteps, type OnboardingFlow } from "../_lib/steps";
import StepRail from "./StepRail";
import RoleStep from "./RoleStep";
import { ConnectStep, PathStep, WelcomeStep, type AccessPath } from "./AccessStep";

type WizardUser = {
  id: string;
  fullName: string | null;
  schoolId: string | null;
  memberId: string | null;
  role: SchoolRole | null;
};

export type WizardProps = {
  /** Server-persisted resume point; already accounts for replay. */
  initialStep: number;
  user: WizardUser;
  schoolName: string | null;
  studentJoinCode: string | null;
  classes: Array<{ id: string; name: string }>;
  availableClasses: number;
};

export default function OnboardingWizard(props: WizardProps) {
  const { user, initialStep, classes, schoolName, studentJoinCode, availableClasses } =
    props;
  const { t } = useTranslation();
  const router = useRouter();

  // An account already inside a school takes the role tour; one without a
  // membership is still choosing how to get in.
  const flow: OnboardingFlow = user.role && user.memberId ? "role" : "access";
  const steps = resolveSteps(flow, user.role, {
    classCount: classes.length,
    hasJoinCode: Boolean(studentJoinCode),
    availableClasses,
  });

  const [step, setStep] = useState(() => clampStep(initialStep, steps.length));
  const [path, setPath] = useState<AccessPath | null>(null);
  const [leaving, startLeaving] = useTransition();

  const safeStep = clampStep(step, steps.length);
  const current = steps[safeStep];
  const isLast = safeStep === steps.length - 1;
  const labelBase =
    flow === "access" ? "onboarding.access.steps" : `onboarding.roles.${user.role?.toLowerCase()}`;

  /** Fire-and-forget: a lost step write costs only a resume position. */
  const saveStep = (value: number) => {
    void updateOnboardingAction({ status: "in_progress", step: value });
  };

  const goTo = (value: number) => {
    const next = clampStep(value, steps.length);
    setStep(next);
    saveStep(next);
  };

  const finish = (status: "completed" | "skipped") => {
    startLeaving(async () => {
      try {
        // Must land before leaving: the dashboard sends unfinished users
        // straight back here, so a failed write would bounce them in a loop.
        const result = await updateOnboardingAction({ status, step: safeStep });
        readSafeActionData(result, t("onboarding.actions.saveError"));
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : t("onboarding.actions.saveError"),
        );
        return;
      }
      router.replace("/dashboard");
      router.refresh();
    });
  };

  const next = () => {
    if (isLast) {
      finish("completed");
      return;
    }
    goTo(safeStep + 1);
  };

  // The access flow cannot advance past the chooser without a choice, and the
  // connect step is what actually creates the membership — so "next" is not an
  // escape from it. Skipping the step is, and that is a separate control.
  const canAdvance = !(flow === "access" && current.key === "path" && !path);
  const nextDisabled = leaving || !canAdvance || (flow === "access" && current.key === "connect");

  const heading =
    flow === "access"
      ? t(`onboarding.access.steps.${current.key}.title`, {
          name: user.fullName?.trim().split(/\s+/)[0] ?? "",
        })
      : t(`${labelBase}.${current.key}.title`);

  const description =
    flow === "access"
      ? t(`onboarding.access.steps.${current.key}.description`)
      : t(`${labelBase}.${current.key}.description`, {
          school: schoolName ?? t("onboarding.yourSchool"),
        });

  return (
    <div className="flex min-h-dvh flex-col lg:flex-row">
      <StepRail
        steps={steps}
        current={safeStep}
        labelBase={labelBase}
        title={
          flow === "access"
            ? t("onboarding.access.railTitle")
            : t(`onboarding.roles.${user.role?.toLowerCase()}.title`)
        }
        eyebrow={t("onboarding.progress.eyebrow")}
        onSelect={goTo}
        onSkipAll={() => finish("skipped")}
        busy={leaving}
      />

      <main className="flex min-w-0 flex-1 flex-col">
        {/* Centred vertically: a step with three cards on it would otherwise sit
            at the top of a tall viewport with the lower half empty. Tall steps
            simply fill the space and the page scrolls as normal. */}
        <div className="flex flex-1 flex-col justify-center px-6 py-8 sm:px-10 sm:py-12 xl:px-16">
          <div className="mx-auto w-full max-w-6xl">
            <p className="type-micro text-primary">
              {t("onboarding.progress.label", {
                current: safeStep + 1,
                total: steps.length,
              })}
            </p>
            <h2 className="mt-3 type-title text-foreground">{heading}</h2>
            <p className="mt-3 max-w-[68ch] text-base leading-7 text-muted-foreground">
              {description}
            </p>

            <div className="mt-10">
              {flow === "access" ? (
                current.key === "welcome" ? (
                  <WelcomeStep firstName={user.fullName?.trim().split(/\s+/)[0] ?? ""} />
                ) : current.key === "path" ? (
                  <PathStep value={path} onChange={setPath} />
                ) : path ? (
                  <ConnectStep
                    path={path}
                    disabled={leaving}
                    onBack={() => goTo(safeStep - 1)}
                    onConnected={() => saveStep(0)}
                  />
                ) : (
                  <PathStep value={path} onChange={setPath} />
                )
              ) : (
                <RoleStep
                  stepKey={current.key}
                  role={user.role as SchoolRole}
                  schoolId={user.schoolId}
                  schoolName={schoolName}
                  studentJoinCode={studentJoinCode}
                  classes={classes}
                  availableClasses={availableClasses}
                />
              )}
            </div>
          </div>
        </div>

        {/* Sticky footer so the controls stay reachable on a long step. */}
        <div className="sticky bottom-0 border-t border-border bg-card/95 px-6 py-4 backdrop-blur sm:px-10 xl:px-16">
          <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => goTo(safeStep - 1)}
              disabled={safeStep === 0 || leaving}
            >
              <ArrowLeft className="size-4" />
              {t("onboarding.actions.back")}
            </Button>

            <div className="ml-auto flex flex-wrap items-center gap-2">
              {/* Skip one step. Distinct from the skip-everything beside it. */}
              {!isLast ? (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => goTo(safeStep + 1)}
                  disabled={leaving}
                >
                  <SkipForward className="size-4" />
                  {t("onboarding.actions.skipStep")}
                </Button>
              ) : null}

              {/*
                Skip everything. On earlier steps the desktop rail already carries
                this, so the footer copy is only for small screens where the rail
                hides it. The last step shows it at every width: "Skip this step"
                is gone by then, and the rail's control sits at the bottom of a
                scrollable column — so a user who has decided they are done would
                otherwise face a footer offering only "Open dashboard", which
                completes the flow rather than leaving it.
              */}
              <Button
                type="button"
                variant="ghost"
                onClick={() => finish("skipped")}
                disabled={leaving}
                className={cn("text-muted-foreground", !isLast && "lg:hidden")}
              >
                {t("onboarding.actions.skipAll")}
              </Button>

              <Button type="button" onClick={next} disabled={nextDisabled}>
                {isLast ? t("onboarding.actions.finish") : t("onboarding.actions.next")}
                <ArrowRight className="size-4" />
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
