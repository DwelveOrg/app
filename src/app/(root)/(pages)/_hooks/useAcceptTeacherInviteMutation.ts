"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { acceptTeacherInviteAction } from "@/app/(authentication)/_lib/actions";
import type { AcceptTeacherInviteInput } from "@/app/(authentication)/_types/_schemas";
import { readSafeActionData } from "@/lib/actions/read-safe-action-result";
import { queryKeys } from "@/lib/query/keys";

/**
 * Redeems a teacher invite token for the signed-in user. The server action
 * grants a TEACHER membership and rewrites the session with the new school
 * context, so on success we invalidate the auth/dashboard/schools caches the
 * same way {@link useJoinSchoolMutation} does.
 */
export function useAcceptTeacherInviteMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: AcceptTeacherInviteInput) => {
      const result = await acceptTeacherInviteAction(input);
      return readSafeActionData(
        result,
        "This invite link is invalid or has expired.",
      );
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.auth.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.schools.all }),
      ]);
    },
  });
}
