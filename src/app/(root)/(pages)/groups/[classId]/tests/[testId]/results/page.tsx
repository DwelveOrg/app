import { getUser } from "@/app/(root)/_utils/getUser";
import { getTest } from "@/app/(root)/_utils/getTest";
import {
  getTestResults,
  getTestStatistics,
} from "@/app/(root)/_utils/getTestResults";
import ResourceStateView from "@/app/(root)/_components/ResourceStateView";
import ResultsView from "./_components/ResultsView";

type PageProps = { params: Promise<{ classId: string; testId: string }> };

/**
 * Class results for one test (ADMIN + TEACHER).
 *
 * The roster and the statistics are fetched in parallel and treated
 * differently on failure: no roster means no page, but no statistics simply
 * means no analysis yet — a class that has not sat the test still has
 * twenty-four students worth listing, and an analytics query that times out
 * must not take the register down with it.
 */
export default async function Page({ params }: PageProps) {
  const { classId, testId } = await params;
  const user = await getUser();
  const backHref = `/groups/${classId}`;

  // The backend is the authorization boundary; this only picks the UI.
  if (user?.schoolRole !== "ADMIN" && user?.schoolRole !== "TEACHER") {
    return (
      <ResourceStateView
        reason="forbidden"
        namespace="root.tests"
        backHref={backHref}
        backLabelKey="root.tests.list.backToClass"
        retryLabelKey="root.tests.actions.retry"
      />
    );
  }

  const [test, results, statistics] = await Promise.all([
    getTest(testId),
    getTestResults(testId, { page: 1, limit: 100 }),
    getTestStatistics(testId),
  ]);

  if (!results.ok) {
    return (
      <ResourceStateView
        reason={results.reason}
        namespace="root.tests"
        backHref={backHref}
        backLabelKey="root.tests.list.backToClass"
        retryLabelKey="root.tests.actions.retry"
      />
    );
  }

  return (
    <ResultsView
      classId={classId}
      testId={testId}
      testTitle={test.ok ? test.test.title : ""}
      results={results.data}
      statistics={statistics}
    />
  );
}
