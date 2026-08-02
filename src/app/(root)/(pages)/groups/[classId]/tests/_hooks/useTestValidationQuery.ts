"use client";

import { useQuery } from "@tanstack/react-query";

import { getTestValidationAction } from "@/app/(root)/_lib/test-actions";
import { queryKeys } from "@/lib/query/keys";

/**
 * Live publish-readiness for a test (`GET /tests/:testId/validation`).
 *
 * Only fetched while the publish dialog is open: the answer is about *saved*
 * data, so polling it against an unsaved form would report stale problems.
 */
export function useTestValidationQuery({
  testId,
  enabled,
}: {
  testId: string;
  enabled: boolean;
}) {
  return useQuery({
    queryKey: queryKeys.tests.validation(testId),
    queryFn: () => getTestValidationAction(testId),
    enabled,
    // Publishing follows a save; the issues must reflect what was just written.
    staleTime: 0,
    refetchOnMount: "always",
  });
}
