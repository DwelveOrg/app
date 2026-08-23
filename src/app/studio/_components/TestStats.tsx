"use client";

import { useDeferredValue, type ReactNode } from "react";
import { useWatch, type Control } from "react-hook-form";
import { useTranslation } from "react-i18next";

import type { TestBuilderForm } from "@/app/(root)/_lib/tests.actions.schemas";
import { countPoints, countQuestions } from "@/app/(root)/_lib/test-form";

/**
 * Live question and point totals.
 *
 * A separate component for the same reason `OutlineRail` is: these numbers have
 * to react to a points field changing, and subscribing to them in the builder
 * root would re-render eight hundred fields to update two digits. The backend
 * recomputes `totalPoints` on save and on publish regardless — this is the
 * teacher's running count, not the source of truth.
 */
export default function TestStats({
  control,
  render,
}: {
  control: Control<TestBuilderForm>;
  render: (stats: { questions: number; points: number }) => ReactNode;
}) {
  const sections = useDeferredValue(useWatch({ control, name: "sections" })) ?? [];
  const values = { sections } as TestBuilderForm;

  return <>{render({ questions: countQuestions(values), points: countPoints(values) })}</>;
}

/** The inline "24 questions · 40 points" summary the top bar carries. */
export function TestStatsSummary({ control }: { control: Control<TestBuilderForm> }) {
  const { t } = useTranslation();

  return (
    <TestStats
      control={control}
      render={({ questions, points }) => (
        <span className="hidden text-2xs text-muted-foreground numeric md:inline">
          {t("root.tests.builder.stats.summary", { questions, points })}
        </span>
      )}
    />
  );
}
