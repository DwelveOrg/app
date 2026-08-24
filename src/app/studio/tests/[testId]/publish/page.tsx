import { redirect } from "next/navigation";

import { getUser } from "@/app/(root)/_utils/getUser";
import { getTest } from "@/app/(root)/_utils/getTest";
import { studioRoutes } from "@/app/(root)/_constants/tests";
import StudioError, { StudioForbidden } from "../../../_components/StudioError";
import PublishScreen from "../../../_components/publish/PublishScreen";

type PageProps = {
  params: Promise<{ testId: string }>;
};

/**
 * The publish screen (ADMIN + TEACHER).
 *
 * The test is re-read server-side rather than handed over from the builder:
 * publish validates *saved* data, and the readiness banner must be about the
 * same version the backend will publish. A client hand-off would let a teacher
 * review a tree that only exists in their browser.
 */
export default async function Page({ params }: PageProps) {
  const { testId } = await params;
  // One wave, not two — same reasoning as the editor page: the test read is
  // session-authorised, so a forbidden viewer merely discards it.
  const [user, result] = await Promise.all([getUser(), getTest(testId)]);
  const viewerRole = user?.schoolRole ?? null;

  if (viewerRole !== "ADMIN" && viewerRole !== "TEACHER") {
    return (
      <StudioForbidden
        exitHref="/groups"
        exitLabelKey="root.tests.states.backToClasses"
        titleKey="root.tests.publish.action"
      />
    );
  }


  if (!result.ok) {
    return (
      <StudioError
        reason={result.reason}
        exitHref="/groups"
        exitLabelKey="root.tests.states.backToClasses"
        titleKey="root.tests.publish.action"
      />
    );
  }

  // Published tests use this same surface to update delivery alone; archived
  // tests remain read-only in the builder.
  if (result.test.status === "ARCHIVED") {
    redirect(studioRoutes.builder(testId));
  }

  return <PublishScreen test={result.test} />;
}
