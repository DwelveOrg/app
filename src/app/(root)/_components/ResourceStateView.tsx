"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, RefreshCw } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/Button";
import Empty from "@/app/(root)/(pages)/_components/ui/Empty";

/**
 * The forbidden / not-found / error state for a nested resource page.
 *
 * `ClassStateView` and `TestsStateView` were the same component twice — same back link, same
 * `Empty`, same "error is retryable, everything else routes back" rule — differing only in which
 * i18n block they read and where back pointed. Two copies meant the class page and the test page
 * could drift into explaining the same 403 in two different shapes.
 *
 * Props are i18n *keys* rather than rendered strings because every caller is a server component
 * with no `t` in scope; this is the client boundary that resolves them.
 */
export type ResourceStateReason = "forbidden" | "notFound" | "error";

export type ResourceStateViewProps = {
  reason: ResourceStateReason;
  /** i18n prefix holding `states.<reason>.title` and `.description`, e.g. `root.classDetail`. */
  namespace: string;
  backHref: string;
  backLabelKey: string;
  retryLabelKey: string;
  /** CTA for the non-retryable states. Defaults to the back link. */
  actionHref?: string;
  actionLabelKey?: string;
};

export default function ResourceStateView({
  reason,
  namespace,
  backHref,
  backLabelKey,
  retryLabelKey,
  actionHref,
  actionLabelKey,
}: Readonly<ResourceStateViewProps>) {
  const { t } = useTranslation();
  const router = useRouter();

  const backLabel = t(backLabelKey);
  const ctaHref = actionHref ?? backHref;
  const ctaLabel = actionLabelKey ? t(actionLabelKey) : backLabel;

  return (
    <section className="flex flex-col gap-6 py-6">
      <Link
        href={backHref}
        className="inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground transition hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        {backLabel}
      </Link>

      <Empty
        title={t(`${namespace}.states.${reason}.title`)}
        description={t(`${namespace}.states.${reason}.description`)}
        action={
          reason === "error" ? (
            <Button type="button" className="w-full" onClick={() => router.refresh()}>
              <RefreshCw className="size-4" />
              {t(retryLabelKey)}
            </Button>
          ) : (
            <Button asChild className="w-full">
              <Link href={ctaHref}>{ctaLabel}</Link>
            </Button>
          )
        }
      />
    </section>
  );
}

export { ResourceStateView };
