import "server-only";

import { BackendApiError } from "@/lib/api/backend";
import {
  getAttemptRequest,
  getAttemptResultRequest,
  getTakerOverviewRequest,
} from "./attempts.api";
import type {
  AttemptResponse,
  AttemptResultResponse,
  TakerOverviewResponse,
} from "./attempts.schemas";

/**
 * Server-side reads for the exam room, each returning a discriminated result
 * rather than throwing.
 *
 * A page that throws renders the error boundary, which for a student halfway
 * through an exam is a full-page "Something went wrong" with a Retry button and
 * no indication of whether their answers survived. These reasons let each page
 * say the true thing instead: the window has closed, this is not your attempt,
 * the paper is already submitted.
 */
export type ExamFetchFailure = "forbidden" | "notFound" | "closed" | "error";

export type ExamResult<T> = { ok: true; data: T } | { ok: false; reason: ExamFetchFailure };

async function read<T>(load: () => Promise<T>, label: string): Promise<ExamResult<T>> {
  try {
    return { ok: true, data: await load() };
  } catch (error) {
    if (error instanceof BackendApiError) {
      if (error.status === 403) return { ok: false, reason: "forbidden" };
      if (error.status === 404) return { ok: false, reason: "notFound" };
      // 409 on an attempt route means it is no longer live — submitted, expired,
      // or ended by an integrity rule. All three send the student to the result.
      if (error.status === 409) return { ok: false, reason: "closed" };
    }
    console.error(`Failed to load ${label}:`, error);
    return { ok: false, reason: "error" };
  }
}

export function getTakerOverview(testId: string): Promise<ExamResult<TakerOverviewResponse>> {
  return read(() => getTakerOverviewRequest(testId), "test cover");
}

export function getAttempt(attemptId: string): Promise<ExamResult<AttemptResponse>> {
  return read(() => getAttemptRequest(attemptId), "attempt");
}

export function getAttemptResult(
  attemptId: string,
): Promise<ExamResult<AttemptResultResponse>> {
  return read(() => getAttemptResultRequest(attemptId), "attempt result");
}
