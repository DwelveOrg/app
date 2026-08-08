"use client";

import Link from "next/link";
import { AlertTriangle, ArrowRight, CheckCircle2, RefreshCw } from "lucide-react";
import { useTranslation } from "react-i18next";

import type { TestValidationIssue } from "@/app/(root)/_lib/tests.schemas";
import { studioRoutes } from "@/app/(root)/_constants/tests";
import { humanizeToken, translateKey } from "@/app/(root)/_lib/test-labels";
import { Button } from "@/components/ui/Button";
import Skeleton from "@/components/ui/Skeleton";
import Surface from "@/components/ui/Surface";

/**
 * Step one: is this test publishable at all.
 *
 * `GET /tests/:testId/validation` runs the same function `POST /publish` runs,
 * so this is the real answer rather than a client-side guess. Every issue links
 * back into the builder with the whole issue set in the query string, so the
 * flagged rows stay highlighted while the teacher works through them — the old
 * dialog closed on the first jump and lost the list.
 */
export default function ReadinessStep({
  testId,
  issues,
  isReady,
  isPending,
  isError,
  onRetry,
}: {
  testId: string;
  issues: TestValidationIssue[];
  isReady: boolean;
  isPending: boolean;
  isError: boolean;
  onRetry: () => void;
}) {
  const { t } = useTranslation();

  /** Every id an issue points at, so the builder can highlight all of them at once. */
  const allIds = issues
    .flatMap((issue) => [issue.questionId, issue.groupId, issue.sectionId])
    .filter((id): id is string => Boolean(id));

  const builderLink = (focusId?: string | null) => {
    const params = new URLSearchParams();
    if (allIds.length > 0) params.set("issues", allIds.join(","));
    if (focusId) params.set("focus", focusId);
    const query = params.toString();
    return query ? `${studioRoutes.builder(testId)}?${query}` : studioRoutes.builder(testId);
  };

  if (isPending) {
    return (
      <div className="space-y-2" aria-busy="true">
        <Skeleton className="h-12 rounded-xl" />
        <Skeleton className="h-12 rounded-xl" />
        <Skeleton className="h-12 rounded-xl" />
      </div>
    );
  }

  if (isError) {
    return (
      <Surface variant="muted" padding="md" elevation={0} className="space-y-3">
        <p className="text-sm text-muted-foreground">
          {t("root.tests.publish.checkFailed")}
        </p>
        <Button type="button" variant="outline" size="sm" onClick={onRetry}>
          <RefreshCw />
          {t("root.tests.actions.retry")}
        </Button>
      </Surface>
    );
  }

  if (isReady) {
    return (
      <Surface
        padding="md"
        elevation={0}
        className="border-[color-mix(in_srgb,var(--success)_40%,transparent)] bg-[color-mix(in_srgb,var(--success)_8%,transparent)]"
      >
        <p className="flex items-start gap-2 text-sm text-success">
          <CheckCircle2 className="mt-px size-4 shrink-0" aria-hidden="true" />
          {t("root.tests.publish.ready")}
        </p>
      </Surface>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-foreground">
        {t("root.tests.publish.blocked", { count: issues.length })}
      </p>

      <ul className="space-y-1.5">
        {issues.map((issue, index) => {
          const message = translateKey(
            t,
            issue.messageKey,
            t(`root.tests.validation.${issue.code}`, {
              defaultValue: humanizeToken(issue.code),
            }),
          );
          const target = issue.questionId ?? issue.groupId ?? issue.sectionId ?? null;

          return (
            <li key={`${issue.code}-${index}`}>
              {target ? (
                <Link
                  href={builderLink(target)}
                  className="interactive-flat flex w-full items-start gap-2 rounded-lg border border-border bg-card px-3 py-2 text-left text-xs text-foreground outline-none hover:border-destructive/45 focus-visible:ring-2 focus-visible:ring-ring/40"
                >
                  <AlertTriangle
                    className="mt-px size-3.5 shrink-0 text-destructive"
                    aria-hidden="true"
                  />
                  <span className="flex-1">{message}</span>
                  <ArrowRight
                    className="mt-px size-3.5 shrink-0 text-muted-foreground"
                    aria-hidden="true"
                  />
                </Link>
              ) : (
                <p className="flex items-start gap-2 rounded-lg border border-border bg-card px-3 py-2 text-xs text-foreground">
                  <AlertTriangle
                    className="mt-px size-3.5 shrink-0 text-destructive"
                    aria-hidden="true"
                  />
                  <span>{message}</span>
                </p>
              )}
            </li>
          );
        })}
      </ul>

      <div className="flex flex-wrap items-center gap-2">
        <Button asChild variant="outline" size="sm">
          <Link href={builderLink()}>{t("root.tests.publish.fixInBuilder")}</Link>
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={onRetry}>
          <RefreshCw />
          {t("root.tests.publish.recheck")}
        </Button>
      </div>
    </div>
  );
}
