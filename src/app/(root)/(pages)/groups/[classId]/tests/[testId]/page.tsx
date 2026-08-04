import { getUser } from "@/app/(root)/_utils/getUser";
import { getTest } from "@/app/(root)/_utils/getTest";
import { getTestFormats } from "@/app/(root)/_utils/getTestFormats";
import TestBuilder from "../_components/TestBuilder";
import ResourceStateView from "@/app/(root)/_components/ResourceStateView";

type PageProps = {
  params: Promise<{ classId: string; testId: string }>;
};

/**
 * The test builder (ADMIN + TEACHER).
 *
 * The question-type catalogue is loaded here, server-side, and handed down as
 * props — it is the single source of truth for what this test may contain, and
 * fetching it once per page keeps the client from holding a second copy that
 * could drift.
 */
export default async function Page({ params }: PageProps) {
  const { classId, testId } = await params;
  const user = await getUser();
  const viewerRole = user?.schoolRole ?? null;
  const backHref = `/groups/${classId}/tests`;

  if (viewerRole !== "ADMIN" && viewerRole !== "TEACHER") {
    return (
      <ResourceStateView
        reason="forbidden"
        namespace="root.tests"
        backHref={`/groups/${classId}`}
        backLabelKey="root.tests.list.backToClass"
        retryLabelKey="root.tests.actions.retry"
      />
    );
  }

  const [result, catalog] = await Promise.all([getTest(testId), getTestFormats()]);

  if (!result.ok) {
    return (
      <ResourceStateView
        reason={result.reason}
        namespace="root.tests"
        backHref={backHref}
        backLabelKey="root.tests.builder.backToTests"
        retryLabelKey="root.tests.actions.retry"
        />
    );
  }

  if (!catalog) {
    return (
      <ResourceStateView
        reason="error"
        namespace="root.tests"
        backHref={backHref}
        backLabelKey="root.tests.builder.backToTests"
        retryLabelKey="root.tests.actions.retry"
        />
    );
  }

  return <TestBuilder test={result.test} classId={classId} catalog={catalog} />;
}
