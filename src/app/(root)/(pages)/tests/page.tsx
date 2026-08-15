import { getUser } from "@/app/(root)/_utils/getUser";
import { getClasses } from "@/app/(root)/_utils/getClasses";
import { getLibraryTests } from "@/app/(root)/_utils/getLibraryTests";
import { getTestFormats } from "@/app/(root)/_utils/getTestFormats";
import {
  DEFAULT_TEST_STATUS,
  TESTS_PAGE_SIZE,
} from "@/app/(root)/_constants/tests";
import ResourceStateView from "@/app/(root)/_components/ResourceStateView";
import TestLibraryView from "./_components/TestLibraryView";

export default async function Page() {
  const user = await getUser();
  const viewerRole = user?.schoolRole ?? null;

  if (viewerRole !== "ADMIN" && viewerRole !== "TEACHER") {
    return (
      <ResourceStateView
        reason="forbidden"
        namespace="root.tests"
        backHref="/dashboard"
        backLabelKey="root.tests.library.backToDashboard"
        retryLabelKey="root.tests.actions.retry"
      />
    );
  }

  const [libraryResult, formats, classes] = await Promise.all([
    getLibraryTests({
      status: DEFAULT_TEST_STATUS,
      page: 1,
      limit: TESTS_PAGE_SIZE,
    }),
    getTestFormats(),
    getClasses(),
  ]);

  if (!libraryResult.ok) {
    return (
      <ResourceStateView
        reason={libraryResult.reason}
        namespace="root.tests"
        backHref="/dashboard"
        backLabelKey="root.tests.library.backToDashboard"
        retryLabelKey="root.tests.actions.retry"
      />
    );
  }

  return (
    <TestLibraryView
      formats={formats?.formats ?? {}}
      initialTests={libraryResult.data}
      classes={classes.map((item) => ({ id: item.id, name: item.name }))}
    />
  );
}
