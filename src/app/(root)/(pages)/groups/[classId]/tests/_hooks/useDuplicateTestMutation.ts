"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { duplicateTestAction } from "@/app/(root)/_lib/test-actions";
import type { TestIdInput } from "@/app/(root)/_lib/tests.actions.schemas";
import { readSafeActionData } from "@/lib/actions/read-safe-action-result";
import { queryKeys } from "@/lib/query/keys";

const MUTATION_FALLBACK = "Could not duplicate the test. Please try again.";

/**
 * `POST /tests/:testId/duplicate` - a deep clone as a new DRAFT. This is the
 * supported way to change a published test: publish freezes the structure, so
 * the teacher either unpublishes or edits a copy.
 */
export function useDuplicateTestMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: TestIdInput) =>
      readSafeActionData(await duplicateTestAction(input), MUTATION_FALLBACK),
    onSettled: () => queryClient.invalidateQueries({ queryKey: queryKeys.tests.all }),
  });
}
