import { notFound, redirect } from "next/navigation";

import { getTest } from "@/app/(root)/_utils/getTest";

type PageProps = { params: Promise<{ testId: string }> };

/**
 * A class-agnostic deep link to a test's results.
 *
 * Results live under `/groups/[classId]/tests/[testId]/results`, because that is
 * where a teacher navigates from. But the things that *link* to them often know
 * only the test — a submission notification carries `testId` and `attemptId` and
 * no `classId`, and a URL pasted into a message rarely has one either.
 *
 * Rather than teach every producer of a link to look the class up, this route
 * does it once. `redirect()` runs before anything renders, so nothing paints.
 */
export default async function Page({ params }: PageProps) {
  const { testId } = await params;
  const test = await getTest(testId);

  if (!test.ok) notFound();
  redirect(`/groups/${test.test.classId}/tests/${testId}/results`);
}
