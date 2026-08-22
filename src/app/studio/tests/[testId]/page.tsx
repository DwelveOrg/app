import { getUser } from "@/app/(root)/_utils/getUser";
import { getTest } from "@/app/(root)/_utils/getTest";
import { getTestFormats } from "@/app/(root)/_utils/getTestFormats";
import { studioRoutes } from "@/app/(root)/_constants/tests";
import StudioError, { StudioForbidden } from "../../_components/StudioError";
import TestBuilder from "../../_components/TestBuilder";

type PageProps = {
  params: Promise<{ testId: string }>;
};

/**
 * The test builder (ADMIN + TEACHER).
 *
 * The class id is not in the URL: `GET /tests/:testId` returns it, and carrying
 * it in the path would mean a builder link could disagree with the test's real
 * owner. The exit link is built from the response instead.
 *
 * The question-type catalogue is loaded here, server-side, and handed down as
 * props — it is the single source of truth for what this test may contain, and
 * fetching it once per page keeps the client from holding a second copy that
 * could drift.
 */
export default async function Page({ params }: PageProps) {
  const { testId } = await params;
  const user = await getUser();
  const viewerRole = user?.schoolRole ?? null;

  if (viewerRole !== "ADMIN" && viewerRole !== "TEACHER") {
    return (
      <StudioForbidden exitHref="/groups" exitLabel="Back to classes" title="Test studio" />
    );
  }

  const [result, catalog] = await Promise.all([getTest(testId), getTestFormats()]);

  if (!result.ok) {
    return (
      <StudioError
        reason={result.reason}
        exitHref="/groups"
        exitLabel="Back to classes"
        title="Test studio"
      />
    );
  }

  if (!catalog) {
    return (
      <StudioError
        reason="error"
        exitHref={studioRoutes.classTests(result.test.classId)}
        exitLabel="Back to tests"
        title={result.test.title}
      />
    );
  }

  return <TestBuilder test={result.test} catalog={catalog} />;
}
