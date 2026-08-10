import { redirect } from "next/navigation";

import ResourceStateView from "@/app/(root)/_components/ResourceStateView";
import AttemptRuntime from "../../_components/AttemptRuntime";
import ExamTopBar from "../../_components/ExamTopBar";
import { getAttempt } from "../../_lib/getAttempt";

type PageProps = {
  params: Promise<{ testId: string }>;
  searchParams: Promise<{ attempt?: string }>;
};

/**
 * The live paper.
 *
 * The attempt id travels in the query string rather than the path so that the
 * route stays `/exam/:testId/attempt` — a student who bookmarks it, or who
 * reopens the tab after a crash, lands on their *current* attempt rather than
 * on a stale id. Without one, the cover decides which attempt that is.
 *
 * A `409` here means the attempt is no longer live — submitted, expired, or
 * ended by an integrity rule — and the student goes to the result rather than
 * to an error. Losing an exam and being shown a stack-trace page for it is two
 * bad things where one was unavoidable.
 */
export default async function Page({ params, searchParams }: PageProps) {
  const { testId } = await params;
  const { attempt: attemptId } = await searchParams;

  if (!attemptId) redirect(`/exam/${testId}`);

  const result = await getAttempt(attemptId);

  if (!result.ok) {
    if (result.reason === "closed") redirect(`/exam/${testId}/result/${attemptId}`);

    return (
      <>
        <ExamTopBar title="" exitHref={`/exam/${testId}`} />
        <ResourceStateView
          reason={result.reason}
          namespace="exam"
          backHref={`/exam/${testId}`}
          backLabelKey="exam.backToCover"
          retryLabelKey="exam.retry"
        />
      </>
    );
  }

  return <AttemptRuntime initial={result.data} />;
}
