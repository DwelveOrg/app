"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, Send, Users } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";

import type { ApiTestDetail, TestValidationIssue } from "@/app/(root)/_lib/tests.schemas";
import {
  DELIVERY_PRESETS,
  type DeliveryPresetName,
  type TestDelivery,
} from "@/app/(root)/_lib/test-delivery";
import { formatIcon, studioRoutes } from "@/app/(root)/_constants/tests";
import {
  usePublishWithDeliveryMutation,
  useSaveTestDeliveryMutation,
  useTestValidationQuery,
} from "@/app/(root)/_hooks/useTests";
import { useUnsavedChangesWarning } from "@/app/(root)/_hooks/useUnsavedChangesWarning";
import { Button } from "@/components/ui/Button";
import Surface from "@/components/ui/Surface";
import FormatMark from "@/components/tests/FormatMark";
import StudioTopBar from "../StudioTopBar";
import { formatDateTime, toIsoOrNull, toLocalInputValue } from "../../_lib/datetime";
import DeliveryModeCards from "./DeliveryModeCards";
import ReadinessBanner from "./ReadinessBanner";
import RuleProfiles from "./RuleProfiles";
import StudentPreview from "./StudentPreview";
import TimingPanel, { type TimingValues } from "./TimingPanel";

/**
 * Publishing: one page, one decision, everything else optional.
 *
 * This replaced a five-step wizard — Check → Timing → Rules → Results →
 * Confirm — and the reason is the shape of the task rather than a taste for
 * fewer screens. Publishing is not a sequence with dependencies; it is a
 * settings review with one real question in it ("how should students take
 * this?") and seventeen refinements that every mode already answers. A wizard
 * charged the same four Next presses for a ten-question homework quiz as for a
 * proctored final, put the presets *after* the manual switches they were meant
 * to save the teacher from, and — because only step one could block — reported
 * a rejected publish on the step furthest from the list of reasons.
 *
 * So the page reads top to bottom as the decision actually goes:
 *
 * 1. **Can this be published at all** — a banner, not a step. It gates the
 *    button and nothing else.
 * 2. **How students take it** — Practice / Standard / Proctored, at full size.
 *    For most tests this is the entire interaction.
 * 3. **Essentials** — the four values no mode can guess: how long, what window,
 *    how many attempts, and the pass mark.
 * 4. **Fine-tuning** — three intent-level rules for question flow,
 *    supervision, and results. Each choice owns a coherent set of low-level
 *    delivery fields, so the screen cannot create contradictory combinations.
 *
 * The right-hand panel restates the resulting student experience live.
 *
 * Nothing is written until Publish. Abandoning the page changes nothing, which
 * is why the unsaved-changes guard is on edits rather than on arrival.
 */
export default function PublishScreen({ test }: { test: ApiTestDetail }) {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const isPublished = test.status === "PUBLISHED";

  const [delivery, setDelivery] = useState<TestDelivery>(test.delivery);
  const [timing, setTiming] = useState<TimingValues>({
    durationMinutes: test.durationMinutes ?? null,
    availableFrom: toLocalInputValue(test.availableFrom),
    availableUntil: toLocalInputValue(test.availableUntil),
  });
  const [shuffleQuestions, setShuffleQuestions] = useState(test.shuffleQuestions ?? false);
  const [passingScore, setPassingScore] = useState<number | null>(test.passingScore ?? null);
  const [touched, setTouched] = useState(false);
  /**
   * Not `publish.isSuccess`: a rejected publish also resolves successfully — it
   * returns the reasons as data — and reading the mutation's flag would drop
   * the unsaved-changes guard at exactly the moment the teacher still has work
   * in the page.
   */
  const [completed, setCompleted] = useState(false);

  /**
   * Issues the *server* returned from a rejected publish, as opposed to the
   * ones the readiness query found. They are shown in the same banner and
   * cleared the moment anything is edited, because they describe a version of
   * the draft that no longer exists.
   */
  const [publishIssues, setPublishIssues] = useState<TestValidationIssue[] | null>(null);

  const validationCandidate = useMemo(
    () => ({
      delivery,
      settings: {
        durationMinutes: timing.durationMinutes,
        passingScore,
        shuffleQuestions,
        availableFrom: toIsoOrNull(timing.availableFrom),
        availableUntil: toIsoOrNull(timing.availableUntil),
      },
    }),
    [delivery, passingScore, shuffleQuestions, timing],
  );

  const validation = useTestValidationQuery({
    testId: test.id,
    enabled: !isPublished,
    candidate: validationCandidate,
  });
  const publish = usePublishWithDeliveryMutation();
  const saveDelivery = useSaveTestDeliveryMutation();

  const bannerRef = useRef<HTMLDivElement>(null);

  useUnsavedChangesWarning(touched && !completed);

  /**
   * Every edit marks the draft dirty and drops any server rejection still on
   * screen: those issues describe a version of the draft that no longer exists.
   */
  const markEdited = () => {
    setTouched(true);
    setPublishIssues(null);
  };

  const updateDelivery = (next: Partial<TestDelivery>) => {
    markEdited();
    setDelivery((current) => ({ ...current, ...next }));
  };

  const updateTiming = (next: Partial<TimingValues>) => {
    markEdited();
    setTiming((current) => ({ ...current, ...next }));

    if (Object.hasOwn(next, "durationMinutes")) {
      const durationMinutes = next.durationMinutes ?? null;
      setDelivery((current) => ({
        ...current,
        showTimer: durationMinutes != null,
        timeWarningMinutes:
          durationMinutes != null && durationMinutes > 1
            ? Math.min(5, durationMinutes - 1)
            : null,
        autoSubmitOnExpiry: durationMinutes != null,
      }));
    }
  };

  const applyPreset = (preset: DeliveryPresetName) => {
    markEdited();
    const durationMinutes =
      preset === "practice" ? null : (timing.durationMinutes ?? 60);
    setDelivery(deliveryForPreset(preset, durationMinutes));
    setTiming((current) => ({ ...current, durationMinutes }));
    setShuffleQuestions(preset === "proctored");
  };

  const updateShuffleQuestions = (value: boolean) => {
    markEdited();
    setShuffleQuestions(value);
  };

  const updatePassingScore = (value: number | null) => {
    markEdited();
    setPassingScore(value);
  };

  const activePreset = (
    Object.keys(DELIVERY_PRESETS) as DeliveryPresetName[]
  ).find((preset) => {
    const timingMatches =
      preset === "practice"
        ? timing.durationMinutes == null
        : timing.durationMinutes != null;
    const shuffleMatches = shuffleQuestions === (preset === "proctored");
    const expected = deliveryForPreset(preset, timing.durationMinutes);

    return (
      timingMatches &&
      shuffleMatches &&
      (Object.keys(expected) as (keyof TestDelivery)[]).every(
        (key) => expected[key] === delivery[key],
      )
    );
  }) ?? null;

  const questionCount = useMemo(
    () =>
      test.sections.reduce(
        (total, section) =>
          total + section.groups.reduce((count, group) => count + group.questions.length, 0),
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

  const issues = publishIssues ?? validation.data?.issues ?? [];
  const isReady = publishIssues == null && validation.data?.ok === true;
  const canSubmit = isPublished
    ? touched
    : isReady && !windowError && !passingInvalid;

  /**
   * A rejection arrives while the teacher is looking at the button, and the
   * reasons render at the top of a page they may have scrolled a long way down.
   * Moving them to the reasons is the whole difference between "that failed"
   * and "here is what to fix".
   */
  useEffect(() => {
    if (!publishIssues) return;
    bannerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [publishIssues]);

  const submit = () => {
    if (isPublished) {
      saveDelivery.mutate(
        { testId: test.id, delivery },
        {
          onSuccess: () => {
            setCompleted(true);
            toast.success(t("root.tests.publish.updateSuccess"));
            router.push(studioRoutes.classTests(test.classId));
            router.refresh();
          },
          onError: (error) => {
            toast.error(
              error instanceof Error ? error.message : t("root.tests.errorGeneric"),
            );
          },
        },
      );
      return;
    }

    publish.mutate(
      {
        testId: test.id,
        delivery,
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
            setPublishIssues(result.issues);
            void validation.refetch();
            return;
          }
          setCompleted(true);
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

  const publishButton = (fullWidth?: boolean) => (
    <Button
      type="button"
      size={fullWidth ? "lg" : "sm"}
      className={fullWidth ? "w-full sm:w-auto" : undefined}
      loading={publish.isPending || saveDelivery.isPending}
      disabled={!canSubmit}
      onClick={submit}
    >
      <Send />
      {t(isPublished ? "root.tests.publish.updateDelivery" : "root.tests.publish.confirm")}
    </Button>
  );

  return (
    <>
      <StudioTopBar
        exitHref={studioRoutes.builder(test.id)}
        exitLabel={t("root.tests.publish.backToBuilder")}
        identity={
          <>
            <FormatMark icon={formatIcon(test.format)} size="sm" />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-foreground">{test.title}</p>
              <p className="truncate text-2xs text-muted-foreground tabular-nums">
                {t("root.tests.publish.identity", {
                  questions: questionCount,
                  points: test.totalPoints,
                })}
              </p>
            </div>
          </>
        }
        actions={publishButton()}
      />

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto grid w-full max-w-[1100px] gap-6 px-4 py-6 md:px-8 lg:grid-cols-[1fr_19rem]">
          <div className="min-w-0 space-y-6">
            {/*
              A rejection arrives without the teacher having moved, and the
              Publish button simply becomes disabled — so the reasons have to be
              announced, not only rendered.
            */}
            {!isPublished ? (
              <div ref={bannerRef} className="scroll-mt-4" aria-live="polite">
                <ReadinessBanner
                  testId={test.id}
                  issues={issues}
                  isReady={isReady}
                  isPending={validation.isPending}
                  isError={validation.isError}
                  onRetry={() => {
                    setPublishIssues(null);
                    void validation.refetch();
                  }}
                />
              </div>
            ) : null}

            <section className="space-y-2">
              <div>
                <h1 className="type-title text-foreground">
                  {t("root.tests.publish.modes.label")}
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  {t(
                    isPublished
                      ? "root.tests.publish.modes.updateHint"
                      : "root.tests.publish.modes.hint",
                  )}
                </p>
              </div>
              {isPublished ? null : (
                <DeliveryModeCards activePreset={activePreset} onSelect={applyPreset} />
              )}
            </section>

            <section className="space-y-2">
              <h2 className="type-heading text-foreground">
                {t("root.tests.publish.when.label")}
              </h2>
              <TimingPanel
                values={timing}
                onChange={updateTiming}
                delivery={delivery}
                onDeliveryChange={updateDelivery}
                passingScore={passingScore}
                onPassingScoreChange={updatePassingScore}
                totalPoints={test.totalPoints}
                windowError={windowError}
                settingsLocked={isPublished}
              />
            </section>

            <section className="space-y-2">
              <h2 className="type-heading text-foreground">
                {t("root.tests.publish.advanced.label")}
              </h2>
              <p className="-mt-1 text-sm text-muted-foreground">
                {t("root.tests.publish.rules.hint")}
              </p>
              <RuleProfiles
                delivery={delivery}
                shuffleQuestions={shuffleQuestions}
                onDeliveryChange={updateDelivery}
                onShuffleQuestionsChange={updateShuffleQuestions}
                settingsLocked={isPublished}
              />
            </section>

            {/*
              Publishing notifies every student in the class inside the same
              transaction, and unpublishing later does not unsend a
              notification. An irreversible action states its consequence where
              it is taken, so the second Publish lives here rather than the
              consequence living beside a button in the chrome.
            */}
            <Surface
              padding="md"
              elevation={0}
              className="flex flex-wrap items-center gap-4 border-[color-mix(in_srgb,var(--info)_35%,transparent)] bg-[color-mix(in_srgb,var(--info)_8%,transparent)]"
            >
              <Bell className="size-4 shrink-0 text-info" aria-hidden="true" />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-foreground">
                  {t(
                    isPublished
                      ? "root.tests.publish.summary.updateTitle"
                      : "root.tests.publish.summary.notifyTitle",
                  )}
                </p>
                <p className="mt-0.5 inline-flex items-center gap-1.5 text-2xs text-muted-foreground">
                  <Users className="size-3" aria-hidden="true" />
                  {t(
                    isPublished
                      ? "root.tests.publish.summary.updateBody"
                      : "root.tests.publish.summary.notifyBody",
                    { count: test.counts?.students ?? 0 },
                  )}
                </p>
              </div>
              {publishButton(true)}
            </Surface>
          </div>

          <aside className="lg:sticky lg:top-6 lg:self-start">
            <StudentPreview
              delivery={delivery}
              durationMinutes={timing.durationMinutes}
              attemptWindow={{
                from: formatDateTime(toIsoOrNull(timing.availableFrom), i18n.language),
                until: formatDateTime(toIsoOrNull(timing.availableUntil), i18n.language),
              }}
            />
          </aside>
        </div>
      </div>
    </>
  );
}

function deliveryForPreset(
  preset: DeliveryPresetName,
  durationMinutes: number | null,
): TestDelivery {
  const timed = preset !== "practice" && durationMinutes != null;

  return {
    ...DELIVERY_PRESETS[preset],
    showTimer: timed,
    timeWarningMinutes:
      timed && durationMinutes > 1 ? Math.min(5, durationMinutes - 1) : null,
    autoSubmitOnExpiry: timed,
  };
}
