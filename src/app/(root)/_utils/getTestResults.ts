import "server-only";

import { BackendApiError } from "@/lib/api/backend";
import {
  getAttemptReviewRequest,
  getTestStatisticsRequest,
  listTestResultsRequest,
} from "../_lib/test-results.api";
import type {
  AttemptReviewResponse,
  TestResultsResponse,
  TestStatisticsResponse,
} from "../_lib/test-results.schemas";

/** Why the results could not be shown, so each case gets its own UI state. */
export type ResultsFetchFailure = "forbidden" | "notFound" | "error";

export type ResultsFetch<T> =
  | { ok: true; data: T }
  | { ok: false; reason: ResultsFetchFailure };

async function read<T>(load: () => Promise<T>, label: string): Promise<ResultsFetch<T>> {
  try {
    return { ok: true, data: await load() };
  } catch (error) {
    if (error instanceof BackendApiError) {
      if (error.status === 403) return { ok: false, reason: "forbidden" };
      if (error.status === 404) return { ok: false, reason: "notFound" };
    }
    console.error(`Failed to load ${label}:`, error);
    return { ok: false, reason: "error" };
  }
}

export function getTestResults(
  testId: string,
  query: { status?: string; page?: number; limit?: number } = {},
): Promise<ResultsFetch<TestResultsResponse>> {
  return read(() => listTestResultsRequest(testId, query), "test results");
}

/**
 * Statistics are fetched alongside the roster but failure is **not** fatal: a
 * class that has not sat the test yet still has a roster worth showing, and an
 * analytics endpoint that is slow or missing must not take the page down with
 * it. The caller renders `null` as "no analysis yet".
 */
export async function getTestStatistics(
  testId: string,
): Promise<TestStatisticsResponse | null> {
  const result = await read(() => getTestStatisticsRequest(testId), "test statistics");
  return result.ok ? result.data : null;
}

export function getAttemptReview(
  attemptId: string,
): Promise<ResultsFetch<AttemptReviewResponse>> {
  return read(() => getAttemptReviewRequest(attemptId), "attempt review");
}
