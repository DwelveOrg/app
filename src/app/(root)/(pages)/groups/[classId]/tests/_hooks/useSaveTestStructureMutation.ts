"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import {
  saveTestStructureAction,
  updateTestAction,
} from "@/app/(root)/_lib/test-actions";
import type {
  SaveTestStructureInput,
  UpdateTestInput,
} from "@/app/(root)/_lib/tests.actions.schemas";
import { readSafeActionData } from "@/lib/actions/read-safe-action-result";
import { queryKeys } from "@/lib/query/keys";

const SAVE_FALLBACK = "Could not save the test. Please try again.";

/**
 * `PUT /tests/:testId/structure` - the whole tree in one request.
 *
 * Saving is deliberately not per-field: the builder is one large form, and a
 * whole-tree replace is a single transaction that reduces reordering to array
 * position.
 */
export function useSaveTestStructureMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: SaveTestStructureInput) =>
      readSafeActionData(await saveTestStructureAction(input), SAVE_FALLBACK),
    onSettled: (_data, _error, variables) => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.tests.validation(variables.testId),
      });
      void queryClient.invalidateQueries({ queryKey: queryKeys.tests.all });
    },
  });
}

/** `PATCH /tests/:testId` - metadata only, from the settings dialog. */
export function useUpdateTestMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateTestInput) =>
      readSafeActionData(await updateTestAction(input), SAVE_FALLBACK),
    onSettled: () => queryClient.invalidateQueries({ queryKey: queryKeys.tests.all }),
  });
}
