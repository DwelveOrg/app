"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  CalendarClock,
  Clock3,
  Eye,
  ListChecks,
  Maximize,
  Play,
  RotateCcw,
  ShieldAlert,
  Target,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";

import { readSafeActionData } from "@/lib/actions/read-safe-action-result";
import Badge from "@/components/ui/badge";
import { Button } from "@/components/ui/Button";
import Surface from "@/components/ui/Surface";
import { Checkbox } from "@/components/ui/checkbox";
import FormatMark from "@/components/tests/FormatMark";
import { formatIcon } from "@/app/(root)/_constants/tests";
import { cn } from "@/lib/utils";
import { startAttemptAction } from "../_lib/attempts.actions";
import type { TakerOverviewResponse } from "../_lib/attempts.schemas";

/**
 * The cover: everything a student needs to decide they are ready, and nothing
 * of the paper itself.
 *
 * ## Why the rules are listed before the button
 *
 * Every integrity rule this test enforces is stated here, in the second person,
 * before the attempt starts. That is not a legal formality — it is the
 * difference between a rule and a trap. A student who finds out that leaving
 * the tab ends their exam *by leaving the tab* has been caught out by the
 * software, not by their own dishonesty, and the delivery model exists to let a
 * teacher set that rule deliberately rather than to spring it.
 *
 * The same list is what the publish screen showed the teacher, in the same
 * order and the same words.
 *
 * ## The button
 *
 * One press, and it is idempotent on the server: a double-press, a refresh
 * mid-request, or a second tab all resume the same attempt rather than burning
 * a second one. That guarantee is why this screen can offer "Start" without
 * first asking "are you sure".
 */
export default function CoverScreen({
  testId,
  overview,
}: {
  testId: string;
  overview: TakerOverviewResponse;
}) {
  const { t } = useTranslation();
  const router = useRouter();

  const { test, state, attemptsUsed, activeAttempt } = overview;
  const delivery = test.delivery;

  const [accepted, setAccepted] = useState(false);
  const [starting, setStarting] = useState(false);

  const resuming = Boolean(activeAttempt);
  const attemptsLeft = Math.max(0, delivery.attemptsAllowed - attemptsUsed);
  const blocked = state !== "AVAILABLE" && state !== "IN_PROGRESS";
  const needsHonorCode = delivery.requireHonorCode && !accepted && !resuming;

  const start = async () => {
    setStarting(true);
    try {
      const result = readSafeActionData(
        await startAttemptAction({ testId, honorCodeAccepted: accepted || resuming }),
        "exam.errors.generic",
      );
      router.replace(`/exam/${testId}/attempt?attempt=${result.attempt.id}`);
    } catch (error) {
      setStarting(false);
      const message = error instanceof Error ? error.message : "exam.errors.generic";
      toast.error(t(message, { defaultValue: message }));
    }
  };

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 md:px-6">
      <header className="flex flex-wrap items-start gap-4">
        <FormatMark icon={formatIcon(test.format)} />
        <div className="min-w-0 flex-1">
          <h1 className="type-title text-foreground">{test.title}</h1>
          {test.className ? (
            <p className="mt-1 text-sm text-muted-foreground">{test.className}</p>
          ) : null}
        </div>
      </header>

      {test.description ? (
        <p className="mt-4 max-w-[68ch] text-15 text-foreground">{test.description}</p>
      ) : null}

      <Surface padding="md" className="mt-6">
        <dl className="grid gap-4 sm:grid-cols-3">
          <Fact
            icon={ListChecks}
            label={t("exam.cover.questions")}
            value={String(test.questionCount)}
          />
          <Fact
            icon={Target}
            label={t("exam.cover.points")}
            value={String(test.totalPoints)}
          />
          <Fact
            icon={Clock3}
            label={t("exam.cover.duration")}
            value={
              test.durationMinutes
                ? t("exam.cover.minutes", { count: test.durationMinutes })
                : t("exam.cover.untimed")
            }
          />
        </dl>

        {test.sectionSummaries.length > 1 ? (
          <ol className="mt-4 space-y-1.5 border-t border-border pt-4">
            {test.sectionSummaries.map((section) => (
              <li
                key={section.id}
                className="flex items-center gap-2 text-13 text-foreground"
              >
                <span className="min-w-0 flex-1 truncate">{section.title}</span>
                <Badge variant="neutral" size="xs">
                  {t("exam.cover.questionCount", { count: section.questionCount })}
                </Badge>
                {section.durationMinutes ? (
                  <Badge variant="neutral" size="xs">
                    {t("exam.cover.minutes", { count: section.durationMinutes })}
                  </Badge>
                ) : null}
              </li>
            ))}
          </ol>
        ) : null}
      </Surface>

      {test.instructions ? (
        <Surface padding="md" variant="muted" className="mt-4">
          <p className="type-label mb-2 text-foreground">{t("exam.cover.instructions")}</p>
          <p className="max-w-[68ch] text-15 leading-relaxed whitespace-pre-wrap text-foreground">
            {test.instructions}
          </p>
        </Surface>
      ) : null}

      {/* Every rule, in the second person, before the attempt starts. */}
      <Rules delivery={delivery} attemptsLeft={attemptsLeft} />

      {delivery.requireHonorCode && !resuming ? (
        <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-xl border border-border bg-card p-4">
          <Checkbox
            checked={accepted}
            onCheckedChange={(value) => setAccepted(value === true)}
            className="mt-0.5"
          />
          <span className="text-13 text-foreground">{t("exam.cover.honorCode")}</span>
        </label>
      ) : null}

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <Button
          type="button"
          size="lg"
          loading={starting}
          disabled={blocked || needsHonorCode}
          onClick={() => void start()}
        >
          {resuming ? <RotateCcw /> : <Play />}
          {resuming ? t("exam.cover.resume") : t("exam.cover.start")}
        </Button>

        {blocked ? (
          <p className="text-sm text-muted-foreground">{t(`exam.cover.blocked.${state}`)}</p>
        ) : (
          <p className="text-sm text-muted-foreground">
            {t("exam.cover.attemptsLeft", { count: attemptsLeft })}
          </p>
        )}
      </div>
    </div>
  );
}

function Fact({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Clock3;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-2.5">
      <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
      <div className="min-w-0">
        <dt className="text-2xs text-muted-foreground">{label}</dt>
        <dd className="type-label text-foreground">{value}</dd>
      </div>
    </div>
  );
}

/**
 * The rules in force, each as one sentence about what will happen to *you*.
 *
 * Only the rules that are actually on. A list that also enumerated the rules
 * this test does *not* enforce would be twice as long and read as a warning
 * either way — and the point of the list is that a student can read it.
 */
function Rules({
  delivery,
  attemptsLeft,
}: {
  delivery: TakerOverviewResponse["test"]["delivery"];
  attemptsLeft: number;
}) {
  const { t } = useTranslation();

  const rules: { key: string; icon: typeof Eye; values?: Record<string, unknown> }[] = [];

  if (delivery.navigationMode === "ONE_AT_A_TIME") {
    rules.push({
      key: delivery.allowBackNavigation ? "oneAtATime" : "noBack",
      icon: ListChecks,
    });
  }
  if (delivery.requireFullscreen) {
    rules.push({ key: `fullscreen.${delivery.fullscreenExitAction}`, icon: Maximize });
  }
  if (delivery.detectLeaveScreen) {
    rules.push({ key: `leaveScreen.${delivery.leaveScreenAction}`, icon: Eye });
  }
  if (delivery.blockCopyPaste) rules.push({ key: "noCopyPaste", icon: ShieldAlert });
  if (delivery.autoSubmitOnExpiry && delivery.showTimer) {
    rules.push({ key: "autoSubmit", icon: Clock3 });
  }
  if (delivery.allowLateSubmission) rules.push({ key: "lateAllowed", icon: CalendarClock });
  if (attemptsLeft > 1) {
    rules.push({ key: "attempts", icon: RotateCcw, values: { count: attemptsLeft } });
  }

  if (rules.length === 0) return null;

  const strict =
    delivery.requireFullscreen ||
    delivery.detectLeaveScreen ||
    delivery.blockCopyPaste;

  return (
    <Surface
      padding="md"
      className={cn(
        "mt-4",
        strict &&
          "border-[color-mix(in_srgb,var(--warning)_40%,transparent)] bg-[color-mix(in_srgb,var(--warning)_7%,transparent)]",
      )}
    >
      <p className="type-label mb-3 text-foreground">{t("exam.cover.rulesTitle")}</p>
      <ul className="space-y-2">
        {rules.map((rule) => (
          <li key={rule.key} className="flex items-start gap-2.5 text-13 text-foreground">
            <rule.icon
              className="mt-0.5 size-3.5 shrink-0 text-muted-foreground"
              aria-hidden="true"
            />
            {t(`exam.cover.rules.${rule.key}`, rule.values ?? {})}
          </li>
        ))}
      </ul>
    </Surface>
  );
}
