"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { listClassTestsAction } from "@/app/(root)/_lib/test-actions";
import type { TestsListResponse } from "@/app/(root)/_lib/tests.schemas";
import { queryKeys } from "@/lib/query/keys";
import { TESTS_PAGE_SIZE } from "../_constants";

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
