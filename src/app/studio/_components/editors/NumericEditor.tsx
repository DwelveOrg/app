"use client";

import { useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";
import type { QuestionEditorProps } from "../../_types";
import { EditorLabel, NumberField } from "./fields";

/**
 * The `NUMERIC` answer key, with a live statement of what will actually be
 * marked right.
 *
 * The three inputs — answer, tolerance, accepted range — interact in ways that
 * are not obvious from the labels: a tolerance of 0.05 around 4.2 and a range
 * of 4.15–4.25 are the same rule written twice, and setting both is a question
 * a teacher cannot answer from the form alone. The read-out below resolves it
 * by saying, in one sentence, which values pass.
 *
 * The band also renders as a bar, because "4.15 to 4.25" is a fact and a
 * two-pixel-wide band beside a wide one is an intuition.
 */
export default function NumericEditor({
  control,
  name,
  disabled,
}: QuestionEditorProps) {
  const { t } = useTranslation();

  const answer = useWatch({ control, name: `${name}.config.answer` });
  const tolerance = useWatch({ control, name: `${name}.config.tolerance` });
  const rangeMin = useWatch({ control, name: `${name}.config.rangeMin` });
  const rangeMax = useWatch({ control, name: `${name}.config.rangeMax` });

  const band = acceptedBand({ answer, tolerance, rangeMin, rangeMax });

  return (
    <div className="space-y-3">
      <EditorLabel hint={t("root.tests.builder.numeric.hint")}>
        {t("root.tests.builder.numeric.title")}
      </EditorLabel>

      <div className="grid gap-3 sm:grid-cols-2">
        <NumberField
          control={control}
          name={`${name}.config.answer`}
          label={t("root.tests.builder.numeric.answer")}
          placeholder={t("root.tests.builder.numeric.answerPlaceholder")}
          step={0.01}
          disabled={disabled}
        />
        <NumberField
          control={control}
          name={`${name}.config.tolerance`}
          label={t("root.tests.builder.numeric.tolerance")}
          hint={t("root.tests.builder.numeric.toleranceHint")}
          min={0}
          step={0.01}
          disabled={disabled}
        />
      </div>

      <fieldset className="rounded-xl border border-border bg-background p-3">
        <legend className="px-1 text-2xs font-medium text-muted-foreground">
          {t("root.tests.builder.numeric.rangeTitle")}
        </legend>
        <div className="grid gap-3 sm:grid-cols-2">
          <NumberField
            control={control}
            name={`${name}.config.rangeMin`}
            label={t("root.tests.builder.numeric.rangeMin")}
            step={0.01}
            disabled={disabled}
          />
          <NumberField
            control={control}
            name={`${name}.config.rangeMax`}
            label={t("root.tests.builder.numeric.rangeMax")}
            step={0.01}
            disabled={disabled}
          />
        </div>
        <p className="mt-2 text-2xs text-muted-foreground">
          {t("root.tests.builder.numeric.rangeHint")}
        </p>
      </fieldset>

      <AcceptedReadout band={band} />
    </div>
  );
}

type Band =
  | { kind: "none" }
  | { kind: "exact"; value: number }
  | { kind: "span"; min: number; max: number; source: "tolerance" | "range" };

/**
 * Mirrors how the backend stores the key: `acceptedRange` is a separate rule
 * from `answer` + `tolerance`, and `tests.validation.ts` accepts either. A range
 * is the wider, more explicit statement, so it wins when both are filled in —
 * and the read-out says which one is in force rather than leaving the teacher to
 * guess.
 */
function acceptedBand({
  answer,
  tolerance,
  rangeMin,
  rangeMax,
}: {
  answer?: number | null;
  tolerance?: number | null;
  rangeMin?: number | null;
  rangeMax?: number | null;
}): Band {
  const hasRange =
    typeof rangeMin === "number" &&
    typeof rangeMax === "number" &&
    Number.isFinite(rangeMin) &&
    Number.isFinite(rangeMax) &&
    rangeMin <= rangeMax;

  if (hasRange) {
    return { kind: "span", min: rangeMin, max: rangeMax, source: "range" };
  }

  if (typeof answer !== "number" || !Number.isFinite(answer)) {
    return { kind: "none" };
  }

  if (typeof tolerance === "number" && Number.isFinite(tolerance) && tolerance > 0) {
    return {
      kind: "span",
      min: answer - tolerance,
      max: answer + tolerance,
      source: "tolerance",
    };
  }

  return { kind: "exact", value: answer };
}

function AcceptedReadout({ band }: { band: Band }) {
  const { t } = useTranslation();

  if (band.kind === "none") {
    return (
      <p className="text-2xs text-warning">
        {t("root.tests.builder.numeric.noAnswer")}
      </p>
    );
  }

  const label =
    band.kind === "exact"
      ? t("root.tests.builder.numeric.acceptsExact", { value: format(band.value) })
      : t("root.tests.builder.numeric.acceptsRange", {
          min: format(band.min),
          max: format(band.max),
        });

  return (
    <div className="rounded-xl border border-[color-mix(in_srgb,var(--success)_35%,transparent)] bg-[color-mix(in_srgb,var(--success)_8%,transparent)] px-3 py-2">
      <p className="text-2xs font-medium text-success">{label}</p>

      {band.kind === "span" ? (
        <div
          aria-hidden="true"
          className="mt-2 flex items-center gap-2 text-3xs text-muted-foreground"
        >
          <span className="tabular-nums">{format(band.min)}</span>
          <span className="relative h-1.5 flex-1 rounded-full bg-muted">
            <span
              className={cn(
                "absolute inset-y-0 rounded-full bg-success",
                // A tolerance band is centred on the answer; an explicit range
                // is the whole rule, so it fills the bar.
                band.source === "tolerance" ? "inset-x-[30%]" : "inset-x-0",
              )}
            />
          </span>
          <span className="tabular-nums">{format(band.max)}</span>
        </div>
      ) : null}
    </div>
  );
}

/** Trims float noise: `4.2 - 0.1` must not read as `4.1000000000000005`. */
function format(value: number): string {
  return String(Number(value.toFixed(6)));
}
