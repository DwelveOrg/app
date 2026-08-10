"use client";

import { AlarmClock, Bell, Clock3, ScrollText, Shuffle } from "lucide-react";
import { useTranslation } from "react-i18next";

import type { TestDelivery } from "@/app/(root)/_lib/test-delivery";
import { DELIVERY_LIMITS } from "@/app/(root)/_lib/test-delivery";
import Input from "@/components/ui/Input";
import Surface from "@/components/ui/Surface";
import { Switch } from "@/components/ui/switch";
import ChoiceCards from "../ChoiceCards";
import { SettingRow, SwitchSetting } from "../SettingRow";

/**
 * How the paper behaves while a student is working through it: the clock, the
 * order of the questions, and whether they can move around freely.
 *
 * None of it is a decision a teacher has to make — every mode ships a working
 * answer — so all of it sits behind a disclosure. What is here is here because
 * someone eventually wants it: a mock exam that hides the countdown, a quiz
 * whose options should be shuffled, a paper that must be answered in order.
 */
export default function DuringPanel({
  delivery,
  onChange,
  durationMinutes,
  shuffleQuestions,
  onShuffleQuestionsChange,
  settingsLocked = false,
}: {
  delivery: TestDelivery;
  onChange: (next: Partial<TestDelivery>) => void;
  /** Lives on the `Test` row; caps the warning threshold so it stays publishable. */
  durationMinutes: number | null;
  /** Lives on the `Test` row too, not on delivery — see `test-delivery.ts`. */
  shuffleQuestions: boolean;
  onShuffleQuestionsChange: (value: boolean) => void;
  settingsLocked?: boolean;
}) {
  const { t } = useTranslation();

  /**
   * `validateTestForPublish` rejects a warning that is not strictly inside the
   * limit, so the input simply cannot be raised into that state. The teacher
   * has no opinion about this constraint and should never meet it as an error.
   */
  const maxWarning = durationMinutes
    ? Math.max(DELIVERY_LIMITS.minTimeWarning, Math.min(DELIVERY_LIMITS.maxTimeWarning, durationMinutes - 1))
    : DELIVERY_LIMITS.maxTimeWarning;

  return (
    <div className="space-y-4">
      <Surface padding="none" elevation={0} className="divide-y divide-border">
        <SwitchSetting
          icon={<AlarmClock />}
          title={t("root.tests.publish.timing.showTimer")}
          description={t("root.tests.publish.timing.showTimerHint")}
          checked={delivery.showTimer}
          disabled={durationMinutes == null}
          onCheckedChange={(showTimer) => onChange({ showTimer })}
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
                max={maxWarning}
                size="sm"
                className="w-20"
                aria-label={t("root.tests.publish.timing.warning")}
                disabled={delivery.timeWarningMinutes == null || durationMinutes == null}
                value={delivery.timeWarningMinutes ?? ""}
                onChange={(event) =>
                  onChange({
                    timeWarningMinutes:
                      event.target.value === ""
                        ? null
                        : Math.max(
                            DELIVERY_LIMITS.minTimeWarning,
                            Math.min(maxWarning, Number(event.target.value)),
                          ),
                  })
                }
              />
              <Switch
                checked={delivery.timeWarningMinutes != null}
                disabled={durationMinutes == null}
                aria-label={t("root.tests.publish.timing.warning")}
                onCheckedChange={(on) =>
                  onChange({
                    timeWarningMinutes: on ? Math.min(5, maxWarning) : null,
                  })
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
          disabled={durationMinutes == null}
          onCheckedChange={(autoSubmitOnExpiry) => onChange({ autoSubmitOnExpiry })}
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
          onChange={(navigationMode) => onChange({ navigationMode })}
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
              onCheckedChange={(allowBackNavigation) => onChange({ allowBackNavigation })}
            />
          </Surface>
        ) : null}
      </div>

      <Surface padding="none" elevation={0} className="divide-y divide-border">
        <SettingRow
          icon={<Shuffle />}
          title={t("root.tests.publish.integrity.shuffleQuestions")}
          description={t("root.tests.publish.integrity.shuffleQuestionsHint")}
          control={
            <Switch
              checked={shuffleQuestions}
              disabled={settingsLocked}
              onCheckedChange={onShuffleQuestionsChange}
              aria-label={t("root.tests.publish.integrity.shuffleQuestions")}
            />
          }
        />

        <SettingRow
          icon={<Shuffle />}
          title={t("root.tests.publish.integrity.shuffleOptions")}
          // Ordering questions store their answer as option position and
          // matching resolves by `matchKey`, so this cannot be one switch with
          // question shuffling — it would destroy those two answer keys.
          description={t("root.tests.publish.integrity.shuffleOptionsHint")}
          control={
            <Switch
              checked={delivery.shuffleOptions}
              onCheckedChange={(shuffleOptions) => onChange({ shuffleOptions })}
              aria-label={t("root.tests.publish.integrity.shuffleOptions")}
            />
          }
        />
      </Surface>
    </div>
  );
}
