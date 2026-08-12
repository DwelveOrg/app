"use client";

import { useInfiniteQuery, useMutation, useQuery } from "@tanstack/react-query";

import {
  approveEnrollmentAction,
  cancelJoinRequestAction,
  getStudentClassesAction,
  getStudentOverviewAction,
  leaveClassAction,
  listClassJoinRequestsAction,
  listMyClassRequestsAction,
  rejectEnrollmentAction,
  requestJoinClassAction,
} from "@/app/(root)/_lib/enrollment-actions";
import type {
  ApproveEnrollmentInput,
  CancelJoinRequestInput,
  LeaveClassInput,
  RejectEnrollmentInput,
  RequestJoinClassInput,
} from "@/app/(root)/_lib/enrollment.schemas";
import { readSafeActionData } from "@/lib/actions/read-safe-action-result";
import { queryKeys } from "@/lib/query/keys";
import {
  POLL_ACTIVE_MS,
  POLL_AMBIENT_MS,
  pollingOptions,
} from "@/lib/query/polling";
import { useServerDataRefresh } from "@/lib/query/useServerDataRefresh";

const MUTATION_FALLBACK = "Something went wrong. Please try again.";

/* -------------------------------------------------------------------------- */
/* Reads                                                                       */
/* -------------------------------------------------------------------------- */

export function useStudentOverview(schoolId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.enrollment.overview(schoolId ?? ""),
    queryFn: () => getStudentOverviewAction(schoolId as string),
    enabled: Boolean(schoolId),
  });
}

/**
 * The School page directory (`GET /schools/:schoolId/classes`). It returns
 * active and requestable classes with the backend's access flags. My Classes is
 * intentionally sourced separately from `GET /classes`.
 */
export function useStudentClasses({
  schoolId,
  enabled = true,
}: {
  schoolId: string | undefined;
  enabled?: boolean;
}) {
  // The school directory is returned in one shot (no server pagination/search),
  // so this is a plain query and the view filters locally.
  return useQuery({
    queryKey: queryKeys.enrollment.studentClasses(schoolId ?? ""),
    queryFn: () => getStudentClassesAction(schoolId as string),
    enabled: Boolean(schoolId) && enabled,
  });
}

/**
 * A student's own pending requests.
 *
 * Polled at the ambient rate rather than the active one: the change a student
 * is waiting for here is someone else approving them, which is a decision made
 * on a human timescale. A minute late is indistinguishable from instant.
 */
export function useMyClassRequests({ limit = 20 }: { limit?: number } = {}) {
  return useInfiniteQuery({
    queryKey: queryKeys.enrollment.myRequests(limit),
    queryFn: ({ pageParam }) => listMyClassRequestsAction({ page: pageParam, limit }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.meta.hasMore ? lastPage.meta.page + 1 : undefined,
    ...pollingOptions(POLL_AMBIENT_MS),
  });
}

/**
 * The pending student join requests for one class.
 *
 * Polled, because this is the queue the stale-data complaint was about: a
 * student requests to join and the admin looking straight at the queue is the
 * last person to find out. Three components mount this — the header count
 * button, the panel's tab counts, and the list itself — and they share a query
 * key, so a tick is one request that updates all three at once.
 */
export function useClassJoinRequests({
  classId,
  search,
  limit = 20,
}: {
  classId: string;
  search: string;
  limit?: number;
}) {
  return useInfiniteQuery({
    queryKey: queryKeys.enrollment.classRequests(classId, { search, limit }),
    queryFn: ({ pageParam }) =>
      listClassJoinRequestsAction({ classId, search, page: pageParam, limit }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.meta.hasMore ? lastPage.meta.page + 1 : undefined,
    ...pollingOptions(POLL_ACTIVE_MS),
  });
}

/* -------------------------------------------------------------------------- */
/* Student mutations                                                           */
/* -------------------------------------------------------------------------- */

/**
 * Refreshes every student-facing enrollment surface after a request/cancel
 * (see the Cache Refresh Rules in the feature doc): overview counts, the class
 * directory, pending requests, and the dashboard class list — plus the server
 * render, because the counts in the page header come from it.
 */
function useInvalidateStudentEnrollment(schoolId: string | undefined) {
  const refresh = useServerDataRefresh();
  return () =>
    refresh(
      queryKeys.enrollment.overview(schoolId ?? ""),
      queryKeys.enrollment.studentClassesAll(schoolId ?? ""),
      queryKeys.enrollment.myRequestsAll(),
      queryKeys.enrollment.myClasses(),
    );
}

export function useRequestJoinClassMutation(schoolId: string | undefined) {
  const invalidate = useInvalidateStudentEnrollment(schoolId);
  return useMutation({
    mutationFn: async (input: RequestJoinClassInput) =>
      readSafeActionData(await requestJoinClassAction(input), MUTATION_FALLBACK),
    onSettled: invalidate,
  });
}

export function useCancelJoinRequestMutation(schoolId: string | undefined) {
  const invalidate = useInvalidateStudentEnrollment(schoolId);
  return useMutation({
    mutationFn: async (input: CancelJoinRequestInput) =>
      readSafeActionData(await cancelJoinRequestAction(input), MUTATION_FALLBACK),
    onSettled: invalidate,
  });
}

/**
 * A student leaving a class moves the same four surfaces a request/cancel does —
 * the class drops out of My Classes, its directory row becomes requestable
 * again, and the overview counts shift — plus the class detail, which the leaver
 * can no longer open. `queryKeys.classes.all` covers that last one.
 */
export function useLeaveClassMutation(schoolId: string | undefined) {
  const refresh = useServerDataRefresh();
  const invalidateStudentSurfaces = useInvalidateStudentEnrollment(schoolId);
  return useMutation({
    mutationFn: async (input: LeaveClassInput) =>
      readSafeActionData(await leaveClassAction(input), MUTATION_FALLBACK),
    onSettled: () =>
      Promise.all([
        invalidateStudentSurfaces(),
        refresh(queryKeys.classes.all),
      ]),
  });
}

/* -------------------------------------------------------------------------- */
/* Teacher / admin mutations                                                   */
/* -------------------------------------------------------------------------- */

/**
 * Approving a request adds the student to the roster, so a review refreshes the
 * pending-requests list *and* every class query *and* the server render — the
 * class page shows all three, and a stale roster next to a cleared request reads
 * as a failed approval.
 */
function useInvalidateClassRequests(classId: string) {
  const refresh = useServerDataRefresh();
  return () =>
    refresh(queryKeys.enrollment.classRequestsAll(classId), queryKeys.classes.all);
}

export function useApproveEnrollmentMutation(classId: string) {
  const invalidate = useInvalidateClassRequests(classId);
  return useMutation({
    mutationFn: async (input: ApproveEnrollmentInput) =>
      readSafeActionData(await approveEnrollmentAction(input), MUTATION_FALLBACK),
    onSettled: invalidate,
  });
}

export function useRejectEnrollmentMutation(classId: string) {
  const invalidate = useInvalidateClassRequests(classId);
  return useMutation({
    mutationFn: async (input: RejectEnrollmentInput) =>
      readSafeActionData(await rejectEnrollmentAction(input), MUTATION_FALLBACK),
    onSettled: invalidate,
  });
}

// Direct roster changes (add/remove a student or teacher) live in
// `useClassRoster.ts` with the class-scoped member pickers they feed, so one
// place owns which queries a roster change invalidates.
