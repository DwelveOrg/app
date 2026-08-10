"use client";

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  createTestAction,
  deleteTestAction,
  duplicateTestAction,
  getTestValidationAction,
  listClassTestsAction,
  publishTestAction,
  publishTestWithDeliveryAction,
  saveTestDeliveryAction,
  saveTestStructureAction,
  unpublishTestAction,
  updateTestAction,
} from "@/app/(root)/_lib/test-actions";
import type {
  CreateTestInput,
  PublishTestWithDeliveryInput,
  SaveTestDeliveryInput,
  SaveTestStructureInput,
  TestIdInput,
  TestPublishCandidateInput,
  UpdateTestInput,
} from "@/app/(root)/_lib/tests.actions.schemas";
import type { TestsListResponse } from "@/app/(root)/_lib/tests.schemas";
import { TESTS_PAGE_SIZE } from "@/app/(root)/_constants/tests";
import { readSafeActionData } from "@/lib/actions/read-safe-action-result";
import { queryKeys } from "@/lib/query/keys";

/**
 * Every client-side read and mutation for tests, in one module.
 *
 * They were seven single-hook files under the class route, which stopped being
 * the right home the moment authoring moved to `/studio`: the list needs three
 * of them, the builder needs four, and the publish wizard needs two more. One
 * feature module both environments import beats a folder of one-line files that
 * each of them reaches across a route boundary for.
 */

const FALLBACKS = {
  create: "Could not create the test. Please try again.",
  save: "Could not save the test. Please try again.",
  delivery: "Could not save the delivery rules. Please try again.",
  publish: "Could not publish the test. Please try again.",
  unpublish: "Could not move the test back to draft.",
  duplicate: "Could not duplicate the test. Please try again.",
  remove: "Could not delete the test. Please try again.",
} as const;

/* -------------------------------------------------------------------------- */
/* Reads                                                                       */
/* -------------------------------------------------------------------------- */

/**
 * One page of a class's tests for the selected status tab.
 *
 * The backend paginates by status, so each tab is its own cache entry;
 * `keepPreviousData` stops the list from collapsing to a spinner while a tab or
 * page change is in flight.
 */
export function useTestsQuery({
  classId,
  status,
  page,
  initialData,
}: {
  classId: string;
  status: string;
  page: number;
  /** The server-rendered first page, seeded so the default tab never refetches. */
  initialData?: TestsListResponse;
}) {
  return useQuery({
    queryKey: queryKeys.tests.list(classId, { status, page }),
    queryFn: () =>
      listClassTestsAction({ classId, status, page, limit: TESTS_PAGE_SIZE }),
    initialData,
    placeholderData: keepPreviousData,
  });
}

/**
 * Live publish-readiness for a test.
 *
 * The publish screen passes its unsaved candidate to the body-bearing POST;
 * callers without one retain the stored-value GET. Candidate values are part
 * of the query key so an edit cannot reuse readiness for an older draft.
 */
export function useTestValidationQuery({
  testId,
  enabled,
  candidate,
}: {
  testId: string;
  enabled: boolean;
  candidate?: TestPublishCandidateInput;
}) {
  return useQuery({
    queryKey: [...queryKeys.tests.validation(testId), candidate ?? null],
    queryFn: () => getTestValidationAction({ testId, candidate }),
    enabled,
    staleTime: 0,
    refetchOnMount: "always",
  });
}

/* -------------------------------------------------------------------------- */
/* Mutations                                                                   */
/* -------------------------------------------------------------------------- */

function useInvalidateTests() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: queryKeys.tests.all });
}

/** `POST /classes/:classId/tests` - creates a DRAFT and returns its id. */
export function useCreateTestMutation() {
  const invalidate = useInvalidateTests();

  return useMutation({
    mutationFn: async (input: CreateTestInput) =>
      readSafeActionData(await createTestAction(input), FALLBACKS.create),
    onSettled: invalidate,
  });
}

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
      readSafeActionData(await saveTestStructureAction(input), FALLBACKS.save),
    onSettled: (_data, _error, variables) => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.tests.validation(variables.testId),
      });
      void queryClient.invalidateQueries({ queryKey: queryKeys.tests.all });
    },
  });
}

/** `PATCH /tests/:testId` - metadata only, never the tree. */
export function useUpdateTestMutation() {
  const invalidate = useInvalidateTests();

  return useMutation({
    mutationFn: async (input: UpdateTestInput) =>
      readSafeActionData(await updateTestAction(input), FALLBACKS.save),
    onSettled: invalidate,
  });
}

/** `PUT /tests/:testId/delivery` - the delivery and integrity rules. */
export function useSaveTestDeliveryMutation() {
  const invalidate = useInvalidateTests();

  return useMutation({
    mutationFn: async (input: SaveTestDeliveryInput) =>
      readSafeActionData(await saveTestDeliveryAction(input), FALLBACKS.delivery),
    onSettled: invalidate,
  });
}

/**
 * The publish screen's transactional terminal action. A server rejection comes
 * back as data because the readiness banner owns the attached issue list.
 */
export function usePublishWithDeliveryMutation() {
  const invalidate = useInvalidateTests();

  return useMutation({
    mutationFn: async (input: PublishTestWithDeliveryInput) =>
      readSafeActionData(
        await publishTestWithDeliveryAction(input),
        FALLBACKS.publish,
      ),
    onSettled: invalidate,
  });
}

/**
 * `POST /tests/:testId/publish` on its own — the list's quick republish, which
 * reuses whatever delivery rules the test already carries.
 */
export function usePublishTestMutation() {
  const invalidate = useInvalidateTests();

  return useMutation({
    mutationFn: async (input: TestIdInput) =>
      readSafeActionData(await publishTestAction(input), FALLBACKS.publish),
    onSettled: invalidate,
  });
}

/**
 * `POST /tests/:testId/unpublish` - the only way back into the builder for a
 * published test, since structure edits are DRAFT-only.
 */
export function useUnpublishTestMutation() {
  const invalidate = useInvalidateTests();

  return useMutation({
    mutationFn: async (input: TestIdInput) =>
      readSafeActionData(await unpublishTestAction(input), FALLBACKS.unpublish),
    onSettled: invalidate,
  });
}

/**
 * `POST /tests/:testId/duplicate` - a deep clone as a new DRAFT. This is the
 * supported way to change a published test: publish freezes the structure, so
 * the teacher either unpublishes or edits a copy.
 */
export function useDuplicateTestMutation() {
  const invalidate = useInvalidateTests();

  return useMutation({
    mutationFn: async (input: TestIdInput) =>
      readSafeActionData(await duplicateTestAction(input), FALLBACKS.duplicate),
    onSettled: invalidate,
  });
}

/**
 * `DELETE /tests/:testId` - a draft is deleted outright; a published or already
 * archived test is archived instead, so student-visible history survives.
 */
export function useDeleteTestMutation() {
  const invalidate = useInvalidateTests();

  return useMutation({
    mutationFn: async (input: TestIdInput) =>
      readSafeActionData(await deleteTestAction(input), FALLBACKS.remove),
    onSettled: invalidate,
  });
}
