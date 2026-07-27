"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { acceptTeacherInviteAction } from "@/app/(authentication)/_lib/actions";
import type { AcceptTeacherInviteInput } from "@/app/(authentication)/_types/_schemas";
import { readSafeActionData } from "@/lib/actions/read-safe-action-result";
import { queryKeys } from "@/lib/query/keys";

/**
 * Redeems a teacher invite token for the signed-in user. The server action
 * grants a TEACHER membership and rewrites the session with the new school
 * context (this works even for an account that previously left the school as a
 * student — the invite reactivates it as a new selected-school session). On
 * success we refresh the profile/school caches plus the class/enrollment caches
 * so the new school's classes load under the teacher role.
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
        queryClient.invalidateQueries({ queryKey: queryKeys.classes.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.enrollment.all }),
      ]);
    },
  });
}
