"use client";

import { useInfiniteQuery, useMutation, useQuery } from "@tanstack/react-query";

import {
  addClassTeacherAction,
  listAssignableStudentsAction,
  listAssignableTeachersAction,
  listClassActivityAction,
  removeClassTeacherAction,
} from "@/app/(root)/_lib/class-roster-actions";
import {
  assignStudentAction,
  removeStudentAction,
} from "@/app/(root)/_lib/enrollment-actions";
import type {
  AddClassTeacherInput,
  RemoveClassTeacherInput,
} from "@/app/(root)/_lib/classes.schemas";
import type {
  AssignStudentInput,
  RemoveStudentInput,
} from "@/app/(root)/_lib/enrollment.schemas";
import { readSafeActionData } from "@/lib/actions/read-safe-action-result";
import { queryKeys } from "@/lib/query/keys";
import { POLL_ACTIVE_MS, pollingOptions } from "@/lib/query/polling";
import { useServerDataRefresh } from "@/lib/query/useServerDataRefresh";
import type { ClassActivityResponse } from "@/app/(root)/_lib/class-activity.schemas";

const MUTATION_FALLBACK = "Something went wrong. Please try again.";


export function useClassActivity({
  classId,
  limit = 12,
  enabled = true,
  initialData,
}: {
  classId: string;
  limit?: number;
  enabled?: boolean;
  initialData?: ClassActivityResponse;
}) {
  return useQuery({
    queryKey: queryKeys.classes.activity(classId, limit),
    queryFn: () => listClassActivityAction({ classId, limit }),
    initialData,
    staleTime: 30_000,
    ...pollingOptions(POLL_ACTIVE_MS),
    enabled,
  });
}

/* -------------------------------------------------------------------------- */
/* Pickers                                                                     */
/* -------------------------------------------------------------------------- */

type PickerOptions = {
  classId: string;
  search: string;
  limit?: number;
  /** Off until the dialog opens — the picker must not run on every class page. */
  enabled?: boolean;
};

/**
 * Candidate students for a class (`GET /classes/:classId/assignable-students`).
 * Search and pagination are server-side and class-scoped: an assigned teacher
 * gets their own class's candidates and nothing else.
 */
export function useAssignableStudents({
  classId,
  search,
  limit = 20,
  enabled = true,
}: PickerOptions) {
  return useInfiniteQuery({
    queryKey: queryKeys.classes.assignableStudents(classId, { search, limit }),
    queryFn: ({ pageParam }) =>
      listAssignableStudentsAction({ classId, search, page: pageParam, limit }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.meta.hasMore ? lastPage.meta.page + 1 : undefined,
    enabled,
  });
}

/** Candidate teachers for a class. Admin-only on the backend. */
export function useAssignableTeachers({
  classId,
  search,
  limit = 20,
  enabled = true,
}: PickerOptions) {
  return useInfiniteQuery({
    queryKey: queryKeys.classes.assignableTeachers(classId, { search, limit }),
    queryFn: ({ pageParam }) =>
      listAssignableTeachersAction({ classId, search, page: pageParam, limit }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.meta.hasMore ? lastPage.meta.page + 1 : undefined,
    enabled,
  });
}

/* -------------------------------------------------------------------------- */
/* Roster mutations                                                            */
/* -------------------------------------------------------------------------- */

/**
 * A roster change moves someone between two lists the user can see at once, so
 * both must refetch: the class itself (detail and lists) and the pickers, which
 * exclude whoever is already assigned. The rendered roster and its counts come
 * from the server, so `useServerDataRefresh` re-runs that render too — a picker
 * that drops a name while the roster beside it still omits them reads as a
 * failed add.
 */
function useInvalidateClassRoster(classId: string) {
  const refresh = useServerDataRefresh();
  return () =>
    refresh(
      queryKeys.classes.all,
      // Approving or directly assigning a student clears them from the request
      // queue, and both class lists carry roster counts.
      queryKeys.enrollment.all,
      queryKeys.classes.assignableStudentsAll(classId),
      queryKeys.classes.assignableTeachersAll(classId),
    );
}

export function useAddClassStudentMutation(classId: string) {
  const invalidate = useInvalidateClassRoster(classId);
  return useMutation({
    mutationFn: async (input: AssignStudentInput) =>
      readSafeActionData(await assignStudentAction(input), MUTATION_FALLBACK),
    onSettled: invalidate,
  });
}

export function useRemoveClassStudentMutation(classId: string) {
  const invalidate = useInvalidateClassRoster(classId);
  return useMutation({
    mutationFn: async (input: RemoveStudentInput) =>
      readSafeActionData(await removeStudentAction(input), MUTATION_FALLBACK),
    onSettled: invalidate,
  });
}

export function useAddClassTeacherMutation(classId: string) {
  const invalidate = useInvalidateClassRoster(classId);
  return useMutation({
    mutationFn: async (input: AddClassTeacherInput) =>
      readSafeActionData(await addClassTeacherAction(input), MUTATION_FALLBACK),
    onSettled: invalidate,
  });
}

export function useRemoveClassTeacherMutation(classId: string) {
  const invalidate = useInvalidateClassRoster(classId);
  return useMutation({
    mutationFn: async (input: RemoveClassTeacherInput) =>
      readSafeActionData(await removeClassTeacherAction(input), MUTATION_FALLBACK),
    onSettled: invalidate,
  });
}
