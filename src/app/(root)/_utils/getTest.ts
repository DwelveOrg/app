import "server-only";

import { authedBackendJson } from "@/app/(authentication)/_lib/backend";
import { BackendApiError } from "@/lib/api/backend";
import { getTestRequest } from "../_lib/tests.api";
import type { ApiTestDetail } from "../_lib/tests.schemas";
import type { TestsFetchFailure } from "./getClassTests";

export type TestFetchResult =
  | { ok: true; test: ApiTestDetail }
  | { ok: false; reason: TestsFetchFailure };

/**
 * Fetches one test with its whole tree and answer key (`GET /tests/:testId`).
 *
 * The backend answers 404 — never 403 — when a teacher asks for a test they did
 * not author, so that a test id cannot be probed. Both land on the not-found
 * state, which is the intended, indistinguishable outcome.
 */
export async function getTest(testId: string): Promise<TestFetchResult> {
  try {
    const { test } = await getTestRequest(testId, authedBackendJson);
    return { ok: true, test };
  } catch (error) {
    if (error instanceof BackendApiError) {
      if (error.status === 403) return { ok: false, reason: "forbidden" };
      if (error.status === 404) return { ok: false, reason: "notFound" };
    }
    console.error("Failed to load test:", error);
    return { ok: false, reason: "error" };
  }
}
