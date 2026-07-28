"use client";

import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  approveEnrollmentAction,
  assignStudentAction,
  cancelJoinRequestAction,
  getStudentClassesAction,
  getStudentOverviewAction,
  listClassJoinRequestsAction,
  listMyClassRequestsAction,
  rejectEnrollmentAction,
  removeStudentAction,
  requestJoinClassAction,
} from "@/app/(root)/_lib/enrollment-actions";
import type {
  ApproveEnrollmentInput,
  AssignStudentInput,
  CancelJoinRequestInput,
  RejectEnrollmentInput,
  RemoveStudentInput,
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
 * The single student class directory (`GET /classes`). It returns every active
 * class in the selected school with the backend's own access flags, so it backs
 * both "my classes" and "classes I could join" — there is no separate discover
 * surface or endpoint.
 */
export function useStudentClasses({
  schoolId,
  enabled = true,
}: {
  schoolId: string | undefined;
  enabled?: boolean;
}) {
  // `GET /classes` returns the whole student class list in one shot (no server
  // pagination or search), so this is a plain query; the view filters locally.
  return useQuery({
    queryKey: queryKeys.enrollment.studentClasses(schoolId ?? ""),
    queryFn: () => getStudentClassesAction(),
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

/** Invalidates the pending-requests list for a class after approve/reject. */
function useInvalidateClassRequests(classId: string) {
  const queryClient = useQueryClient();
  return () =>
    queryClient.invalidateQueries({
      queryKey: queryKeys.enrollment.classRequestsAll(classId),
    });
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

export function useAssignStudentMutation() {
  return useMutation({
    mutationFn: async (input: AssignStudentInput) =>
      readSafeActionData(await assignStudentAction(input), MUTATION_FALLBACK),
  });
}

export function useRemoveStudentMutation() {
  return useMutation({
    mutationFn: async (input: RemoveStudentInput) =>
      readSafeActionData(await removeStudentAction(input), MUTATION_FALLBACK),
  });
}
