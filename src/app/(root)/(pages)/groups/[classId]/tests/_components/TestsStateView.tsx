"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, RefreshCw } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/Button";
import Empty from "@/app/(root)/(pages)/_components/ui/Empty";
import type { TestsFetchFailure } from "@/app/(root)/_utils/getClassTests";

type TestsStateViewProps = {
  reason: TestsFetchFailure;
  /** Where "back" goes — the class for the list, the list for the builder. */
  backHref: string;
  /** i18n key, not text: the server page that renders this has no `t`. */
  backLabelKey: string;
};

/**
 * The non-success states for the test surfaces. `forbidden` is what a student
 * or an unrelated teacher sees, `notFound` covers both a missing test and one
 * authored by someone else (the backend answers 404 for both, deliberately, so
 * ids cannot be probed), and `error` is retryable.
 */
export default function TestsStateView({
  reason,
  backHref,
  backLabelKey,
}: TestsStateViewProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const backLabel = t(backLabelKey);

  return (
    <section className="flex flex-col gap-6 py-6">
      <Link
        href={backHref}
        className="inline-flex w-fit items-center gap-1.5 text-sm text-[var(--muted-foreground)] transition hover:text-[var(--foreground)]"
      >
        <ArrowLeft className="h-4 w-4" />
        {backLabel}
      </Link>

      <Empty
        title={t(`root.tests.states.${reason}.title`)}
        description={t(`root.tests.states.${reason}.description`)}
        action={
          reason === "error" ? (
            <Button type="button" className="w-full" onClick={() => router.refresh()}>
              <RefreshCw className="h-4 w-4" />
              {t("root.tests.actions.retry")}
            </Button>
          ) : (
            <Button asChild className="w-full">
              <Link href={backHref}>{backLabel}</Link>
            </Button>
          )
        }
      />
    </section>
  );
}
