"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Send, Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";

import type { ApiTestDetail } from "@/app/(root)/_lib/tests.schemas";
import {
  DELIVERY_PRESETS,
  matchPreset,
  type DeliveryPresetName,
  type TestDelivery,
} from "@/app/(root)/_lib/test-delivery";
import { formatIcon, studioRoutes } from "@/app/(root)/_constants/tests";
import {
  usePublishWithDeliveryMutation,
  useTestValidationQuery,
} from "@/app/(root)/_hooks/useTests";
import { Button } from "@/components/ui/Button";
import Surface from "@/components/ui/Surface";
import FormatMark from "@/components/tests/FormatMark";
import { cn } from "@/lib/utils";
import StudioTopBar from "../StudioTopBar";
import { formatDateTime, toIsoOrNull, toLocalInputValue } from "../../_lib/datetime";
import ConfirmStep from "./ConfirmStep";
import IntegrityStep from "./IntegrityStep";
import ReadinessStep from "./ReadinessStep";
import ResultsStep from "./ResultsStep";
import StudentPreview from "./StudentPreview";
import TimingStep, { type TimingValues } from "./TimingStep";
import WizardStepper, { type WizardStep } from "./WizardStepper";

const STEP_IDS = ["readiness", "timing", "integrity", "results", "confirm"] as const;
type StepId = (typeof STEP_IDS)[number];

/**
 * Publishing, as a conversation rather than a confirm dialog.
 *
 * The old flow was a modal that listed validation issues and had a Publish
 * button. It answered "may I publish this" and asked nothing about *how the
 * test should behave*, so every test went live untimed, unproctored, with the
 * whole paper visible and results shown on submit — because those were the
 * only behaviours that existed.
 *
 * This route asks the questions a teacher actually has to answer before an exam
 * goes out: how long, when, what happens if a student leaves the screen, and
 * who sees the answers afterwards. It is a route rather than a dialog for two
 * reasons: the answers need explaining, and the running student-preview panel
 * needs room to sit beside them.
 *
 * Everything is held in one local draft and written at the end. There is no
 * partial save, so abandoning the wizard changes nothing.
 */
export default function PublishWizard({ test }: { test: ApiTestDetail }) {
  const { t, i18n } = useTranslation();
  const router = useRouter();

  const [step, setStep] = useState<StepId>("readiness");
  const [delivery, setDelivery] = useState<TestDelivery>(test.delivery);
  const [deliveryUnsupported, setDeliveryUnsupported] = useState(false);

  const [timing, setTiming] = useState<TimingValues>({
    durationMinutes: test.durationMinutes ?? null,
    availableFrom: toLocalInputValue(test.availableFrom),
    availableUntil: toLocalInputValue(test.availableUntil),
  });
  const [shuffleQuestions, setShuffleQuestions] = useState(
    test.shuffleQuestions ?? false,
  );
  const [passingScore, setPassingScore] = useState<number | null>(
    test.passingScore ?? null,
  );

  const validation = useTestValidationQuery({ testId: test.id, enabled: true });
  const publish = usePublishWithDeliveryMutation();

  const issues = useMemo(() => validation.data?.issues ?? [], [validation.data]);
  const isReady = validation.data?.ok === true;

  const questionCount = useMemo(
    () =>
      test.sections.reduce(
        (total, section) =>
          total +
          section.groups.reduce((count, group) => count + group.questions.length, 0),
        0,
      ),
    [test.sections],
  );

  const windowError = Boolean(
    timing.availableFrom &&
      timing.availableUntil &&
      new Date(timing.availableUntil) <= new Date(timing.availableFrom),
  );

  const passingInvalid = passingScore != null && passingScore > test.totalPoints;

  const steps: WizardStep<StepId>[] = STEP_IDS.map((id) => ({
    id,
    label: t(`root.tests.publish.steps.${id}`),
  }));

  const index = STEP_IDS.indexOf(step);
  const isLast = index === STEP_IDS.length - 1;

  /**
   * Only the readiness check blocks forward movement. A bad availability window
   * or an out-of-range passing score is caught on its own step, because that is
   * where the teacher can see the field.
   */
  const canAdvance =
    step === "readiness"
      ? isReady
      : step === "timing"
        ? !windowError
        : step === "results"
          ? !passingInvalid
          : true;

  const updateDelivery = (next: Partial<TestDelivery>) =>
    setDelivery((current) => ({ ...current, ...next }));

  const applyPreset = (preset: DeliveryPresetName) => {
    setDelivery(DELIVERY_PRESETS[preset]);
  };

  const activePreset = matchPreset(delivery);

  const submit = (force: boolean) => {
    publish.mutate(
      {
        testId: test.id,
        delivery,
        force,
        settings: {
          durationMinutes: timing.durationMinutes,
          passingScore,
          shuffleQuestions,
          availableFrom: toIsoOrNull(timing.availableFrom),
          availableUntil: toIsoOrNull(timing.availableUntil),
        },
      },
      {
        onSuccess: (result) => {
          if (!result.published) {
            // Not an error: the backend simply has no delivery endpoint yet.
            // The teacher decides whether to go ahead without those rules.
            setDeliveryUnsupported(true);
            return;
          }
          toast.success(t("root.tests.publish.success", { title: test.title }));
          router.push(studioRoutes.classTests(test.classId));
          router.refresh();
        },
        onError: (error) => {
          toast.error(
            error instanceof Error ? error.message : t("root.tests.errorGeneric"),
          );
          void validation.refetch();
        },
      },
    );
  };

  return (
    <>
      <StudioTopBar
        exitHref={studioRoutes.builder(test.id)}
        exitLabel={t("root.tests.publish.backToBuilder")}
        identity={
          <>
            <FormatMark icon={formatIcon(test.format)} size="sm" />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-foreground">
                {test.title}
              </p>
              <p className="truncate text-2xs text-muted-foreground">
                {t("root.tests.publish.title")}
              </p>
            </div>
          </>
        }
        center={
          <WizardStepper
            steps={steps}
            current={step}
            onSelect={setStep}
            ariaLabel={t("root.tests.publish.stepsLabel")}
          />
        }
        actions={
          <>
            {index > 0 ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setStep(STEP_IDS[index - 1])}
              >
                <ArrowLeft />
                <span className="hidden sm:inline">
                  {t("root.tests.publish.back")}
                </span>
              </Button>
            ) : null}

            {isLast ? (
              <Button
                type="button"
                size="sm"
                loading={publish.isPending}
                onClick={() => submit(deliveryUnsupported)}
              >
                <Send />
                {deliveryUnsupported
                  ? t("root.tests.publish.confirmAnyway")
                  : t("root.tests.publish.confirm")}
              </Button>
            ) : (
              <Button
                type="button"
                size="sm"
                disabled={!canAdvance}
                onClick={() => setStep(STEP_IDS[index + 1])}
              >
                {t("root.tests.publish.next")}
                <ArrowRight />
              </Button>
            )}
          </>
        }
      />

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto grid w-full max-w-[1100px] gap-6 px-4 py-6 md:px-8 lg:grid-cols-[1fr_19rem]">
          <div className="min-w-0 space-y-4">
            <header>
              <h1 className="type-title text-foreground">
                {t(`root.tests.publish.headings.${step}`)}
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {t(`root.tests.publish.blurbs.${step}`)}
              </p>
            </header>

            {/* Presets sit above the settings steps, not on their own screen: a
                teacher who wants "make this a real exam" gets it in one press,
                and can then see and adjust exactly what that meant. */}
            {step === "timing" || step === "integrity" || step === "results" ? (
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 text-2xs text-muted-foreground">
                  <Sparkles className="size-3" aria-hidden="true" />
                  {t("root.tests.publish.presets.label")}
                </span>
                {(
                  Object.keys(DELIVERY_PRESETS) as DeliveryPresetName[]
                ).map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    aria-pressed={activePreset === preset}
                    onClick={() => applyPreset(preset)}
                    className={cn(
                      "interactive-flat cursor-pointer rounded-lg border px-2.5 py-1 text-2xs font-medium outline-none",
                      "focus-visible:ring-2 focus-visible:ring-ring/40",
                      activePreset === preset
                        ? "border-primary/45 bg-accent text-accent-foreground"
                        : "border-border bg-card text-muted-foreground hover:border-primary/25 hover:text-foreground",
                    )}
                  >
                    {t(`root.tests.publish.presets.${preset}`)}
                  </button>
                ))}
              </div>
            ) : null}

            {step === "readiness" ? (
              <ReadinessStep
                testId={test.id}
                issues={issues}
                isReady={isReady}
                isPending={validation.isPending}
                isError={validation.isError}
                onRetry={() => void validation.refetch()}
              />
            ) : null}

            {step === "timing" ? (
              <TimingStep
                values={timing}
                onChange={(next) => setTiming((current) => ({ ...current, ...next }))}
                delivery={delivery}
                onDeliveryChange={updateDelivery}
                windowError={windowError}
              />
            ) : null}

            {step === "integrity" ? (
              <IntegrityStep
                delivery={delivery}
                onChange={updateDelivery}
                shuffleQuestions={shuffleQuestions}
                onShuffleQuestionsChange={setShuffleQuestions}
              />
            ) : null}

            {step === "results" ? (
              <ResultsStep
                delivery={delivery}
                onChange={updateDelivery}
                passingScore={passingScore}
                onPassingScoreChange={setPassingScore}
                totalPoints={test.totalPoints}
              />
            ) : null}

            {step === "confirm" ? (
              <ConfirmStep
                title={test.title}
                questionCount={questionCount}
                totalPoints={test.totalPoints}
                durationMinutes={timing.durationMinutes}
                delivery={delivery}
                deliveryUnsupported={deliveryUnsupported}
              />
            ) : null}
          </div>

          <aside className="lg:sticky lg:top-6 lg:self-start">
            {step === "readiness" ? (
              <Surface padding="md" className="space-y-2">
                <p className="type-label text-foreground">
                  {t("root.tests.publish.aside.title")}
                </p>
                <p className="text-2xs text-muted-foreground">
                  {t("root.tests.publish.aside.body")}
                </p>
              </Surface>
            ) : (
              <StudentPreview
                delivery={delivery}
                durationMinutes={timing.durationMinutes}
                attemptWindow={{
                  from: formatDateTime(
                    toIsoOrNull(timing.availableFrom),
                    i18n.language,
                  ),
                  until: formatDateTime(
                    toIsoOrNull(timing.availableUntil),
                    i18n.language,
                  ),
                }}
              />
            )}
          </aside>
        </div>
      </div>
    </>
  );
}
