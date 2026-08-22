"use client";

import { GraduationCap, ShieldCheck, Sliders, SquarePen } from "lucide-react";
import { useTranslation } from "react-i18next";

import {
  DELIVERY_PRESETS,
  type DeliveryPresetName,
} from "@/app/(root)/_lib/test-delivery";
import ChoiceCards from "../ChoiceCards";

const MODE_ICONS: Record<DeliveryPresetName, React.ReactNode> = {
  practice: <SquarePen />,
  standard: <GraduationCap />,
  proctored: <ShieldCheck />,
};

/** No card is selected while the teacher's own settings match no preset. */
type ModeValue = DeliveryPresetName | "custom";

/**
 * The one question a teacher actually has to answer before publishing.
 *
 * The presets already existed, but they sat as a small chip row *inside* three
 * settings steps — offered after the teacher had been walked through eighteen
 * switches by hand, which is exactly backwards. Practice / Standard / Proctored
 * is the decision; everything else is refinement, and most tests need none of
 * it. So the modes lead the page, at full size, each stating what a student
 * will experience rather than which switches it sets.
 *
 * The three cards now set a coherent bundle, including duration and question
 * order at the screen boundary. Fine-tuning below can still move a category
 * away from the bundle; in that state no card is selected.
 */
export default function DeliveryModeCards({
  activePreset,
  onSelect,
}: {
  /** `null` when the current delivery matches no preset. */
  activePreset: DeliveryPresetName | null;
  onSelect: (preset: DeliveryPresetName) => void;
}) {
  const { t } = useTranslation();

  const presets = Object.keys(DELIVERY_PRESETS) as DeliveryPresetName[];

  return (
    <div className="space-y-2">
      <ChoiceCards<ModeValue>
        name="deliveryMode"
        ariaLabel={t("root.tests.publish.modes.label")}
        value={activePreset ?? "custom"}
        onChange={(value) => {
          if (value === "custom") return;
          onSelect(value);
        }}
        columns={3}
        options={presets.map((preset) => ({
          value: preset,
          icon: MODE_ICONS[preset],
          label: t(`root.tests.publish.presets.${preset}`),
          description: t(`root.tests.publish.modes.${preset}.description`),
          effect: t(`root.tests.publish.modes.${preset}.effect`),
        }))}
      />

      {activePreset ? null : (
        <p className="inline-flex items-center gap-1.5 text-2xs text-muted-foreground">
          <Sliders className="size-3 shrink-0" aria-hidden="true" />
          {t("root.tests.publish.modes.customised")}
        </p>
      )}
    </div>
  );
}
