import ResourceStateView from "@/app/(root)/_components/ResourceStateView";
import ExamTopBar from "../../../_components/ExamTopBar";
import ResultScreen from "../../../_components/ResultScreen";
import { getAttemptResult } from "../../../_lib/getAttempt";

type PageProps = { params: Promise<{ testId: string; attemptId: string }> };

/**
 * A student's own result.
 *
 * Whether there is anything to show is the server's decision, not this page's:
 * `delivery.resultsRelease` is resolved into a `released` flag, and a payload
 * without `questions` is a test whose teacher chose not to reveal the answer
 * key. Nothing here re-derives either.
 */
export default async function Page({ params }: PageProps) {
  const { testId, attemptId } = await params;
  const result = await getAttemptResult(attemptId);

  if (!result.ok) {
    return (
      <>
        <ExamTopBar title="" exitHref="/assignments/exams" />
        <ResourceStateView
          reason={result.reason === "closed" ? "notFound" : result.reason}
          namespace="exam"
          backHref="/assignments/exams"
          backLabelKey="exam.backToAssignments"
          retryLabelKey="exam.retry"
        />
      </>
    );
  }

  return (
    <>
      <ExamTopBar title="" exitHref="/assignments/exams" />
      <ResultScreen testId={testId} result={result.data} />
    </>
  );
}
