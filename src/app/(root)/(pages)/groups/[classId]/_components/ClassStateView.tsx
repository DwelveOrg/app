"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, RefreshCw } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/Button";
import Empty from "../../../_components/ui/Empty";
import type { ClassFetchFailure } from "@/app/(root)/_utils/getClass";

type ClassStateViewProps = {
  reason: ClassFetchFailure;
};

/**
 * The non-success states for a class page. `forbidden` explains that access is
 * granted by approval rather than showing a dead end, `notFound` offers the way
 * back to the directory, and `error` is retryable — the request may simply have
 * failed. Authorization itself is decided by the backend; this only renders the
 * outcome.
 */
export default function ClassStateView({ reason }: ClassStateViewProps) {
  const { t } = useTranslation();
  const router = useRouter();

  return (
    <section className="flex flex-col gap-6 py-6">
      <Link
        href="/groups"
        className="inline-flex w-fit items-center gap-1.5 text-sm text-[var(--muted-foreground)] transition hover:text-[var(--foreground)]"
      >
        <ArrowLeft className="h-4 w-4" />
        {t("root.classDetail.back")}
      </Link>

      <Empty
        title={t(`root.classDetail.states.${reason}.title`)}
        description={t(`root.classDetail.states.${reason}.description`)}
        action={
          reason === "error" ? (
            <Button type="button" className="w-full" onClick={() => router.refresh()}>
              <RefreshCw className="h-4 w-4" />
              {t("root.classDetail.states.retry")}
            </Button>
          ) : (
            <Button asChild className="w-full">
              <Link href="/groups">{t("root.classDetail.states.backToClasses")}</Link>
            </Button>
          )
        }
      />
    </section>
  );
}
