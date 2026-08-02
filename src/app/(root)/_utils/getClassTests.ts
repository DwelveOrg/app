import "server-only";

import { authedBackendJson } from "@/app/(authentication)/_lib/backend";
import { BackendApiError } from "@/lib/api/backend";
import { listClassTestsRequest } from "../_lib/tests.api";
import type { TestsListResponse } from "../_lib/tests.schemas";

/** Why the test list could not be shown, so each case gets its own UI state. */
export type TestsFetchFailure = "forbidden" | "notFound" | "error";

export type ClassTestsResult =
  | { ok: true; data: TestsListResponse }
  | { ok: false; reason: TestsFetchFailure };

/**
 * Fetches the first page of a class's tests (`GET /classes/:classId/tests`).
 * The backend answers 403 for students (who have no test surface this pass) and
 * for teachers who do not teach the class, and 404 when the class is invisible
 * to the caller, so the two are kept apart: the page shows an access state for
 * 403 and a not-found state for 404. Anything else is retryable.
 */
export async function getClassTests(
  classId: string,
  query: { status?: string; page?: number; limit?: number } = {},
): Promise<ClassTestsResult> {
  try {
    const data = await listClassTestsRequest(classId, query, authedBackendJson);
    return { ok: true, data };
  } catch (error) {
    if (error instanceof BackendApiError) {
      if (error.status === 403) return { ok: false, reason: "forbidden" };
      if (error.status === 404) return { ok: false, reason: "notFound" };
    }
    console.error("Failed to load class tests:", error);
    return { ok: false, reason: "error" };
  }
}
