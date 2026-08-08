"use client";

import { AlarmClock, Bell, CalendarClock, Clock3, Repeat, ScrollText } from "lucide-react";
import { useTranslation } from "react-i18next";

import type { TestDelivery } from "@/app/(root)/_lib/test-delivery";
import { DELIVERY_LIMITS } from "@/app/(root)/_lib/test-delivery";
import Field from "@/components/ui/Field";
import Input from "@/components/ui/Input";
import Surface from "@/components/ui/Surface";
import { Switch } from "@/components/ui/switch";
import ChoiceCards from "../ChoiceCards";
import { SettingRow, SwitchSetting } from "../SettingRow";

export type TimingValues = {
  durationMinutes: number | null;
  availableFrom: string;
  availableUntil: string;
};

/**
 * Step two: when students may sit the test, and for how long.
 *
 * The duration and the availability window live on the `Test` row and are saved
 * by `PATCH /tests/:testId`; the behaviours around them — countdown visibility,
 * the warning threshold, what happens at zero — are delivery rules. The teacher
 * should not have to know which is which, so they are asked together and the
 * wizard routes each to its own endpoint.
 *
 * Per-section timing is not here. A section's duration belongs to the structure
 * tree, is edited in the builder, and is saved by `PUT /structure` — asking for
 * it in the publish flow would mean a third request that can half-fail.
 */
export default function TimingStep({
  values,
  onChange,
  delivery,
  onDeliveryChange,
  windowError,
}: {
  values: TimingValues;
  onChange: (next: Partial<TimingValues>) => void;
  delivery: TestDelivery;
  onDeliveryChange: (next: Partial<TestDelivery>) => void;
  windowError: boolean;
}) {
  const { t } = useTranslation();
  const timed = values.durationMinutes != null;

  return (
    <div className="space-y-4">
      <Surface padding="none" elevation={0} className="divide-y divide-border">
        <SwitchSetting
          icon={<Clock3 />}
          title={t("root.tests.publish.timing.limit")}
          description={t("root.tests.publish.timing.limitHint")}
          checked={timed}
          // 60 minutes is the length of an IELTS Reading paper and a sane
          // default for anything else; a blank field would make the switch a
          // two-step action.
          onCheckedChange={(checked) =>
            onChange({ durationMinutes: checked ? 60 : null })
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
                value={values.durationMinutes ?? ""}
                onChange={(event) =>
                  onChange({
                    durationMinutes:
                      event.target.value === "" ? null : Number(event.target.value),
                  })
                }
              />
            )}
          </Field>

          <SwitchSetting
            icon={<AlarmClock />}
            title={t("root.tests.publish.timing.showTimer")}
            description={t("root.tests.publish.timing.showTimerHint")}
            checked={delivery.showTimer}
            onCheckedChange={(showTimer) => onDeliveryChange({ showTimer })}
          />

          <SettingRow
            icon={<Bell />}
            title={t("root.tests.publish.timing.warning")}
            description={t("root.tests.publish.timing.warningHint")}
            control={
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={DELIVERY_LIMITS.minTimeWarning}
                  max={DELIVERY_LIMITS.maxTimeWarning}
                  size="sm"
                  className="w-20"
                  aria-label={t("root.tests.publish.timing.warning")}
                  disabled={delivery.timeWarningMinutes == null}
                  value={delivery.timeWarningMinutes ?? ""}
                  onChange={(event) =>
                    onDeliveryChange({
                      timeWarningMinutes:
                        event.target.value === "" ? null : Number(event.target.value),
                    })
                  }
                />
                <Switch
                  checked={delivery.timeWarningMinutes != null}
                  aria-label={t("root.tests.publish.timing.warning")}
                  onCheckedChange={(on) =>
                    onDeliveryChange({ timeWarningMinutes: on ? 5 : null })
                  }
                />
              </div>
            }
          />

          <SwitchSetting
            icon={<Clock3 />}
            title={t("root.tests.publish.timing.autoSubmit")}
            description={t("root.tests.publish.timing.autoSubmitHint")}
            danger
            checked={delivery.autoSubmitOnExpiry}
            onCheckedChange={(autoSubmitOnExpiry) =>
              onDeliveryChange({ autoSubmitOnExpiry })
            }
          />
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
                  value={values.availableUntil}
                  onChange={(event) => onChange({ availableUntil: event.target.value })}
                />
              )}
            </Field>
          </div>

          <SwitchSetting
            icon={<CalendarClock />}
            title={t("root.tests.publish.timing.late")}
            description={t("root.tests.publish.timing.lateHint")}
            checked={delivery.allowLateSubmission}
            onCheckedChange={(allowLateSubmission) =>
              onDeliveryChange({ allowLateSubmission })
            }
          />
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
                  attemptsAllowed: Math.max(1, Number(event.target.value) || 1),
                })
              }
            />
          }
        />
      </Surface>

      <div>
        <p className="type-label mb-2 text-foreground">
          {t("root.tests.publish.timing.navigation")}
        </p>
        <ChoiceCards
          name="navigationMode"
          ariaLabel={t("root.tests.publish.timing.navigation")}
          value={delivery.navigationMode}
          onChange={(navigationMode) => onDeliveryChange({ navigationMode })}
          columns={2}
          options={[
            {
              value: "ALL_AT_ONCE",
              icon: <ScrollText />,
              label: t("root.tests.publish.timing.allAtOnce"),
              description: t("root.tests.publish.timing.allAtOnceHint"),
              effect: t("root.tests.publish.timing.allAtOnceEffect"),
            },
            {
              value: "ONE_AT_A_TIME",
              icon: <ScrollText />,
              label: t("root.tests.publish.timing.oneAtATime"),
              description: t("root.tests.publish.timing.oneAtATimeHint"),
              effect: t("root.tests.publish.timing.oneAtATimeEffect"),
            },
          ]}
        />

        {delivery.navigationMode === "ONE_AT_A_TIME" ? (
          <Surface padding="none" elevation={0} className="mt-2">
            <SwitchSetting
              title={t("root.tests.publish.timing.back")}
              description={t("root.tests.publish.timing.backHint")}
              checked={delivery.allowBackNavigation}
              onCheckedChange={(allowBackNavigation) =>
                onDeliveryChange({ allowBackNavigation })
              }
            />
          </Surface>
        ) : null}
      </div>
    </div>
  );
}
