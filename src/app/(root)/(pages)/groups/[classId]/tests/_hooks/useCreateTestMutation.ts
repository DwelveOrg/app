"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { createTestAction } from "@/app/(root)/_lib/test-actions";
import type { CreateTestInput } from "@/app/(root)/_lib/tests.actions.schemas";
import { readSafeActionData } from "@/lib/actions/read-safe-action-result";
import { queryKeys } from "@/lib/query/keys";

const MUTATION_FALLBACK = "Could not create the test. Please try again.";

/** `POST /classes/:classId/tests` - creates a DRAFT and returns its id. */
export function useCreateTestMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateTestInput) =>
      readSafeActionData(await createTestAction(input), MUTATION_FALLBACK),
    onSettled: () => queryClient.invalidateQueries({ queryKey: queryKeys.tests.all }),
  });
}
