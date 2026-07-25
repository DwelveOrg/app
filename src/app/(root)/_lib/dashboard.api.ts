import "server-only";

import type { z } from "zod";

import type { BackendRequestInit } from "@/lib/api/backend";
import { authedBackendJson } from "@/app/(authentication)/_lib/backend";
import {
  dashboardFeedSchema,
  distributionsSchema,
  scoreTrendSchema,
  staffDashboardSummarySchema,
  studentDashboardSummarySchema,
  submissionsSchema,
} from "./dashboard.schemas";

/**
 * Named endpoint functions for the dashboard aggregate API. Every call goes
 * through `authedBackendJson` (attaches the session bearer token) and validates
 * the response with a Zod schema, per `docs/architecture/ARCHITECTURE.md`. All
 * endpoints are role-scoped and guarded by the backend `SchoolGuard`, so they
 * must only be called for a member with an active school context.
 */

type BackendRequester = <TSchema extends z.ZodTypeAny>(
  path: string,
  init: BackendRequestInit<TSchema>,
) => Promise<z.infer<TSchema>>;

/** `GET /dashboard/summary` — ADMIN / TEACHER shape. */
export function getStaffDashboardSummaryRequest(
  requestJson: BackendRequester = authedBackendJson,
) {
  return requestJson("/dashboard/summary", {
    responseSchema: staffDashboardSummarySchema,
  });
}

/** `GET /dashboard/summary` — STUDENT shape. */
export function getStudentDashboardSummaryRequest(
  requestJson: BackendRequester = authedBackendJson,
) {
  return requestJson("/dashboard/summary", {
    responseSchema: studentDashboardSummarySchema,
  });
}

/** `GET /dashboard/score-trend?months=N` (backend defaults to 6). */
export function getScoreTrendRequest(
  months = 6,
  requestJson: BackendRequester = authedBackendJson,
) {
  return requestJson(`/dashboard/score-trend?months=${months}`, {
    responseSchema: scoreTrendSchema,
  });
}

/** `GET /dashboard/distributions`. */
export function getDistributionsRequest(
  requestJson: BackendRequester = authedBackendJson,
) {
  return requestJson("/dashboard/distributions", {
    responseSchema: distributionsSchema,
  });
}

/**
 * `GET /dashboard/submissions?range=week`. Returns an empty `byClass` today
 * (the data model has no submission timestamps yet).
 */
export function getSubmissionsRequest(
  range: "week" = "week",
  requestJson: BackendRequester = authedBackendJson,
) {
  return requestJson(`/dashboard/submissions?range=${range}`, {
    responseSchema: submissionsSchema,
  });
}

/** `GET /dashboard/feed` — upcoming exams + recent notifications. */
export function getDashboardFeedRequest(
  requestJson: BackendRequester = authedBackendJson,
) {
  return requestJson("/dashboard/feed", {
    responseSchema: dashboardFeedSchema,
  });
}
