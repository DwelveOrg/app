import { getUser } from "@/app/(root)/_utils/getUser";
import { getTest } from "@/app/(root)/_utils/getTest";
import { getAttemptReview } from "@/app/(root)/_utils/getTestResults";
import ResourceStateView from "@/app/(root)/_components/ResourceStateView";
import AttemptReview from "./_components/AttemptReview";

type PageProps = {
  params: Promise<{ classId: string; testId: string; attemptId: string }>;
};

/**
 * One student's paper, with the answer key and the marking controls.
 *
 * No delivery switch narrows what a teacher sees here — `showCorrectAnswers`
 * and `resultsRelease` govern the *student's* view of their own result. The
 * backend enforces that split; this page simply renders what it is given.
 */
export default async function Page({ params }: PageProps) {
  const { classId, testId, attemptId } = await params;
  const user = await getUser();
  const backHref = `/groups/${classId}/tests/${testId}/results`;

  if (user?.schoolRole !== "ADMIN" && user?.schoolRole !== "TEACHER") {
    return (
      <ResourceStateView
        reason="forbidden"
        namespace="root.tests"
        backHref={backHref}
        backLabelKey="root.tests.results.review.backToResults"
        retryLabelKey="root.tests.actions.retry"
      />
    );
  }

  /**
   * The review payload carries the paper and the marks but not the test's own
   * title or pass mark, so those are loaded alongside it. In parallel, because
   * neither depends on the other and a teacher opening a paper should not wait
   * for two round trips in sequence.
   */
  const [review, test] = await Promise.all([
    getAttemptReview(attemptId),
    getTest(testId),
  ]);

  if (!review.ok) {
    return (
      <ResourceStateView
        reason={review.reason}
        namespace="root.tests"
        backHref={backHref}
        backLabelKey="root.tests.results.review.backToResults"
        retryLabelKey="root.tests.actions.retry"
      />
    );
  }

  return (
    <AttemptReview
      classId={classId}
      testId={testId}
      review={review.data}
      test={
        review.data.test ?? {
          id: testId,
          title: test.ok ? test.test.title : "",
          passingScore: test.ok ? (test.test.passingScore ?? null) : null,
        }
      }
    />
  );
}
