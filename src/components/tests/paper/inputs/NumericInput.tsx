"use client";

import { useTranslation } from "react-i18next";

import Input from "@/components/ui/Input";
import { readAnswer, type NumericAnswer } from "@/lib/tests/answers";
import type { QuestionRenderProps } from "../types";

/**
 * A number.
 *
 * `inputMode="decimal"` rather than `type="number"`: on a phone the numeric
 * keypad is the point, but `type="number"` also brings spinner arrows that a
 * stray scroll can change, and Safari silently discards a value it considers
 * malformed while the student is still typing it — "-" on its own, or "4." on
 * the way to "4.5". A text field with a numeric keypad loses nothing and
 * surprises nobody.
 *
 * The stored value is a real number, so a half-typed "4." saves as `4` and the
 * field keeps showing what was typed until it parses to something else.
 */
export default function NumericInput({
  question,
  mode,
  value,
  onChange,
  disabled,
}: QuestionRenderProps) {
  const { t } = useTranslation();
  const readOnly = mode !== "answer" || disabled;

  const stored = (readAnswer("NUMERIC", value) as NumericAnswer | null)?.number;
  const shown = Number.isFinite(stored) ? String(stored) : "";

  return (
    <div className="space-y-1.5">
      <Input
        inputMode="decimal"
        autoComplete="off"
        value={shown}
        disabled={readOnly}
        aria-label={t("exam.paper.answerLabel", { number: question.questionNumber })}
        placeholder={readOnly ? undefined : t("exam.paper.numberPlaceholder")}
        className="exam-prose max-w-40 numeric"
        onChange={(event) => {
          const raw = event.target.value.trim().replace(",", ".");
          if (raw === "") {
            // `null`, not `{ number: NaN }`. `JSON.stringify` turns NaN into
            // `null` *inside* the object, and the backend requires a finite
            // number there — so an emptied field would 422 on every autosave
            // and the student would watch "Not saved" for the rest of the exam.
            onChange?.(null);
            return;
          }
          const parsed = Number(raw);
          if (Number.isFinite(parsed)) onChange?.({ number: parsed });
        }}
      />

      {readOnly && !shown ? (
        <p className="text-2xs text-muted-foreground">{t("exam.paper.notAnswered")}</p>
      ) : null}
    </div>
  );
}
