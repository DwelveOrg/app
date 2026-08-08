"use client";

import { Bell, ShieldAlert, TriangleAlert, Users } from "lucide-react";
import { useTranslation } from "react-i18next";

import type { TestDelivery } from "@/app/(root)/_lib/test-delivery";
import {
  activeIntegrityRules,
  effectiveViolationLimit,
  isLockedDown,
} from "@/app/(root)/_lib/test-delivery";
import Badge from "@/components/ui/badge";
import Surface from "@/components/ui/Surface";

/**
 * Step five: the whole decision, in one place, before it becomes real.
 *
 * Publishing notifies every student in the class inside the same transaction,
 * so it is not a step that can be quietly undone — unpublishing later does not
 * unsend a notification. This step therefore says three things plainly: what
 * the paper is, which rules will be enforced, and who is about to be told.
 */
export default function ConfirmStep({
  title,
  questionCount,
  totalPoints,
  durationMinutes,
  delivery,
  deliveryUnsupported,
}: {
  title: string;
  questionCount: number;
  totalPoints: number;
  durationMinutes: number | null;
  delivery: TestDelivery;
  /** The backend cannot store delivery rules yet — see the handoff doc. */
  deliveryUnsupported: boolean;
}) {
  const { t } = useTranslation();

  const rules = activeIntegrityRules(delivery);
  const limit = effectiveViolationLimit(delivery);

  return (
    <div className="space-y-4">
      <Surface padding="md" elevation={0}>
        <p className="type-heading text-foreground">{title}</p>

        <dl className="mt-3 grid gap-x-6 gap-y-2 text-xs sm:grid-cols-2">
          <Fact
            label={t("root.tests.list.meta.questions")}
            value={t("root.tests.list.meta.questionCount", { count: questionCount })}
          />
          <Fact
            label={t("root.tests.list.meta.points")}
            value={t("root.tests.list.meta.pointCount", { count: totalPoints })}
          />
          <Fact
            label={t("root.tests.list.meta.duration")}
            value={
              durationMinutes
                ? t("root.tests.list.meta.minutes", { count: durationMinutes })
                : t("root.tests.builder.facts.noDuration")
            }
          />
          <Fact
            label={t("root.tests.publish.summary.attempts")}
            value={String(delivery.attemptsAllowed)}
          />
        </dl>
      </Surface>

      <Surface padding="md" elevation={0} className="space-y-3">
        <div className="flex items-center gap-2">
          <ShieldAlert
            className="size-4 shrink-0 text-muted-foreground"
            aria-hidden="true"
          />
          <p className="type-label text-foreground">
            {t("root.tests.publish.summary.rules")}
          </p>
          {isLockedDown(delivery) ? (
            <Badge variant="warning" size="sm">
              {t("root.tests.publish.summary.lockedDown")}
            </Badge>
          ) : (
            <Badge variant="neutral" size="sm">
              {t("root.tests.publish.summary.open")}
            </Badge>
          )}
        </div>

        {rules.length === 0 ? (
          <p className="text-2xs text-muted-foreground">
            {t("root.tests.publish.summary.noRules")}
          </p>
        ) : (
          <ul className="space-y-1.5">
            {rules.map((rule) => (
              <li key={rule.key} className="flex items-start gap-2 text-2xs">
                <span
                  aria-hidden="true"
                  className="mt-1.5 size-1 shrink-0 rounded-full bg-muted-foreground"
                />
                <span className="text-foreground">
                  {t(`root.tests.publish.summary.rule.${rule.key}`)}
                  {rule.action ? (
                    <span className="text-muted-foreground">
                      {" — "}
                      {t(
                        `root.tests.publish.integrity.actions.${rule.action}.label`,
                      ).toLocaleLowerCase()}
                    </span>
                  ) : null}
                </span>
              </li>
            ))}
          </ul>
        )}

        {limit != null ? (
          <p className="text-2xs text-muted-foreground">
            {t("root.tests.publish.summary.violationLimit", { count: limit })}
          </p>
        ) : null}
      </Surface>

      <Surface
        padding="md"
        elevation={0}
        className="flex items-start gap-2 border-[color-mix(in_srgb,var(--info)_35%,transparent)] bg-[color-mix(in_srgb,var(--info)_8%,transparent)]"
      >
        <Bell className="mt-px size-4 shrink-0 text-info" aria-hidden="true" />
        <div className="min-w-0 space-y-1">
          <p className="text-xs font-medium text-foreground">
            {t("root.tests.publish.summary.notifyTitle")}
          </p>
          <p className="inline-flex items-center gap-1.5 text-2xs text-muted-foreground">
            <Users className="size-3" aria-hidden="true" />
            {t("root.tests.publish.summary.notifyBody")}
          </p>
        </div>
      </Surface>

      {deliveryUnsupported ? (
        <Surface
          padding="md"
          elevation={0}
          className="flex items-start gap-2 border-[color-mix(in_srgb,var(--warning)_40%,transparent)] bg-[color-mix(in_srgb,var(--warning)_10%,transparent)]"
        >
          <TriangleAlert className="mt-px size-4 shrink-0 text-warning" aria-hidden="true" />
          <div className="min-w-0 space-y-1">
            <p className="text-xs font-medium text-foreground">
              {t("root.tests.publish.summary.deliveryUnsupportedTitle")}
            </p>
            <p className="text-2xs text-muted-foreground">
              {t("root.tests.publish.summary.deliveryUnsupportedBody")}
            </p>
          </div>
        </Surface>
      ) : null}
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border pb-1.5 last:border-b-0">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium text-foreground tabular-nums">{value}</dd>
    </div>
  );
}
