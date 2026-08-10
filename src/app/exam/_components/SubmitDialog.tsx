"use client";

import { AlertTriangle, Send } from "lucide-react";
import { useTranslation } from "react-i18next";

import ConfirmDialog from "@/app/(root)/_components/ConfirmDialog";

/**
 * The last thing between a student and a graded paper.
 *
 * It exists to say one number: how many questions are unanswered. That is the
 * only fact that changes the decision, and it is the fact a student cannot
 * establish for themselves without scrolling the whole paper — which is
 * precisely what they do not have time for at the moment they press Submit.
 *
 * `tone="default"` rather than destructive. Submitting is the thing the student
 * came to do; painting it red would suggest they are about to lose something.
 * The warning, when there is one, is the amber line about unanswered questions
 * — and it is a warning, not a block, because leaving a question blank is a
 * legitimate exam decision.
 */
export default function SubmitDialog({
  open,
  onOpenChange,
  unanswered,
  total,
  pending,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  unanswered: number;
  total: number;
  pending: boolean;
  onConfirm: () => void;
}) {
  const { t } = useTranslation();

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      icon={<Send />}
      tone="default"
      title={t("exam.runtime.submitConfirm.title")}
      description={t("exam.runtime.submitConfirm.description", {
        answered: total - unanswered,
        total,
      })}
      confirmLabel={t("exam.runtime.submitConfirm.action")}
      cancelLabel={t("exam.runtime.submitConfirm.keepGoing")}
      isPending={pending}
      onConfirm={onConfirm}
    >
      {unanswered > 0 ? (
        <p className="flex items-start gap-2 rounded-xl bg-[color-mix(in_srgb,var(--warning)_12%,transparent)] px-3 py-2 text-13 text-foreground">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden="true" />
          {t("exam.runtime.submitConfirm.unanswered", { count: unanswered })}
        </p>
      ) : null}
    </ConfirmDialog>
  );
}
