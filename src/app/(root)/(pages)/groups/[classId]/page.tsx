import { getUser } from "../../../_utils/getUser";
import { getClass } from "../../../_utils/getClass";
import { getMyClassTests } from "../../../_utils/getMyClassTests";
import { getTestFormats } from "../../../_utils/getTestFormats";
import { getClassTests } from "../../../_utils/getClassTests";
import { getClassActivity } from "../../../_utils/getClassActivity";
import ClassDetailView from "./_components/ClassDetailView";
import ResourceStateView from "@/app/(root)/_components/ResourceStateView";
import {
  DEFAULT_TEST_STATUS,
  TESTS_PAGE_SIZE,
} from "@/app/(root)/_constants/tests";

type PageProps = {
  params: Promise<{ classId: string }>;
};

export default async function Page({ params }: PageProps) {
  const { classId } = await params;
  const [user, result] = await Promise.all([getUser(), getClass(classId)]);
  if (!result.ok) {
    return (
      <ResourceStateView
        reason={result.reason}
        namespace="root.classDetail"
        backHref="/groups"
        backLabelKey="root.classDetail.back"
        retryLabelKey="root.classDetail.states.retry"
        actionLabelKey="root.classDetail.states.backToClasses"
      />
    );
  }

  const viewerRole = user?.schoolRole ?? null;
  const isStudent = viewerRole === "STUDENT";
  const isStaff = viewerRole === "ADMIN" || viewerRole === "TEACHER";

  const [myTests, formats, initialTestsResult, initialActivity] = await Promise.all([
    isStudent ? getMyClassTests(classId) : Promise.resolve([]),
    isStudent ? Promise.resolve(null) : getTestFormats(),
    isStudent
      ? Promise.resolve(null)
      : getClassTests(classId, {
          status: DEFAULT_TEST_STATUS,
          page: 1,
          limit: TESTS_PAGE_SIZE,
        }),
    isStaff ? getClassActivity(classId) : Promise.resolve(undefined),
  ]);

  return (
    <ClassDetailView
      classItem={result.class}
      isAdmin={viewerRole === "ADMIN"}
      viewerRole={viewerRole}
      schoolId={user?.schoolId}
      myTests={myTests}
      formats={formats?.formats ?? {}}
      initialTests={
        initialTestsResult?.ok ? initialTestsResult.data : undefined
      }
      initialActivity={initialActivity}
    />
  );
}
