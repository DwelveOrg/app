"use client";

import { CalendarClock, Clock3, Repeat, Target } from "lucide-react";
import { useTranslation } from "react-i18next";

import type { TestDelivery } from "@/app/(root)/_lib/test-delivery";
import { DELIVERY_LIMITS } from "@/app/(root)/_lib/test-delivery";
import Field from "@/components/ui/Field";
import Input from "@/components/ui/Input";
import Surface from "@/components/ui/Surface";
import { SettingRow, SwitchSetting } from "../SettingRow";

export type TimingValues = {
  durationMinutes: number | null;
  availableFrom: string;
  availableUntil: string;
};

/** 60 minutes is an IELTS Reading paper and a sane default for anything else. */
const DEFAULT_DURATION_MINUTES = 60;

/**
 * The four values a delivery mode cannot infer: how long, when, how many goes,
 * and the pass mark.
 *
 * Everything else about how a test behaves is a refinement of a mode the
 * teacher already picked, and lives in the rule profiles below. These values do
 * not: no preset can guess that this quiz is fifteen minutes and opens on
 * Thursday, so they are the only settings on the page that are always visible.
 *
 * Per-section timing is not here. A section's duration belongs to the structure
 * tree, is edited in the builder, and is saved by `PUT /structure` — asking for
 * it here would mean a third request that can half-fail.
 */
export default function TimingPanel({
  values,
  onChange,
  delivery,
  onDeliveryChange,
  passingScore,
  onPassingScoreChange,
  totalPoints,
  windowError,
  settingsLocked = false,
}: {
  values: TimingValues;
  onChange: (next: Partial<TimingValues>) => void;
  delivery: TestDelivery;
  onDeliveryChange: (next: Partial<TestDelivery>) => void;
  passingScore: number | null;
  onPassingScoreChange: (value: number | null) => void;
  totalPoints: number;
  windowError: boolean;
  /** Published tests may update delivery rules, but not Test-row settings. */
  settingsLocked?: boolean;
}) {
  const { t } = useTranslation();
  const timed = values.durationMinutes != null;
  const passingInvalid = passingScore != null && passingScore > totalPoints;

  return (
    <Surface padding="none" elevation={0} className="divide-y divide-border">
      <SwitchSetting
        icon={<Clock3 />}
        title={t("root.tests.publish.timing.limit")}
        description={t("root.tests.publish.timing.limitHint")}
        checked={timed}
        disabled={settingsLocked}
        // A blank field behind the switch would make turning it on a two-step
        // action, so the switch lands on a usable number.
        onCheckedChange={(checked) =>
          onChange({ durationMinutes: checked ? DEFAULT_DURATION_MINUTES : null })
        }
      >
        <Field size="sm" label={t("root.tests.publish.timing.minutes")}>
          {({ id }) => (
            <Input
              id={id}
              type="number"
              min={1}
              max={600}
              size="md"
              className="max-w-32"
              disabled={settingsLocked}
              value={values.durationMinutes ?? ""}
              onChange={(event) =>
                onChange({
                  durationMinutes:
                    event.target.value === ""
                      ? null
                      : Math.max(1, Math.min(600, Number(event.target.value))),
                })
              }
            />
          )}
        </Field>
      </SwitchSetting>

      <SettingRow
        icon={<CalendarClock />}
        title={t("root.tests.publish.timing.window")}
        description={t("root.tests.publish.timing.windowHint")}
        control={null}
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <Field size="sm" label={t("root.tests.settings.availableFrom")}>
            {({ id }) => (
              <Input
                id={id}
                type="datetime-local"
                size="md"
                disabled={settingsLocked}
                value={values.availableFrom}
                onChange={(event) => onChange({ availableFrom: event.target.value })}
              />
            )}
          </Field>
          <Field
            size="sm"
            label={t("root.tests.settings.availableUntil")}
            error={windowError ? t("root.tests.settings.windowInvalid") : undefined}
          >
            {({ id }) => (
              <Input
                id={id}
                type="datetime-local"
                size="md"
                aria-invalid={windowError || undefined}
                disabled={settingsLocked}
                value={values.availableUntil}
                onChange={(event) => onChange({ availableUntil: event.target.value })}
              />
            )}
          </Field>
        </div>
      </SettingRow>

      <SettingRow
        icon={<Repeat />}
        title={t("root.tests.publish.timing.attempts")}
        description={t("root.tests.publish.timing.attemptsHint")}
        control={
          <Input
            type="number"
            min={DELIVERY_LIMITS.minAttempts}
            max={DELIVERY_LIMITS.maxAttempts}
            size="sm"
            className="w-20"
            aria-label={t("root.tests.publish.timing.attempts")}
            value={delivery.attemptsAllowed}
            onChange={(event) =>
              onDeliveryChange({
                attemptsAllowed: Math.max(
                  DELIVERY_LIMITS.minAttempts,
                  Math.min(
                    DELIVERY_LIMITS.maxAttempts,
                    Number(event.target.value) || DELIVERY_LIMITS.minAttempts,
                  ),
                ),
              })
            }
          />
        }
      />

      <SettingRow
        icon={<Target />}
        title={t("root.tests.settings.passingScore")}
        description={t("root.tests.publish.results.passingHint", { total: totalPoints })}
        control={
          <Input
            type="number"
            min={0}
            max={totalPoints}
            size="sm"
            className="w-20"
            disabled={settingsLocked}
            aria-label={t("root.tests.settings.passingScore")}
            aria-invalid={passingInvalid || undefined}
            value={passingScore ?? ""}
            onChange={(event) =>
              onPassingScoreChange(
                event.target.value === "" ? null : Math.max(0, Number(event.target.value)),
              )
            }
          />
        }
      >
        {passingInvalid ? (
          <p role="alert" className="text-xs text-destructive">
            {t("root.tests.publish.results.passingTooHigh", { total: totalPoints })}
          </p>
        ) : null}
      </SettingRow>
    </Surface>
  );
}
