import "server-only";

import { getUser } from "@/app/(root)/_utils/getUser";
import { BackendApiError } from "@/lib/api/backend";
import { listMyTestsRequest } from "@/app/exam/_lib/attempts.api";
import ResourceStateView from "@/app/(root)/_components/ResourceStateView";
import StudentTestsView from "./_components/StudentTestsView";

/**
 * A student's tests.
 *
 * Server-rendered from `GET /me/tests`, whose rows already carry the resolved
 * state — open, in progress, closed, out of attempts. That resolution belongs
 * to the server: it is the only party that knows what time it is, and a client
 * comparing `availableUntil` to its own clock would show a paper as open to a
 * student whose laptop is running slow. See
 * `docs/features/test-taking-backend-handoff.md` §B.5.
 */
export default async function Page() {
  const user = await getUser();

  if (user?.schoolRole !== "STUDENT") {
    return (
      <ResourceStateView
        reason="forbidden"
        namespace="root.exams"
        backHref="/dashboard"
        backLabelKey="root.exams.backToDashboard"
        retryLabelKey="root.tests.actions.retry"
      />
    );
  }

  // The fetch is resolved to data or a reason *before* any JSX exists. A
  // `return <View/>` inside a `try` would put rendering errors — which React
  // raises later, not here — into this catch, and they would be reported as a
  // failure to load.
  const result = await loadMyTests();

  if (!result.ok) {
    return (
      <ResourceStateView
        reason={result.reason}
        namespace="root.exams"
        backHref="/dashboard"
        backLabelKey="root.exams.backToDashboard"
        retryLabelKey="root.tests.actions.retry"
      />
    );
  }

  return <StudentTestsView tests={result.tests} />;
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
