"use client";

import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  approveEnrollmentAction,
  cancelJoinRequestAction,
  getStudentClassesAction,
  getStudentOverviewAction,
  listClassJoinRequestsAction,
  listMyClassRequestsAction,
  rejectEnrollmentAction,
  requestJoinClassAction,
} from "@/app/(root)/_lib/enrollment-actions";
import type {
  ApproveEnrollmentInput,
  CancelJoinRequestInput,
  RejectEnrollmentInput,
  RequestJoinClassInput,
} from "@/app/(root)/_lib/enrollment.schemas";
import { readSafeActionData } from "@/lib/actions/read-safe-action-result";
import { queryKeys } from "@/lib/query/keys";

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

export function useMyClassRequests({ limit = 20 }: { limit?: number } = {}) {
  return useInfiniteQuery({
    queryKey: queryKeys.enrollment.myRequests(limit),
    queryFn: ({ pageParam }) => listMyClassRequestsAction({ page: pageParam, limit }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.meta.hasMore ? lastPage.meta.page + 1 : undefined,
  });
}

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
  });
}

/* -------------------------------------------------------------------------- */
/* Student mutations                                                           */
/* -------------------------------------------------------------------------- */

/**
 * Refreshes every student-facing enrollment surface after a request/cancel
 * (see the Cache Refresh Rules in the feature doc): overview counts, the class
 * directory, pending requests, and the dashboard class list.
 */
function useInvalidateStudentEnrollment(schoolId: string | undefined) {
  const queryClient = useQueryClient();
  return () =>
    Promise.all([
      queryClient.invalidateQueries({
        queryKey: queryKeys.enrollment.overview(schoolId ?? ""),
      }),
      queryClient.invalidateQueries({
        queryKey: queryKeys.enrollment.studentClassesAll(schoolId ?? ""),
      }),
      queryClient.invalidateQueries({ queryKey: queryKeys.enrollment.myRequestsAll() }),
      queryClient.invalidateQueries({ queryKey: queryKeys.enrollment.myClasses() }),
    ]);
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

/* -------------------------------------------------------------------------- */
/* Teacher / admin mutations                                                   */
/* -------------------------------------------------------------------------- */

/**
 * Approving a request adds the student to the roster, so a review refreshes the
 * pending-requests list *and* every class query — the class page shows both, and
 * a stale roster next to a cleared request reads as a failed approval.
 */
function useInvalidateClassRequests(classId: string) {
  const queryClient = useQueryClient();
  return () =>
    Promise.all([
      queryClient.invalidateQueries({
        queryKey: queryKeys.enrollment.classRequestsAll(classId),
      }),
      queryClient.invalidateQueries({ queryKey: queryKeys.classes.all }),
    ]);
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
