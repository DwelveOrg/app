import { getUser } from "@/app/(root)/_utils/getUser";
import ResourceStateView from "@/app/(root)/_components/ResourceStateView";
import CoverScreen from "../_components/CoverScreen";
import ExamTopBar from "../_components/ExamTopBar";
import { getTakerOverview } from "../_lib/getAttempt";

type PageProps = { params: Promise<{ testId: string }> };

/**
 * The cover screen for one test.
 *
 * Server-rendered because the state it shows — open, closed, out of attempts —
 * is resolved by the backend against its own clock, and a client that computed
 * it from `availableFrom` would be computing it from the student's clock. See
 * `docs/features/test-taking-backend-handoff.md` §B.5.
 */
export default async function Page({ params }: PageProps) {
  const { testId } = await params;
  const user = await getUser();
  const result = await getTakerOverview(testId);

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
      <ExamTopBar
        title={result.data.test.title}
        subtitle={user?.fullName ?? undefined}
        exitHref="/assignments/exams"
       
      />
      <CoverScreen testId={testId} overview={result.data} />
    </>
  );
}
