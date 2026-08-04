"use client";

import { useEffect } from "react";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  LoaderCircle,
  Send,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { Dialog as DialogPrimitive } from "radix-ui";

import type { TestValidationIssue } from "@/app/(root)/_lib/tests.schemas";
import Dialog from "@/app/(root)/_components/Dialog";
import { Button } from "@/components/ui/Button";
import Skeleton from "@/components/ui/Skeleton";
import { groupAnchorId, questionAnchorId, sectionAnchorId } from "../_constants";
import { humanizeToken, translateKey } from "../_lib/labels";
import { useTestValidationQuery } from "../_hooks/useTestValidationQuery";
import { usePublishTestMutation } from "../_hooks/usePublishTestMutation";

type PublishDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  testId: string;
  title: string;
  /** True when the form has edits that have not reached the backend yet. */
  hasUnsavedChanges: boolean;
  /** Lets the builder highlight the rows the issues point at. */
  onIssuesChange: (ids: string[]) => void;
  onPublished: () => void;
};

/** The row an issue belongs to, most specific first. */
function anchorFor(issue: TestValidationIssue): string | null {
  if (issue.questionId) return questionAnchorId(issue.questionId);
  if (issue.groupId) return groupAnchorId(issue.groupId);
  if (issue.sectionId) return sectionAnchorId(issue.sectionId);
  return null;
}

/**
 * Publish readiness, from `GET /tests/:testId/validation`.
 *
 * Validation runs against *saved* data, so the dialog says plainly when the
 * form has unsaved edits — otherwise a teacher would fix something, see the
 * issue persist, and lose trust in the list. Each issue links to the row it
 * belongs to, because "a question is missing its correct answer" is useless
 * without knowing which of forty.
 */
export default function PublishDialog({
  open,
  onOpenChange,
  testId,
  title,
  hasUnsavedChanges,
  onIssuesChange,
  onPublished,
}: PublishDialogProps) {
  const { t } = useTranslation();
  const validation = useTestValidationQuery({ testId, enabled: open });
  const publish = usePublishTestMutation();

  const issues = validation.data?.issues ?? [];
  const isReady = validation.data?.ok === true;

  // Keyed on the query result itself, not on the derived array: `?? []` would
  // produce a fresh reference every render and loop.
  const validationData = validation.data;
  useEffect(() => {
    if (!open || !validationData) return;
    onIssuesChange(
      validationData.issues
        .flatMap((issue) => [issue.questionId, issue.groupId, issue.sectionId])
        .filter((id): id is string => Boolean(id)),
    );
  }, [open, validationData, onIssuesChange]);

  const goToIssue = (issue: TestValidationIssue) => {
    const anchor = anchorFor(issue);
    if (!anchor) return;

    onOpenChange(false);
    // Let the dialog unmount before scrolling, so focus lands on the row and
    // not on the closing overlay.
    requestAnimationFrame(() => {
      const element = document.getElementById(anchor);
      element?.scrollIntoView({ behavior: "smooth", block: "center" });
      element?.focus({ preventScroll: true });
    });
  };

  const handlePublish = () => {
    publish.mutate(
      { testId },
      {
        onSuccess: () => {
          toast.success(t("root.tests.publish.success", { title }));
          onOpenChange(false);
          onIssuesChange([]);
          onPublished();
        },
        onError: (error) => {
          toast.error(
            error instanceof Error ? error.message : t("root.tests.errorGeneric"),
          );
          void validation.refetch();
        },
      },
    );
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={t("root.tests.publish.title")}
      description={t("root.tests.publish.description")}
      contentClassName="max-w-lg"
    >
      <div className="space-y-4">
        {hasUnsavedChanges ? (
          <p className="inline-flex items-start gap-2 rounded-xl border border-[color-mix(in_srgb,var(--warning)_40%,transparent)] bg-[color-mix(in_srgb,var(--warning)_10%,transparent)] px-3 py-2 text-xs text-warning">
            <AlertTriangle className="mt-px h-4 w-4 shrink-0" aria-hidden="true" />
            {t("root.tests.publish.unsaved")}
          </p>
        ) : null}

        {validation.isPending ? (
          <div className="space-y-2" aria-busy="true">
            <Skeleton className="h-10" />
            <Skeleton className="h-10" />
          </div>
        ) : validation.isError ? (
          <p className="rounded-xl border border-border bg-muted px-3 py-2 text-sm text-muted-foreground">
            {t("root.tests.publish.checkFailed")}
          </p>
        ) : isReady ? (
          <p className="inline-flex items-start gap-2 rounded-xl border border-[color-mix(in_srgb,var(--success)_40%,transparent)] bg-[color-mix(in_srgb,var(--success)_10%,transparent)] px-3 py-2 text-sm text-success">
            <CheckCircle2 className="mt-px h-4 w-4 shrink-0" aria-hidden="true" />
            {t("root.tests.publish.ready")}
          </p>
        ) : (
          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground">
              {t("root.tests.publish.blocked", { count: issues.length })}
            </p>
            <ul className="max-h-64 space-y-1.5 overflow-y-auto pr-1">
              {issues.map((issue, index) => {
                const message = translateKey(
                  t,
                  issue.messageKey,
                  t(`root.tests.validation.${issue.code}`, {
                    defaultValue: humanizeToken(issue.code),
                  }),
                );
                const anchor = anchorFor(issue);

                return (
                  <li key={`${issue.code}-${index}`}>
                    {anchor ? (
                      <button
                        type="button"
                        onClick={() => goToIssue(issue)}
                        className="flex w-full items-start gap-2 rounded-lg border border-border bg-background px-3 py-2 text-left text-xs text-foreground transition hover:border-destructive focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                      >
                        <AlertTriangle
                          className="mt-px h-3.5 w-3.5 shrink-0 text-destructive"
                          aria-hidden="true"
                        />
                        <span className="flex-1">{message}</span>
                        <ArrowRight
                          className="mt-px h-3.5 w-3.5 shrink-0 text-muted-foreground"
                          aria-hidden="true"
                        />
                      </button>
                    ) : (
                      <p className="flex items-start gap-2 rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground">
                        <AlertTriangle
                          className="mt-px h-3.5 w-3.5 shrink-0 text-destructive"
                          aria-hidden="true"
                        />
                        <span>{message}</span>
                      </p>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        <div className="flex items-center justify-end gap-3 pt-1">
          <DialogPrimitive.Close asChild>
            <Button type="button" variant="outline" disabled={publish.isPending}>
              {t("root.tests.actions.cancel")}
            </Button>
          </DialogPrimitive.Close>
          <Button
            type="button"
            onClick={handlePublish}
            disabled={publish.isPending || !isReady}
          >
            {publish.isPending ? (
              <LoaderCircle className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            {t("root.tests.publish.confirm")}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
