import { notFound, redirect } from "next/navigation";

import { getTest } from "@/app/(root)/_utils/getTest";

type PageProps = { params: Promise<{ testId: string; attemptId: string }> };

/**
 * The same class-agnostic redirect, for one student's paper. This is the target
 * a `TEST_SUBMITTED` notification resolves to when its payload carries no
 * `classId` — see `_lib/notifications.ts`.
 */
export default async function Page({ params }: PageProps) {
  const { testId, attemptId } = await params;
  const test = await getTest(testId);

  if (!test.ok) notFound();
  redirect(`/groups/${test.test.classId}/tests/${testId}/results/${attemptId}`);
}
