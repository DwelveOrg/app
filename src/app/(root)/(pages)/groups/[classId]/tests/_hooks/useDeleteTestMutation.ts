"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { deleteTestAction } from "@/app/(root)/_lib/test-actions";
import type { TestIdInput } from "@/app/(root)/_lib/tests.actions.schemas";
import { readSafeActionData } from "@/lib/actions/read-safe-action-result";
import { queryKeys } from "@/lib/query/keys";

const MUTATION_FALLBACK = "Could not delete the test. Please try again.";

/**
 * `DELETE /tests/:testId` - a draft is deleted outright; a published or already
 * archived test is archived instead, so student-visible history survives.
 */
export function useDeleteTestMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: TestIdInput) =>
      readSafeActionData(await deleteTestAction(input), MUTATION_FALLBACK),
    onSettled: () => queryClient.invalidateQueries({ queryKey: queryKeys.tests.all }),
  });
}
