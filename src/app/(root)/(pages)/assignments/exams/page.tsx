import "server-only";

import { getUser } from "@/app/(root)/_utils/getUser";
import { getLibraryTests } from "@/app/(root)/_utils/getLibraryTests";
import { BackendApiError } from "@/lib/api/backend";
import { listMyTestsRequest } from "@/app/exam/_lib/attempts.api";
import ResourceStateView from "@/app/(root)/_components/ResourceStateView";
import StaffAssignmentsView from "./_components/StaffAssignmentsView";
import StudentTestsView from "./_components/StudentTestsView";

/**
 * Assignments, from whichever side of them the viewer stands on.
 *
 * A student sees the tests set for them; a teacher or admin sees the tests
 * they have set. It is one route because it is one question — "what work is
 * outstanding between me and my classes" — asked from two directions, and
 * splitting it would put a second Assignments entry in the sidebar that only
 * ever applied to half the users.
 *
 * Both halves are server-rendered from a list whose rows already carry their
 * resolved state. For the student that resolution matters especially: only the
 * server knows what time it is, and a client comparing `availableUntil` to its
 * own clock would show a paper as open to a student whose laptop is running
 * slow. See `docs/features/test-taking-backend-handoff.md` §B.5.
 */
export default async function Page() {
  const user = await getUser();
  const role = user?.schoolRole;

  if (role === "ADMIN" || role === "TEACHER") {
    return <StaffAssignments />;
  }

  if (role !== "STUDENT") {
    return <AssignmentsState reason="forbidden" />;
  }

  // The fetch is resolved to data or a reason *before* any JSX exists. A
  // `return <View/>` inside a `try` would put rendering errors — which React
  // raises later, not here — into this catch, and they would be reported as a
  // failure to load.
  const result = await loadMyTests();

  if (!result.ok) {
    return <AssignmentsState reason={result.reason} />;
  }

  return <StudentTestsView tests={result.tests} />;
}

async function StaffAssignments() {
  // One page of the cross-class library, newest-touched first. Staff with more
  // tests than this reach the rest through the class they belong to, which is
  // where the paging and the authoring controls already live.
  const result = await getLibraryTests({ page: 1, limit: 100 });

  if (!result.ok) {
    return <AssignmentsState reason={result.reason} />;
  }

  return <StaffAssignmentsView tests={result.data.tests} />;
}

/** Every failure on this route lands in the same place, back to the dashboard. */
function AssignmentsState({
  reason,
}: {
  reason: "forbidden" | "notFound" | "error";
}) {
  return (
    <ResourceStateView
      reason={reason}
      namespace="root.exams"
      backHref="/dashboard"
      backLabelKey="root.exams.backToDashboard"
      retryLabelKey="root.tests.actions.retry"
    />
  );
}

async function loadMyTests() {
  try {
    const { tests } = await listMyTestsRequest({ page: 1, limit: 50 });
    return { ok: true as const, tests };
  } catch (error) {
    // 403 here means the account has no student membership in the selected
    // school — the same situation the role check catches for a stale session —
    // so it reads as the same state rather than as a failure.
    if (error instanceof BackendApiError && error.status === 403) {
      return { ok: false as const, reason: "forbidden" as const };
    }
    console.error("Failed to load student tests:", error);
    return { ok: false as const, reason: "error" as const };
  }
}
