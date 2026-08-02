import { getUser } from "@/app/(root)/_utils/getUser";
import { getClass } from "@/app/(root)/_utils/getClass";
import { getClassTests } from "@/app/(root)/_utils/getClassTests";
import { getTestFormats } from "@/app/(root)/_utils/getTestFormats";
import { DEFAULT_TEST_STATUS, TESTS_PAGE_SIZE } from "./_constants";
import TestsListView from "./_components/TestsListView";
import TestsStateView from "./_components/TestsStateView";

type PageProps = {
  params: Promise<{ classId: string }>;
};

/**
 * The authoring list for a class's tests (ADMIN + TEACHER).
 *
 * Students are sent to the access state rather than an empty list: they have no
 * test surface this pass, and every backend route here answers them 403. The
 * check below only decides which UI to draw — the backend remains the
 * authorization boundary.
 */
export default async function Page({ params }: PageProps) {
  const { classId } = await params;
  const user = await getUser();
  const viewerRole = user?.schoolRole ?? null;
  const backHref = `/groups/${classId}`;

  if (viewerRole !== "ADMIN" && viewerRole !== "TEACHER") {
    return (
      <TestsStateView
        reason="forbidden"
        backHref={backHref}
        backLabelKey="root.tests.list.backToClass"
      />
    );
  }

  const [classResult, formats, testsResult] = await Promise.all([
    getClass(classId),
    getTestFormats(),
    getClassTests(classId, {
      status: DEFAULT_TEST_STATUS,
      page: 1,
      limit: TESTS_PAGE_SIZE,
    }),
  ]);

  if (!classResult.ok) {
    return (
      <TestsStateView
        reason={classResult.reason}
        backHref={backHref}
        backLabelKey="root.tests.list.backToClass"
      />
    );
  }

  if (!testsResult.ok) {
    return (
      <TestsStateView
        reason={testsResult.reason}
        backHref={backHref}
        backLabelKey="root.tests.list.backToClass"
      />
    );
  }

  return (
    <TestsListView
      classId={classId}
      className={classResult.class.name}
      formats={formats?.formats ?? {}}
      initialTests={testsResult.data}
    />
  );
}
