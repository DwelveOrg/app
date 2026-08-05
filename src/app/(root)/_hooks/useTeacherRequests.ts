"use client";

import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  approveTeacherRequestAction,
  cancelTeacherRequestAction,
  getTeacherClassesAction,
  listTeacherRequestsAction,
  rejectTeacherRequestAction,
  requestToTeachAction,
} from "@/app/(root)/_lib/teacher-requests.actions";
import type {
  ApproveTeacherRequestInput,
  CancelTeacherRequestInput,
  RejectTeacherRequestInput,
  RequestToTeachInput,
} from "@/app/(root)/_lib/teacher-requests.schemas";
import { readSafeActionData } from "@/lib/actions/read-safe-action-result";
import { queryKeys } from "@/lib/query/keys";

const MUTATION_FALLBACK = "Something went wrong. Please try again.";

/* -------------------------------------------------------------------------- */
/* Reads                                                                       */
/* -------------------------------------------------------------------------- */

/**
 * The School page directory returns every active class in one shot (no server
 * pagination or search), so this is a plain query; the view filters locally.
 */
export function useTeacherClasses({
  schoolId,
  enabled = true,
}: {
  schoolId: string | undefined;
  enabled?: boolean;
}) {
  return useQuery({
    queryKey: queryKeys.enrollment.teacherClasses(schoolId ?? ""),
    queryFn: () => getTeacherClassesAction(schoolId as string),
    enabled: Boolean(schoolId) && enabled,
  });
}

/**
 * Pending requests to teach one class. Admin-only on the backend, so callers
 * that render for teachers too must pass `enabled: false` for them rather than
 * firing a request that can only come back 403.
 */
export function useTeacherRequests({
  classId,
  search,
  limit = 20,
  enabled = true,
}: {
  classId: string;
  search: string;
  limit?: number;
  enabled?: boolean;
}) {
  return useInfiniteQuery({
    queryKey: queryKeys.enrollment.teacherRequests(classId, { search, limit }),
    queryFn: ({ pageParam }) =>
      listTeacherRequestsAction({ classId, search, page: pageParam, limit }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.meta.hasMore ? lastPage.meta.page + 1 : undefined,
    enabled,
  });
}

/* -------------------------------------------------------------------------- */
/* Teacher mutations                                                           */
/* -------------------------------------------------------------------------- */

/** Refreshes the teacher class list after a request/cancel so the flags update. */
function useInvalidateTeacherClasses(schoolId: string | undefined) {
  const queryClient = useQueryClient();
  return () =>
    queryClient.invalidateQueries({
      queryKey: queryKeys.enrollment.teacherClassesAll(schoolId ?? ""),
    });
}

export function useRequestToTeachMutation(schoolId: string | undefined) {
  const invalidate = useInvalidateTeacherClasses(schoolId);
  return useMutation({
    mutationFn: async (input: RequestToTeachInput) =>
      readSafeActionData(await requestToTeachAction(input), MUTATION_FALLBACK),
    onSettled: invalidate,
  });
}

export function useCancelTeacherRequestMutation(schoolId: string | undefined) {
  const invalidate = useInvalidateTeacherClasses(schoolId);
  return useMutation({
    mutationFn: async (input: CancelTeacherRequestInput) =>
      readSafeActionData(await cancelTeacherRequestAction(input), MUTATION_FALLBACK),
    onSettled: invalidate,
  });
}

/* -------------------------------------------------------------------------- */
/* Admin mutations                                                             */
/* -------------------------------------------------------------------------- */

/**
 * After approve/reject, refresh the pending teacher-request list and every class
 * list. Approval assigns the teacher, so `GET /classes` must refetch — both the
 * teacher-visible list (under the `enrollment` key namespace, which also covers
 * the request list) and any class-detail React Query (under `classes`).
 */
function useInvalidateAfterReview() {
  const queryClient = useQueryClient();
  return () =>
    Promise.all([
      // `enrollment.all` is a prefix of the teacher-request and teacher-class keys.
      queryClient.invalidateQueries({ queryKey: queryKeys.enrollment.all }),
      queryClient.invalidateQueries({ queryKey: queryKeys.classes.all }),
    ]);
}

export function useApproveTeacherRequestMutation() {
  const invalidate = useInvalidateAfterReview();
  return useMutation({
    mutationFn: async (input: ApproveTeacherRequestInput) =>
      readSafeActionData(await approveTeacherRequestAction(input), MUTATION_FALLBACK),
    onSettled: invalidate,
  });
}

export function useRejectTeacherRequestMutation() {
  const invalidate = useInvalidateAfterReview();
  return useMutation({
    mutationFn: async (input: RejectTeacherRequestInput) =>
      readSafeActionData(await rejectTeacherRequestAction(input), MUTATION_FALLBACK),
    onSettled: invalidate,
  });
}
