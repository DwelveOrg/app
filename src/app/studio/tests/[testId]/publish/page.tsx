import { redirect } from "next/navigation";

import { getUser } from "@/app/(root)/_utils/getUser";
import { getTest } from "@/app/(root)/_utils/getTest";
import { studioRoutes } from "@/app/(root)/_constants/tests";
import StudioError, { StudioForbidden } from "../../../_components/StudioError";
import PublishWizard from "../../../_components/publish/PublishWizard";

type PageProps = {
  params: Promise<{ testId: string }>;
};

/**
 * The publish wizard (ADMIN + TEACHER).
 *
 * The test is re-read server-side rather than handed over from the builder:
 * publish validates *saved* data, and the wizard's readiness step must be about
 * the same version the backend will publish. A client hand-off would let a
 * teacher review a tree that only exists in their browser.
 */
export default async function Page({ params }: PageProps) {
  const { testId } = await params;
  const user = await getUser();
  const viewerRole = user?.schoolRole ?? null;

  if (viewerRole !== "ADMIN" && viewerRole !== "TEACHER") {
    return (
      <StudioForbidden exitHref="/groups" exitLabel="Back to classes" title="Publish" />
    );
  }

  const result = await getTest(testId);

  if (!result.ok) {
    return (
      <StudioError
        reason={result.reason}
        exitHref="/groups"
        exitLabel="Back to classes"
        title="Publish"
      />
    );
  }

  // Only a draft can be published. Anything else belongs in the builder, which
  // already explains the lock and offers the way out of it.
  if (result.test.status !== "DRAFT") {
    redirect(studioRoutes.builder(testId));
  }

  return <PublishWizard test={result.test} />;
}
