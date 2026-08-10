"use client";

import { useTranslation } from "react-i18next";

import Input from "@/components/ui/Input";
import Textarea from "@/components/ui/textarea";
import { countWords, readAnswer, type TextAnswer } from "@/lib/tests/answers";
import { cn } from "@/lib/utils";
import type { QuestionRenderProps } from "../types";

/**
 * A typed response: a gap fill, a short answer, or a written task.
 *
 * One component for `TEXT` and `MANUAL` because they are the same act for the
 * student — the difference is only who marks it, which is not their concern
 * while they are writing. `long` decides whether it is a line or a page.
 *
 * The word count is live and it is the **limit as it will be enforced**: a
 * gap-fill answer over `maxWords` scores zero, and finding that out from the
 * mark rather than from the field is a rule the paper enforced in secret.
 */
export default function TextInput({
  question,
  mode,
  value,
  onChange,
  disabled,
  long,
}: QuestionRenderProps & { long: boolean }) {
  const { t } = useTranslation();
  const readOnly = mode !== "answer" || disabled;

  const text = (readAnswer("TEXT", value) as TextAnswer | null)?.text ?? "";
  const maxWords = question.config?.maxWords ?? null;
  const minWords = question.config?.minWords ?? null;
  const words = countWords(text);

  const overLimit = maxWords != null && words > maxWords;
  const underMinimum = minWords != null && words > 0 && words < minWords;

  const shared = {
    value: text,
    disabled: readOnly,
    "aria-label": t("exam.paper.answerLabel", { number: question.questionNumber }),
    "aria-invalid": overLimit || undefined,
    onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      onChange?.({ text: event.target.value }),
  };

  return (
    <div className="space-y-1.5">
      {long ? (
        <Textarea
          {...shared}
          rows={10}
          placeholder={readOnly ? undefined : t("exam.paper.writePlaceholder")}
          className="max-w-[68ch] leading-relaxed"
        />
      ) : (
        <Input
          {...shared}
          placeholder={readOnly ? undefined : t("exam.paper.answerPlaceholder")}
          className="max-w-md"
        />
      )}

      {/* An empty read-only field says nothing; "Not answered" says the thing. */}
      {readOnly && !text ? (
        <p className="text-2xs text-muted-foreground">{t("exam.paper.notAnswered")}</p>
      ) : null}

      {maxWords != null || minWords != null || long ? (
        <p
          className={cn(
            "text-2xs tabular-nums",
            overLimit ? "font-semibold text-destructive" : "text-muted-foreground",
          )}
        >
          {maxWords != null
            ? t("exam.paper.wordsOfMax", { words, max: maxWords })
            : t("exam.paper.words", { words })}
          {underMinimum ? ` · ${t("exam.paper.minWords", { min: minWords })}` : null}
          {overLimit ? ` · ${t("exam.paper.overLimit")}` : null}
        </p>
      ) : null}
    </div>
  );
}
