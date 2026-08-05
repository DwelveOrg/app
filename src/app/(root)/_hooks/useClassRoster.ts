"use client";

import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import {
  addClassTeacherAction,
  listAssignableStudentsAction,
  listAssignableTeachersAction,
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

const MUTATION_FALLBACK = "Something went wrong. Please try again.";

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
 * exclude whoever is already assigned. The class page is server-rendered, so
 * callers additionally `router.refresh()` — see `useRefreshClassData`.
 */
function useInvalidateClassRoster(classId: string) {
  const queryClient = useQueryClient();
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.classes.all }),
      // Approving or directly assigning a student clears them from the request
      // queue, and both class lists carry roster counts.
      queryClient.invalidateQueries({ queryKey: queryKeys.enrollment.all }),
      queryClient.invalidateQueries({
        queryKey: queryKeys.classes.assignableStudentsAll(classId),
      }),
      queryClient.invalidateQueries({
        queryKey: queryKeys.classes.assignableTeachersAll(classId),
      }),
    ]);
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
