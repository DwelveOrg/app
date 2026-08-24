"use client";

import { useMutation } from "@tanstack/react-query";

import { inviteTeacherAction } from "@/app/(root)/_lib/school-actions";
import type { InviteTeacherInput } from "@/app/(root)/_lib/actions.schemas";
import { readSafeActionData } from "@/lib/actions/read-safe-action-result";
import { useInvalidateSchoolDirectory } from "./useSchoolDirectory";

export function useInviteTeacherMutation() {
  const invalidate = useInvalidateSchoolDirectory();
  return useMutation({
    mutationFn: async (input: InviteTeacherInput) => {
      const result = await inviteTeacherAction(input);
      return readSafeActionData(result, "Could not create the invite. Please try again.");
    },
    onSuccess: invalidate,
  });
}
