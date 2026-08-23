"use client";

import Link from "next/link";
import { useTranslation } from "react-i18next";

import ResourceStateView, {
  type ResourceStateReason,
} from "@/app/(root)/_components/ResourceStateView";
import { Button } from "@/components/ui/Button";
import StudioTopBar from "./StudioTopBar";

/**
 * A studio route that cannot render its document.
 *
 * The studio has no sidebar, so an error state here must supply its own way
 * out — `ResourceStateView` alone would leave the teacher on a full-screen
 * canvas with no navigation at all.
 *
 * Props are i18n *keys* rather than rendered strings because every caller is
 * a server component with no `t` in scope; this component is the client
 * boundary that resolves them — the same contract `ResourceStateView`
 * documents for itself.
 */
export default function StudioError({
  reason,
  exitHref,
  exitLabelKey,
  titleKey,
  documentTitle,
}: {
  reason: ResourceStateReason;
  exitHref: string;
  exitLabelKey: string;
  titleKey: string;
  /** The document's own name — user content, never translated. */
  documentTitle?: string;
}) {
  const { t } = useTranslation();
  const exitLabel = t(exitLabelKey);
  const title = documentTitle ?? t(titleKey);

  return (
    <>
      <StudioTopBar
        exitHref={exitHref}
        exitLabel={exitLabel}
        identity={
          <p className="truncate text-sm font-semibold text-foreground">{title}</p>
        }
      />
      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-10">
        <div className="mx-auto w-full max-w-md">
          <ResourceStateView
            reason={reason}
            namespace="root.tests"
            backHref={exitHref}
            backLabelKey="root.tests.builder.backToTests"
            retryLabelKey="root.tests.actions.retry"
          />
        </div>
      </div>
    </>
  );
}

/** The studio's own "you may not author here" state, for a student or a viewer. */
export function StudioForbidden({
  exitHref,
  exitLabelKey,
  titleKey,
}: {
  exitHref: string;
  exitLabelKey: string;
  titleKey: string;
}) {
  const { t } = useTranslation();
  const exitLabel = t(exitLabelKey);

  return (
    <>
      <StudioTopBar
        exitHref={exitHref}
        exitLabel={exitLabel}
        identity={
          <p className="truncate text-sm font-semibold text-foreground">
            {t(titleKey)}
          </p>
        }
        actions={
          <Button asChild size="sm" variant="outline">
            <Link href={exitHref}>{exitLabel}</Link>
          </Button>
        }
      />
      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-10">
        <div className="mx-auto w-full max-w-md">
          <ResourceStateView
            reason="forbidden"
            namespace="root.tests"
            backHref={exitHref}
            backLabelKey="root.tests.list.backToClass"
            retryLabelKey="root.tests.actions.retry"
          />
        </div>
      </div>
    </>
  );
}
