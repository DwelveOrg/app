import Link from "next/link";

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
 */
export default function StudioError({
  reason,
  exitHref,
  exitLabel,
  title,
}: {
  reason: ResourceStateReason;
  exitHref: string;
  exitLabel: string;
  title: string;
}) {
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
  exitLabel,
  title,
}: {
  exitHref: string;
  exitLabel: string;
  title: string;
}) {
  return (
    <>
      <StudioTopBar
        exitHref={exitHref}
        exitLabel={exitLabel}
        identity={
          <p className="truncate text-sm font-semibold text-foreground">{title}</p>
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
