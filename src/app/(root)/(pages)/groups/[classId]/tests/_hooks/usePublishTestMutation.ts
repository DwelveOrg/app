"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import {
  publishTestAction,
  unpublishTestAction,
} from "@/app/(root)/_lib/test-actions";
import type { TestIdInput } from "@/app/(root)/_lib/tests.actions.schemas";
import { readSafeActionData } from "@/lib/actions/read-safe-action-result";
import { queryKeys } from "@/lib/query/keys";

const PUBLISH_FALLBACK = "Could not publish the test. Please try again.";
const UNPUBLISH_FALLBACK = "Could not move the test back to draft.";

/**
 * `POST /tests/:testId/publish` - validates, publishes, and notifies the class
 * inside one transaction. Students receive the notification; it links to the
 * class page, because they have no test surface this pass.
 */
export function usePublishTestMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: TestIdInput) =>
      readSafeActionData(await publishTestAction(input), PUBLISH_FALLBACK),
    onSettled: () => queryClient.invalidateQueries({ queryKey: queryKeys.tests.all }),
  });
}

/**
 * `POST /tests/:testId/unpublish` - the only way back into the builder for a
 * published test, since structure edits are DRAFT-only.
 */
export function useUnpublishTestMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: TestIdInput) =>
      readSafeActionData(await unpublishTestAction(input), UNPUBLISH_FALLBACK),
    onSettled: () => queryClient.invalidateQueries({ queryKey: queryKeys.tests.all }),
  });
}
