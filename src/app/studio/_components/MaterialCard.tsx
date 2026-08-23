"use client";

import { useState } from "react";
import { BookOpenText, ChevronDown, Trash2 } from "lucide-react";
import {
  Controller,
  useWatch,
  type Control,
  type UseFormRegister,
} from "react-hook-form";
import { useTranslation } from "react-i18next";

import type { TestBuilderForm } from "@/app/(root)/_lib/tests.actions.schemas";
import { TEST_LIMITS } from "@/app/(root)/_lib/tests.actions.schemas";
import { paragraphLabels } from "@/app/(root)/_lib/test-form";
import { groupAnchorId } from "@/app/(root)/_constants/tests";
import ConfirmDialog from "@/app/(root)/_components/ConfirmDialog";
import Badge from "@/components/ui/badge";
import { Button } from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Textarea from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { GroupFieldName } from "../_types";
import TestImageField from "./TestImageField";

type MaterialCardProps = {
  control: Control<TestBuilderForm>;
  register: UseFormRegister<TestBuilderForm>;
  name: GroupFieldName;
  groupIndex: number;
  /** Backend group id, for the publish deep-link anchor. */
  groupId: string;
  testId: string;
  /** 1-based number of the first question this material covers. */
  startNumber: number;
  questionCount: number;
  flagged: boolean;
  disabled?: boolean;
  onRemove: (groupIndex: number) => void;
};

/**
 * Shared material: a passage, an image, or a set of instructions that several
 * questions depend on.
 *
 * ## What this replaces
 *
 * This was the "question group" — a container the teacher had to create, name,
 * and file questions into before they could write one. The container is still
 * how the backend shares a passage between questions
 * (`docs/features/test-taking-backend-handoff.md` A.1), but it is no longer
 * something anyone is asked to think about. What is left is the only part of it
 * that was ever meaningful: the material itself, sitting above the questions
 * about it, visibly connected to them by the rail its parent draws.
 *
 * There is no title field. A group's title was never shown to a student and
 * never read by anything; it existed because the container needed a name, and
 * the container is gone.
 *
 * ## Why it opens the way it does
 *
 * Open when empty, closed when it arrives with content. A material the teacher
 * has just added is the thing they are about to type into; one that already
 * holds a 20 000-character passage is scenery they are scrolling past to reach
 * question 31, and eight of those expanded is a paper nobody can navigate.
 */
export default function MaterialCard({
  control,
  register,
  name,
  groupIndex,
  groupId,
  testId,
  startNumber,
  questionCount,
  flagged,
  disabled,
  onRemove,
}: MaterialCardProps) {
  const { t } = useTranslation();

  const passage = useWatch({ control, name: `${name}.passage` }) ?? "";
  const imageUrl = useWatch({ control, name: `${name}.imageUrl` }) ?? "";

  const [open, setOpen] = useState(() => !passage && !imageUrl);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const paragraphs = paragraphLabels(passage);
  const hasContent = Boolean(passage || imageUrl);

  const remove = () => {
    // Only confirm when there is something to lose. A material card with
    // nothing in it is a mis-press, and charging a dialog for undoing a
    // mis-press is how a builder starts to feel heavy.
    if (hasContent) setConfirmOpen(true);
    else onRemove(groupIndex);
  };

  return (
    <section
      id={groupId ? groupAnchorId(groupId) : undefined}
      aria-label={t("root.tests.builder.material.label")}
      className={cn(
        "scroll-mt-24 rounded-xl border border-border bg-muted/50 transition-colors duration-[var(--dur-1)]",
        flagged && "border-destructive/45 ring-2 ring-destructive/45",
      )}
    >
      <header className="flex flex-wrap items-center gap-2 px-3 py-2.5">
        <span
          aria-hidden="true"
          className="grid size-7 shrink-0 place-items-center rounded-lg bg-card text-muted-foreground"
        >
          <BookOpenText className="size-3.5" />
        </span>

        <span className="type-label text-foreground">
          {t("root.tests.builder.material.label")}
        </span>

        {/*
          The range is the whole explanation of what this card is for: these are
          the questions it covers. It is also the only place the old group's
          numbering badge said anything a teacher could act on.
        */}
        <Badge variant="neutral" size="sm">
          {questionCount > 0
            ? t("root.tests.builder.material.range", {
                from: startNumber,
                to: startNumber + questionCount - 1,
              })
            : t("root.tests.builder.material.noQuestions")}
        </Badge>

        <div className="ml-auto flex items-center gap-1">
          <Button
            type="button"
            size="sm"
            variant="ghost"
            aria-expanded={open}
            onClick={() => setOpen((value) => !value)}
          >
            {open
              ? t("root.tests.builder.material.hide")
              : t("root.tests.builder.material.show")}
            <ChevronDown
              aria-hidden="true"
              className={cn(
                "size-3 transition-transform duration-[var(--dur-2)]",
                open && "rotate-180",
              )}
            />
          </Button>

          <Button
            type="button"
            size="icon-sm"
            variant="ghost"
            disabled={disabled}
            aria-label={t("root.tests.builder.material.remove")}
            className="text-muted-foreground hover:text-destructive"
            onClick={remove}
          >
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      </header>

      {/*
        A closed card still says what is inside it. Collapsing must hide detail,
        not consequence — the same rule the publish disclosures follow.
      */}
      {!open && hasContent ? (
        <p className="line-clamp-2 px-3 pb-3 text-xs text-muted-foreground">
          {passage || t("root.tests.builder.material.imageOnly")}
        </p>
      ) : null}

      {open ? (
        <div className="space-y-3 px-3 pb-3">
          {/*
            Said once, while the card is still empty. The connection between a
            passage and the questions under it is obvious the moment there are
            some; before that, the card is an empty box with no stated purpose.
          */}
          {!hasContent ? (
            <p className="text-2xs text-muted-foreground">
              {t("root.tests.builder.material.hint")}
            </p>
          ) : null}
          <Controller
            control={control}
            name={`${name}.passage`}
            render={({ field }) => (
              <div>
                <Textarea
                  {...field}
                  rows={6}
                  disabled={disabled}
                  placeholder={t("root.tests.builder.material.passagePlaceholder")}
                  aria-label={t("root.tests.builder.material.passage")}
                  // A comfortable reading measure — a 20 000-character passage
                  // set to the full panel width is unreadable while editing.
                  className="max-w-[68ch] bg-card py-2.5 leading-relaxed"
                />
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <span className="text-2xs text-muted-foreground numeric">
                    {t("root.tests.builder.material.charCount", {
                      // `used`, not `count`: i18next reads `count` as a plural
                      // selector, and this string is one shape in every language.
                      used: field.value?.length ?? 0,
                      max: TEST_LIMITS.passageChars,
                    })}
                  </span>

                  {/*
                    Blank-line-separated paragraphs get auto A/B/C labels,
                    derived on render and never stored, so editing the passage
                    renumbers instantly. Matching-headings questions reference
                    them.
                  */}
                  {paragraphs.length > 1 ? (
                    <span className="flex flex-wrap items-center gap-1">
                      <span className="text-2xs text-muted-foreground">
                        {t("root.tests.builder.material.paragraphs")}
                      </span>
                      {paragraphs.map(({ label }) => (
                        <Badge key={label} variant="neutral" size="xs">
                          {label}
                        </Badge>
                      ))}
                    </span>
                  ) : null}
                </div>
              </div>
            )}
          />

          <Input
            {...register(`${name}.instructions`)}
            disabled={disabled}
            placeholder={t("root.tests.builder.material.instructionsPlaceholder")}
            aria-label={t("root.tests.builder.material.instructions")}
            className="bg-card py-2"
          />

          <Controller
            control={control}
            name={`${name}.imageUrl`}
            render={({ field }) => (
              <TestImageField
                testId={testId}
                value={field.value}
                onChange={field.onChange}
                label={t("root.tests.builder.material.image")}
                hint={t("root.tests.builder.image.hint")}
                disabled={disabled}
              />
            )}
          />
        </div>
      ) : null}

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        icon={<Trash2 />}
        tone="destructive"
        title={t("root.tests.builder.material.confirm.title")}
        // Says what survives, because that is the question a teacher actually
        // has: deleting a passage must not read as deleting the twelve
        // questions about it.
        description={
          questionCount > 0
            ? t("root.tests.builder.material.confirm.description", {
                count: questionCount,
              })
            : t("root.tests.builder.material.confirm.descriptionEmpty")
        }
        confirmLabel={t("root.tests.builder.material.confirm.action")}
        cancelLabel={t("root.tests.actions.cancel")}
        onConfirm={() => {
          setConfirmOpen(false);
          onRemove(groupIndex);
        }}
      />
    </section>
  );
}
