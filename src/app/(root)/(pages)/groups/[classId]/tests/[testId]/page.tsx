import { getUser } from "@/app/(root)/_utils/getUser";
import { getTest } from "@/app/(root)/_utils/getTest";
import { getTestFormats } from "@/app/(root)/_utils/getTestFormats";
import TestBuilder from "../_components/TestBuilder";
import TestsStateView from "../_components/TestsStateView";

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
      <TestsStateView
        reason="forbidden"
        backHref={`/groups/${classId}`}
        backLabelKey="root.tests.list.backToClass"
      />
    );
  }

  const [result, catalog] = await Promise.all([getTest(testId), getTestFormats()]);

  if (!result.ok) {
    return (
      <TestsStateView
        reason={result.reason}
        backHref={backHref}
        backLabelKey="root.tests.builder.backToTests"
      />
    );
  }

  if (!catalog) {
    return (
      <TestsStateView
        reason="error"
        backHref={backHref}
        backLabelKey="root.tests.builder.backToTests"
      />
    );
  }

  return <TestBuilder test={result.test} classId={classId} catalog={catalog} />;
}
