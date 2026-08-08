"use client";

import {
  Ban,
  ClipboardX,
  Maximize,
  MonitorOff,
  ShieldCheck,
  Shuffle,
  TriangleAlert,
} from "lucide-react";
import { useTranslation } from "react-i18next";

import type { IntegrityAction, TestDelivery } from "@/app/(root)/_lib/test-delivery";
import { DELIVERY_LIMITS } from "@/app/(root)/_lib/test-delivery";
import Input from "@/components/ui/Input";
import Surface from "@/components/ui/Surface";
import { Switch } from "@/components/ui/switch";
import ChoiceCards from "../ChoiceCards";
import { SettingRow, SwitchSetting } from "../SettingRow";
import FullscreenDemo from "./FullscreenDemo";

/**
 * Step three: the exam-integrity rules.
 *
 * This is the step the whole wizard exists for, and it is the one where a
 * careless default causes real harm — a student ejected from a final because a
 * calendar notification took focus for a second. Two things guard against that:
 *
 * - **Nothing is on by default.** `DEFAULT_TEST_DELIVERY` locks nothing down.
 *   Every rule here is an explicit act.
 * - **Every rule states its consequence, and the severe ones are a separate
 *   choice.** "Detect leaving the screen" is a switch; *what happens then* is
 *   three cards that spell out what the student sees. Ending an attempt is
 *   never something a teacher can turn on by flipping one toggle.
 */
export default function IntegrityStep({
  delivery,
  onChange,
  shuffleQuestions,
  onShuffleQuestionsChange,
}: {
  delivery: TestDelivery;
  onChange: (next: Partial<TestDelivery>) => void;
  /** Lives on the `Test` row, not on delivery — see `test-delivery.ts`. */
  shuffleQuestions: boolean;
  onShuffleQuestionsChange: (value: boolean) => void;
}) {
  const { t } = useTranslation();

  const countsViolations =
    (delivery.requireFullscreen && delivery.fullscreenExitAction === "COUNT") ||
    (delivery.detectLeaveScreen && delivery.leaveScreenAction === "COUNT");

  const actionOptions = (prefix: string) =>
    (["WARN", "COUNT", "SUBMIT"] as IntegrityAction[]).map((action) => ({
      value: action,
      label: t(`root.tests.publish.integrity.actions.${action}.label`),
      description: t(`root.tests.publish.integrity.actions.${action}.description`),
      effect: t(`root.tests.publish.integrity.effects.${prefix}.${action}`),
    }));

  return (
    <div className="space-y-4">
      <Surface padding="none" elevation={0} className="divide-y divide-border">
        {/* ---------------------------------------------------------------- */}
        {/* Leaving the screen                                                */}
        {/* ---------------------------------------------------------------- */}
        <SwitchSetting
          icon={<MonitorOff />}
          danger
          title={t("root.tests.publish.integrity.leaveScreen")}
          description={t("root.tests.publish.integrity.leaveScreenHint")}
          checked={delivery.detectLeaveScreen}
          onCheckedChange={(detectLeaveScreen) => onChange({ detectLeaveScreen })}
        >
          <ChoiceCards
            name="leaveScreenAction"
            ariaLabel={t("root.tests.publish.integrity.leaveScreenAction")}
            value={delivery.leaveScreenAction}
            onChange={(leaveScreenAction) => onChange({ leaveScreenAction })}
            options={actionOptions("leaveScreen")}
          />

          {delivery.leaveScreenAction === "SUBMIT" ? (
            <p className="inline-flex items-start gap-1.5 rounded-lg bg-[color-mix(in_srgb,var(--warning)_12%,transparent)] px-2.5 py-2 text-2xs text-warning">
              <TriangleAlert className="mt-px size-3.5 shrink-0" aria-hidden="true" />
              {t("root.tests.publish.integrity.submitWarning")}
            </p>
          ) : null}
        </SwitchSetting>

        {/* ---------------------------------------------------------------- */}
        {/* Fullscreen                                                        */}
        {/* ---------------------------------------------------------------- */}
        <SwitchSetting
          icon={<Maximize />}
          danger
          title={t("root.tests.publish.integrity.fullscreen")}
          description={t("root.tests.publish.integrity.fullscreenHint")}
          checked={delivery.requireFullscreen}
          onCheckedChange={(requireFullscreen) => onChange({ requireFullscreen })}
        >
          <ChoiceCards
            name="fullscreenExitAction"
            ariaLabel={t("root.tests.publish.integrity.fullscreenAction")}
            value={delivery.fullscreenExitAction}
            onChange={(fullscreenExitAction) => onChange({ fullscreenExitAction })}
            options={actionOptions("fullscreen")}
          />

          <div>
            <p className="mb-1.5 text-2xs text-muted-foreground">
              {t("root.tests.publish.integrity.demoHint")}
            </p>
            <FullscreenDemo />
          </div>
        </SwitchSetting>

        {/* ---------------------------------------------------------------- */}
        {/* The violation budget, shown only when something counts            */}
        {/* ---------------------------------------------------------------- */}
        {countsViolations ? (
          <SettingRow
            icon={<TriangleAlert />}
            danger
            title={t("root.tests.publish.integrity.limit")}
            description={t("root.tests.publish.integrity.limitHint")}
            control={
              <Input
                type="number"
                min={DELIVERY_LIMITS.minViolationLimit}
                max={DELIVERY_LIMITS.maxViolationLimit}
                size="sm"
                className="w-20"
                aria-label={t("root.tests.publish.integrity.limit")}
                value={delivery.violationLimit ?? DELIVERY_LIMITS.minViolationLimit}
                onChange={(event) =>
                  onChange({
                    violationLimit: Math.max(1, Number(event.target.value) || 1),
                  })
                }
              />
            }
          />
        ) : null}

        {/* ---------------------------------------------------------------- */}
        {/* The cheaper deterrents                                            */}
        {/* ---------------------------------------------------------------- */}
        <SwitchSetting
          icon={<ClipboardX />}
          title={t("root.tests.publish.integrity.copyPaste")}
          description={t("root.tests.publish.integrity.copyPasteHint")}
          checked={delivery.blockCopyPaste}
          onCheckedChange={(blockCopyPaste) => onChange({ blockCopyPaste })}
        />

        <SwitchSetting
          icon={<Ban />}
          title={t("root.tests.publish.integrity.contextMenu")}
          description={t("root.tests.publish.integrity.contextMenuHint")}
          checked={delivery.blockContextMenu}
          onCheckedChange={(blockContextMenu) => onChange({ blockContextMenu })}
        />

        <SwitchSetting
          icon={<ShieldCheck />}
          title={t("root.tests.publish.integrity.honorCode")}
          description={t("root.tests.publish.integrity.honorCodeHint")}
          checked={delivery.requireHonorCode}
          onCheckedChange={(requireHonorCode) => onChange({ requireHonorCode })}
        />
      </Surface>

      {/* ------------------------------------------------------------------ */}
      {/* Shuffling                                                           */}
      {/* ------------------------------------------------------------------ */}
      <Surface padding="none" elevation={0} className="divide-y divide-border">
        <SettingRow
          icon={<Shuffle />}
          title={t("root.tests.publish.integrity.shuffleQuestions")}
          description={t("root.tests.publish.integrity.shuffleQuestionsHint")}
          control={
            <Switch
              checked={shuffleQuestions}
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
