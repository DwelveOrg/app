"use client";

import { useRef, useState, useTransition, type KeyboardEvent } from "react";
import { CheckCircle2, Star } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/Button";
import Surface from "@/components/ui/Surface";
import Textarea from "@/components/ui/textarea";
import { rateExperienceAction } from "../_lib/attempts.actions";
import { cn } from "@/lib/utils";

const SCALE = [
  { value: 1, key: "exam.result.experience.scale.1" },
  { value: 2, key: "exam.result.experience.scale.2" },
  { value: 3, key: "exam.result.experience.scale.3" },
  { value: 4, key: "exam.result.experience.scale.4" },
  { value: 5, key: "exam.result.experience.scale.5" },
] as const;

/**
 * "How was that?" — asked once, after the paper is in.
 *
 * ## What it is measuring, and what it deliberately is not
 *
 * The subject is the *sitting*: whether the timer was clear, whether the paper
 * was readable, whether anything got in the way. Not the difficulty of the
 * questions, and emphatically not how the student thinks they did — the score
 * is on the same screen, and a five-star widget next to a failed result would
 * collect mood rather than feedback.
 *
 * ## Why it is here rather than on the submit button
 *
 * Pressing submit is the tense moment of an exam. A rating attached to it
 * measures adrenaline. By the time this appears the attempt is finished and the
 * result is visible, so answering it costs nothing and skipping it is normal —
 * which is why there is no dismissal control and no reminder: the card is just
 * a card, and scrolling past it is a complete interaction.
 *
 * A rating already given comes back from the server, so revisiting the result
 * shows the thank-you rather than asking again.
 */
export default function ExperienceRating({
  attemptId,
  initialRating,
}: {
  attemptId: string;
  initialRating?: number | null;
}) {
  const { t } = useTranslation();
  const [rating, setRating] = useState<number | null>(initialRating ?? null);
  const [hovered, setHovered] = useState<number | null>(null);
  const [comment, setComment] = useState("");
  const [sent, setSent] = useState(Boolean(initialRating));
  const [failed, setFailed] = useState(false);
  const [isPending, startTransition] = useTransition();
  const radioRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const submit = (value: number, note: string) => {
    startTransition(async () => {
      const result = await rateExperienceAction({
        attemptId,
        rating: value,
        comment: note.trim() || undefined,
      });
      if (result?.serverError || result?.validationErrors) {
        setFailed(true);
        return;
      }
      setFailed(false);
      setSent(true);
    });
  };

  const chooseWithKeyboard = (
    event: KeyboardEvent<HTMLButtonElement>,
    index: number,
  ) => {
    let nextIndex: number | null = null;
    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      nextIndex = (index + 1) % SCALE.length;
    } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      nextIndex = (index - 1 + SCALE.length) % SCALE.length;
    } else if (event.key === "Home") {
      nextIndex = 0;
    } else if (event.key === "End") {
      nextIndex = SCALE.length - 1;
    }

    if (nextIndex === null) return;
    event.preventDefault();
    const next = SCALE[nextIndex].value;
    setRating(next);
    setFailed(false);
    radioRefs.current[nextIndex]?.focus();
  };

  if (sent) {
    return (
      <Surface padding="md" className="flex items-center gap-3">
        <CheckCircle2 className="size-5 shrink-0 text-success" aria-hidden="true" />
        <p className="text-13 text-foreground">{t("exam.result.experience.thanks")}</p>
      </Surface>
    );
  }

  const shown = hovered ?? rating ?? 0;

  return (
    <Surface padding="md" className="space-y-3">
      <div>
        <p className="type-label text-foreground">{t("exam.result.experience.title")}</p>
        <p className="mt-0.5 text-2xs text-muted-foreground">
          {t("exam.result.experience.subtitle")}
        </p>
      </div>

      <div
        role="radiogroup"
        aria-label={t("exam.result.experience.title")}
        className="flex items-center gap-1"
        onMouseLeave={() => setHovered(null)}
      >
        {SCALE.map(({ value, key }, index) => (
          <button
            key={value}
            ref={(node) => {
              radioRefs.current[index] = node;
            }}
            type="button"
            role="radio"
            aria-checked={rating === value}
            aria-label={t(key)}
            title={t(key)}
            tabIndex={rating === value || (rating === null && index === 0) ? 0 : -1}
            disabled={isPending}
            onMouseEnter={() => setHovered(value)}
            onFocus={() => setHovered(value)}
            onBlur={() => setHovered(null)}
            onKeyDown={(event) => chooseWithKeyboard(event, index)}
            onClick={() => {
              setRating(value);
              setFailed(false);
            }}
            className={cn(
              "interactive-flat cursor-pointer rounded-lg p-1.5 outline-none",
              "focus-visible:ring-2 focus-visible:ring-ring/50",
              "disabled:cursor-not-allowed disabled:opacity-60",
            )}
          >
            <Star
              className={cn(
                "size-6 transition-colors",
                value <= shown
                  ? "fill-warning text-warning"
                  : "text-muted-foreground",
              )}
              aria-hidden="true"
            />
          </button>
        ))}

        {shown > 0 ? (
          <span className="ml-2 text-13 text-muted-foreground">
            {t(SCALE[shown - 1].key)}
          </span>
        ) : null}
      </div>

      {rating ? (
        <div className="space-y-2">
          <Textarea
            rows={2}
            maxLength={1000}
            value={comment}
            aria-label={t("exam.result.experience.commentPlaceholder")}
            placeholder={t("exam.result.experience.commentPlaceholder")}
            onChange={(event) => setComment(event.target.value)}
          />
          <div className="flex items-center justify-end gap-3">
            {failed ? (
              <span className="text-2xs text-destructive">
                {t("exam.result.experience.error")}
              </span>
            ) : null}
            <Button
              type="button"
              size="sm"
              variant="outline"
              loading={isPending}
              onClick={() => submit(rating, comment)}
            >
              {t("exam.result.experience.send")}
            </Button>
          </div>
        </div>
      ) : null}
    </Surface>
  );
}
