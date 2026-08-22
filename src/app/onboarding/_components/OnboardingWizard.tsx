"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";

import type { SchoolRole } from "@/app/(authentication)/_types/auth";
import { logout } from "@/app/(authentication)/_lib/actions";
import { updateOnboardingAction } from "@/app/(root)/_lib/onboarding-actions";
import { readSafeActionData } from "@/lib/actions/read-safe-action-result";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { clampStep, resolveSteps, type OnboardingFlow } from "../_lib/steps";
import OnboardingChrome from "./OnboardingChrome";
import RoleStep from "./RoleStep";
import {
  DoneStep,
  HeroAction,
  HeroStep,
  StepActions,
  StepEscapes,
  StepHeader,
} from "./StepShell";
import {
  ConnectStep,
  NoPathStep,
  PathStep,
  WelcomeStep,
  type AccessPath,
} from "./AccessStep";

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

/** Typing in a field must not paginate the wizard out from under the cursor. */
function isTypingTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  return ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName);
}

/**
 * Onboarding, as a sequence of single screens.
 *
 * The shape is deliberate and matches the flow it was modelled on: an opening
 * screen that asks nothing, the working steps, and a closing screen that hands
 * the account to the dashboard. Position is carried by a counter and a hairline
 * at the top rather than by a rail listing every step — see OnboardingChrome.
 */
export default function OnboardingWizard(props: WizardProps) {
  const { user, initialStep, classes, schoolName, studentJoinCode, availableClasses } =
    props;
  const { t } = useTranslation();
  const router = useRouter();
  const reduced = useReducedMotion();

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
  const firstName = user.fullName?.trim().split(/\s+/)[0] ?? "";
  const labelBase =
    flow === "access"
      ? "onboarding.access.steps"
      : `onboarding.roles.${user.role?.toLowerCase()}`;

  const total = steps.length;

  const goTo = useCallback(
    (value: number) => {
      const next = clampStep(value, total);
      setStep(next);
      // Fire-and-forget: a lost step write costs only a resume position.
      void updateOnboardingAction({ status: "in_progress", step: next });
    },
    [total],
  );

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

  // The access flow cannot advance past the chooser without a choice, and the
  // connect step is what actually creates the membership — so "next" is not an
  // escape from it. Skipping the step is, and that is a separate control.
  const isConnect = flow === "access" && current.key === "connect";
  /*
    Choosing a path is not optional, so it does not get a "Skip this step".
    That control was the only way to reach `connect` with no path — the state
    that used to render the chooser twice — and it never made sense on its own
    terms either: skipping the question that decides the next screen leaves the
    next screen with nothing to ask.
  */
  const isPathChoice = flow === "access" && current.key === "path";
  const isDone = current.key === "done";
  const isHero = safeStep === 0;
  const canAdvance =
    !(flow === "access" && current.key === "path" && !path) && !isConnect;

  const next = useCallback(() => {
    if (isLast) return;
    goTo(safeStep + 1);
  }, [goTo, isLast, safeStep]);

  /*
    Arrow keys move the flow, as the opening screen advertises. Guarded three
    ways: not while a field has focus, not with a modifier held (⌘→ is "end of
    line" and browser history), and not past a step whose own work gates it.
  */
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || leaving) return;
      if (event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return;
      if (isTypingTarget(event.target)) return;

      if (event.key === "ArrowRight" && canAdvance && !isLast) {
        event.preventDefault();
        goTo(safeStep + 1);
      } else if (event.key === "ArrowLeft" && safeStep > 0) {
        event.preventDefault();
        goTo(safeStep - 1);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [canAdvance, goTo, isLast, leaving, safeStep]);

  const school = schoolName ?? t("onboarding.yourSchool");

  const heading = isDone
    ? t("onboarding.done.title")
    : flow === "access"
      ? t(`onboarding.access.steps.${current.key}.title`, { name: firstName })
      : t(`${labelBase}.${current.key}.title`);

  const description = isDone
    ? t("onboarding.done.description", { school })
    : flow === "access"
      ? t(`onboarding.access.steps.${current.key}.description`)
      : t(`${labelBase}.${current.key}.description`, { school });

  /*
    The step's content, without its frame.

    The `connect` step never falls back to `PathStep`. It used to, whenever the
    chooser had been skipped, and the result was two consecutive screens holding
    the identical three cards under different headings — the flow looked stuck.
    `NoPathStep` says what is missing and sends the user back to the step that
    answers it, so no two screens in this flow show the same thing.
  */
  const body =
    flow === "access" ? (
      current.key === "welcome" ? (
        <WelcomeStep />
      ) : current.key === "path" ? (
        <PathStep value={path} onChange={setPath} />
      ) : path ? (
        <ConnectStep
          path={path}
          disabled={leaving}
          onChangePath={() => goTo(safeStep - 1)}
          onConnected={() => goTo(0)}
        />
      ) : (
        <NoPathStep onBack={() => goTo(safeStep - 1)} />
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
    );

  /*
    Steps cross-fade with a slight shrink and lift rather than sliding. A slide
    implies a filmstrip you can scrub; this flow is a sequence of separate
    questions, and settling into place reads as "here is the next one" instead
    of "you have moved right". Reduced motion keeps the fade and drops the rest.

    There is deliberately **no `filter: blur()`** here. It used to blur 6px in
    and out, which is the one property in that set the compositor cannot take:
    `filter` is animated by writing an inline style every frame, and a blur
    forces the browser to re-rasterise the whole step — every card, every glyph
    — on each of those frames. This is the largest subtree on the screen, and on
    the school hardware this product targets that is a real per-frame cost for
    an effect nobody can name afterwards. `opacity` and `transform` say the same
    thing and never leave the compositor.
  */
  const motionProps = reduced
    ? {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
        transition: { duration: 0.15 },
      }
    : {
        initial: { opacity: 0, scale: 0.985, y: 8 },
        animate: { opacity: 1, scale: 1, y: 0 },
        exit: { opacity: 0, scale: 0.99, y: -6 },
        transition: { duration: 0.26, ease: [0.16, 1, 0.3, 1] as const },
      };

  return (
    <div className="flex min-h-dvh flex-col">
      <OnboardingChrome
        current={safeStep}
        total={total}
        onBack={() => goTo(safeStep - 1)}
        busy={leaving}
      />

      <main className="flex flex-1 flex-col justify-center px-6 py-12 sm:py-16">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={current.key}
            {...motionProps}
            /* The book-ends sit on a narrow measure; working steps need the
               room for their forms and card grids. */
            className={cn(
              "mx-auto w-full",
              isHero || isDone ? "max-w-3xl" : "max-w-5xl",
            )}
          >
            {isHero ? (
              <HeroStep
                title={heading}
                description={description}
                action={
                  <HeroAction onClick={next} busy={leaving}>
                    {t("onboarding.actions.getStarted")}
                    <ArrowRight className="size-4" />
                  </HeroAction>
                }
              >
                {body}
              </HeroStep>
            ) : isDone ? (
              <DoneStep
                title={heading}
                description={description}
                action={
                  <HeroAction onClick={() => finish("completed")} busy={leaving}>
                    {t("onboarding.actions.finish")}
                    <ArrowRight className="size-4" />
                  </HeroAction>
                }
              />
            ) : (
              <>
                <StepHeader
                  eyebrow={t(`${labelBase}.${current.key}.nav`)}
                  title={heading}
                  description={description}
                />

                <div className="mt-10">{body}</div>

                <StepActions
                  secondary={
                    isConnect || isPathChoice ? null : (
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => goTo(safeStep + 1)}
                        disabled={leaving}
                        className="text-muted-foreground"
                      >
                        {t("onboarding.actions.skipStep")}
                      </Button>
                    )
                  }
                >
                  {/* Connecting is the connect step's own submit — a second
                      "Next" beside it would look like a way around the form. */}
                  {isConnect ? null : (
                    <Button
                      type="button"
                      onClick={next}
                      disabled={leaving || !canAdvance}
                    >
                      {t("onboarding.actions.next")}
                      <ArrowRight className="size-4" />
                    </Button>
                  )}
                </StepActions>
              </>
            )}

            <StepEscapes
              onSkipAll={() => finish("skipped")}
              onLogOut={() => logout()}
              showSkipAll={!isDone}
              busy={leaving}
            />
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
