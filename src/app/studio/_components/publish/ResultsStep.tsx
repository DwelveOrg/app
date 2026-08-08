"use client";

import { CalendarClock, Eye, Hand, MessageSquare, Target, Zap } from "lucide-react";
import { useTranslation } from "react-i18next";

import type { TestDelivery } from "@/app/(root)/_lib/test-delivery";
import Field from "@/components/ui/Field";
import Input from "@/components/ui/Input";
import Surface from "@/components/ui/Surface";
import ChoiceCards from "../ChoiceCards";
import { SwitchSetting } from "../SettingRow";

/**
 * Step four: what students see afterwards.
 *
 * Score, answer key, and feedback are three separate switches because most
 * exams release exactly one of them. A single "show results" toggle would force
 * a teacher who wants to give a mark without publishing the paper's answers to
 * choose between the two — which is the common case for a test that will be sat
 * again by another class.
 */
export default function ResultsStep({
  delivery,
  onChange,
  passingScore,
  onPassingScoreChange,
  totalPoints,
}: {
  delivery: TestDelivery;
  onChange: (next: Partial<TestDelivery>) => void;
  /** Lives on the `Test` row, saved by `PATCH /tests/:testId`. */
  passingScore: number | null;
  onPassingScoreChange: (value: number | null) => void;
  totalPoints: number;
}) {
  const { t } = useTranslation();

  const passingInvalid = passingScore != null && passingScore > totalPoints;

  return (
    <div className="space-y-4">
      <div>
        <p className="type-label mb-2 text-foreground">
          {t("root.tests.publish.results.release")}
        </p>
        <ChoiceCards
          name="resultsRelease"
          ariaLabel={t("root.tests.publish.results.release")}
          value={delivery.resultsRelease}
          onChange={(resultsRelease) => onChange({ resultsRelease })}
          columns={3}
          options={[
            {
              value: "IMMEDIATELY",
              icon: <Zap />,
              label: t("root.tests.publish.results.immediately"),
              description: t("root.tests.publish.results.immediatelyHint"),
            },
            {
              value: "AFTER_CLOSE",
              icon: <CalendarClock />,
              label: t("root.tests.publish.results.afterClose"),
              description: t("root.tests.publish.results.afterCloseHint"),
            },
            {
              value: "MANUAL",
              icon: <Hand />,
              label: t("root.tests.publish.results.manual"),
              description: t("root.tests.publish.results.manualHint"),
            },
          ]}
        />
      </div>

      <Surface padding="none" elevation={0} className="divide-y divide-border">
        <SwitchSetting
          icon={<Target />}
          title={t("root.tests.publish.results.showScore")}
          description={t("root.tests.publish.results.showScoreHint")}
          checked={delivery.showScore}
          onCheckedChange={(showScore) => onChange({ showScore })}
        >
          <SwitchSetting
            icon={<Eye />}
            title={t("root.tests.publish.results.showAnswers")}
            description={t("root.tests.publish.results.showAnswersHint")}
            checked={delivery.showCorrectAnswers}
            onCheckedChange={(showCorrectAnswers) => onChange({ showCorrectAnswers })}
          />
        </SwitchSetting>

        <SwitchSetting
          icon={<MessageSquare />}
          title={t("root.tests.publish.results.showFeedback")}
          description={t("root.tests.publish.results.showFeedbackHint")}
          checked={delivery.showFeedback}
          onCheckedChange={(showFeedback) => onChange({ showFeedback })}
        />
      </Surface>

      <Surface padding="md" elevation={0}>
        <Field
          size="sm"
          label={t("root.tests.settings.passingScore")}
          hint={t("root.tests.publish.results.passingHint", { total: totalPoints })}
          error={
            passingInvalid
              ? t("root.tests.publish.results.passingTooHigh", { total: totalPoints })
              : undefined
          }
        >
          {({ id }) => (
            <Input
              id={id}
              type="number"
              min={0}
              max={totalPoints}
              size="md"
              className="max-w-32"
              aria-invalid={passingInvalid || undefined}
              value={passingScore ?? ""}
              onChange={(event) =>
                onPassingScoreChange(
                  event.target.value === "" ? null : Number(event.target.value),
                )
              }
            />
          )}
        </Field>
      </Surface>
    </div>
  );
}
