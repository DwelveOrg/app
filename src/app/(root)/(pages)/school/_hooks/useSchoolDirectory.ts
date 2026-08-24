"use client";

import { useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import {
  getSchoolBlocklistAction,
  getSchoolMembersAction,
  getSchoolStudentsAction,
  getTeacherInvitesAction,
} from "@/app/(root)/_lib/school-directory-actions";
import { queryKeys } from "@/lib/query/keys";
import { useServerDataRefresh } from "@/lib/query/useServerDataRefresh";

/** School rosters change on human timescales, not while a dialog is open. */
const DIRECTORY_STALE_MS = 60_000;

export function useSchoolMembersQuery(schoolId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.schools.members(schoolId ?? ""),
    queryFn: () => getSchoolMembersAction(schoolId as string),
    enabled: Boolean(schoolId),
    staleTime: DIRECTORY_STALE_MS,
  });
}

export function useSchoolStudentsQuery(schoolId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.schools.students(schoolId ?? ""),
    queryFn: getSchoolStudentsAction,
    enabled: Boolean(schoolId),
    staleTime: DIRECTORY_STALE_MS,
  });
}

export function useTeacherInvitesQuery(
  schoolId: string | undefined,
  enabled = true,
) {
  return useQuery({
    queryKey: queryKeys.schools.teacherInvites(schoolId ?? ""),
    queryFn: () => getTeacherInvitesAction(schoolId as string),
    enabled: Boolean(schoolId) && enabled,
    staleTime: DIRECTORY_STALE_MS,
  });
}

export function useSchoolBlocklistQuery(
  schoolId: string | undefined,
  enabled = true,
) {
  return useQuery({
    queryKey: queryKeys.schools.blocklist(schoolId ?? ""),
    queryFn: () => getSchoolBlocklistAction(schoolId as string),
    enabled: Boolean(schoolId) && enabled,
    staleTime: DIRECTORY_STALE_MS,
  });
}

/** Re-read whichever lazy school panels are currently mounted. */
export function useInvalidateSchoolDirectory() {
  const queryClient = useQueryClient();

  return useCallback(
    () =>
      queryClient.invalidateQueries({
        queryKey: queryKeys.schools.directoryAll(),
      }),
    [queryClient],
  );
}

/**
 * Re-read lazy panels and server-rendered school counts after membership changes.
 */
export function useRefreshSchoolDirectory() {
  const refresh = useServerDataRefresh();
  return useCallback(
    () => refresh(queryKeys.schools.directoryAll()),
    [refresh],
  );
}
