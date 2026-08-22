"use client";

import Link from "next/link";
import { AlertTriangle, ArrowRight, CheckCircle2, Loader2, RefreshCw } from "lucide-react";
import { useTranslation } from "react-i18next";

import type { TestValidationIssue } from "@/app/(root)/_lib/tests.schemas";
import { studioRoutes } from "@/app/(root)/_constants/tests";
import { humanizeToken, translateKey } from "@/app/(root)/_lib/test-labels";
import { Button } from "@/components/ui/Button";
import Surface from "@/components/ui/Surface";

/**
 * Whether this test may be published, stated once at the top of the page.
 *
 * It used to be step one of a five-step wizard, which made it a screen that
 * asks nothing: in the common case it said "everything checks out" and then
 * required a Next click to get past itself. A gate is not a step. Now it is the
 * banner the page opens with, it blocks only the Publish button, and everything
 * else on the page stays usable while a teacher works through the list.
 *
 * Candidate validation runs the same function `POST /publish` runs, so this is
 * the real answer rather than a client-side guess. Every issue links
 * back into the builder with the whole issue set in the query string, so the
 * flagged rows stay highlighted while they are being fixed.
 */
export default function ReadinessBanner({
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
      <Surface
        variant="muted"
        padding="none"
        elevation={0}
        className="flex items-center gap-2.5 px-4 py-3"
        aria-busy="true"
      >
        <Loader2
          className="size-4 shrink-0 animate-spin text-muted-foreground"
          aria-hidden="true"
        />
        <p className="text-sm text-muted-foreground">
          {t("root.tests.publish.readiness.checking")}
        </p>
      </Surface>
    );
  }

  if (isError) {
    return (
      <Surface
        variant="muted"
        padding="none"
        elevation={0}
        className="flex flex-wrap items-center gap-3 px-4 py-3"
      >
        <p className="min-w-0 flex-1 text-sm text-muted-foreground">
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
    // One line, not a card. A pass is the expected outcome and should take the
    // least room on the page; the settings below are what the teacher came for.
    return (
      <Surface
        padding="none"
        elevation={0}
        className="flex items-center gap-2.5 border-[color-mix(in_srgb,var(--success)_40%,transparent)] bg-[color-mix(in_srgb,var(--success)_8%,transparent)] px-4 py-3"
      >
        {/* Icon plus wording: the state is never carried by the green wash alone. */}
        <CheckCircle2 className="size-4 shrink-0 text-success" aria-hidden="true" />
        <p className="min-w-0 flex-1 text-sm text-foreground">
          {t("root.tests.publish.ready")}
        </p>
      </Surface>
    );
  }

  return (
    <Surface
      padding="none"
      elevation={0}
      className="space-y-3 border-destructive/35 bg-[color-mix(in_srgb,var(--destructive)_5%,transparent)] p-4"
    >
      <div className="flex flex-wrap items-center gap-2">
        <AlertTriangle className="size-4 shrink-0 text-destructive" aria-hidden="true" />
        <p className="min-w-0 flex-1 text-sm font-medium text-foreground">
          {t("root.tests.publish.blocked", { count: issues.length })}
        </p>
        <Button type="button" variant="ghost" size="sm" onClick={onRetry}>
          <RefreshCw />
          {t("root.tests.publish.recheck")}
        </Button>
      </div>

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
                  <span className="min-w-0 flex-1">{message}</span>
                  <ArrowRight
                    className="mt-px size-3.5 shrink-0 text-muted-foreground"
                    aria-hidden="true"
                  />
                </Link>
              ) : (
                <p className="flex items-start gap-2 rounded-lg border border-border bg-card px-3 py-2 text-xs text-foreground">
                  <span>{message}</span>
                </p>
              )}
            </li>
          );
        })}
      </ul>

      <Button asChild variant="outline" size="sm">
        <Link href={builderLink()}>{t("root.tests.publish.fixInBuilder")}</Link>
      </Button>
    </Surface>
  );
}
