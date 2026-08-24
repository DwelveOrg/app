"use client";

import { useCallback, useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  cancelTestImportAction,
  createTestImportAction,
  getTestImportAction,
  getTestImportLimitsAction,
} from "@/app/(root)/_lib/test-import.actions";
import type {
  CreateTestImportInput,
  TestImportJobIdInput,
} from "@/app/(root)/_lib/test-import.actions.schemas";
import { UPLOAD_MAX_BYTES } from "@/lib/uploads/limits";
import {
  FALLBACK_IMPORT_LIMITS,
  isTerminalImportStatus,
  testImportJobSchema,
  type TestImportJob,
} from "@/app/(root)/_lib/test-import.schemas";
import { readSafeActionData } from "@/lib/actions/read-safe-action-result";
import { queryKeys } from "@/lib/query/keys";

/**
 * Client-side reads and mutations for the AI PDF import.
 *
 * Separate from `useTests` because the shapes barely overlap: an import is a
 * *job* with a lifecycle, not a test. The one place they meet is the end —
 * a finished import invalidates the tests cache, because it has just created
 * one.
 */

const FALLBACKS = {
  start: "Could not start the import. Please try again.",
  status: "Could not check the import status.",
  cancel: "Could not cancel the import.",
} as const;

/** Polling fallback while the SSE bridge is unavailable or reconnecting. */
const POLL_INTERVAL_MS = 2_000;

/* -------------------------------------------------------------------------- */
/* Reads                                                                       */
/* -------------------------------------------------------------------------- */

/**
 * The server-owned caps.
 *
 * `placeholderData`, deliberately **not** `initialData`: seeding real data
 * alongside a one-hour `staleTime` would mark the query fresh on mount, so the
 * fallback numbers would be the only ones the UI ever showed and raising a cap
 * server-side would silently do nothing. Placeholder data renders immediately
 * and still fetches.
 *
 * The long `staleTime` is right once the real values are in hand — these change
 * on deploy, not on use. The action falls back rather than throwing, so this
 * query has no error state the UI needs to render.
 */
export function useTestImportLimitsQuery() {
  const query = useQuery({
    queryKey: queryKeys.testImports.limits(),
    queryFn: async () =>
      readSafeActionData(await getTestImportLimitsAction(), FALLBACKS.status),
    placeholderData: FALLBACK_IMPORT_LIMITS,
    staleTime: 60 * 60 * 1000,
  });

  // `data` is always present for callers: the picker has to refuse an oversized
  // document on the first render, so a limits object that can be `undefined`
  // would push a null-check into every call site for a state that never
  // usefully occurs.
  const data = query.data ?? FALLBACK_IMPORT_LIMITS;

  return {
    ...query,
    data: {
      ...data,
      // The backend will happily accept a 20 MB PDF, but the browser cannot
      // deliver one: the upload rides a Server Action, and the hosting platform
      // rejects any request body over `PLATFORM_REQUEST_MAX_BYTES` at the edge,
      // before Next — and therefore before Nest — sees it. Advertising the
      // backend's number sent teachers to a 413 that surfaced as nothing at
      // all. Clamp it here, once, so the picker's copy, its refusal, and its
      // error messages all quote a limit that is actually reachable.
      maxBytes: Math.min(data.maxBytes, UPLOAD_MAX_BYTES),
    },
  };
}

/**
 * Streams one import job until it reaches a terminal status.
 *
 * EventSource is intentionally same-origin: the Next route authenticates from
 * the httpOnly session and forwards the bearer token server-side. The ordinary
 * status read stays enabled for initial data and becomes a 2-second fallback
 * while the stream connects or reconnects. Both transports stop at `READY` or
 * `FAILED`. Passing `jobId: null` disables both.
 */
export function useTestImportJobQuery(jobId: string | null) {
  const queryClient = useQueryClient();
  const [connectedJobId, setConnectedJobId] = useState<string | null>(null);
  const streamConnected = connectedJobId === jobId;
  const query = useQuery({
    queryKey: queryKeys.testImports.job(jobId ?? "none"),
    queryFn: async () =>
      readSafeActionData(
        await getTestImportAction({ jobId: jobId as string }),
        FALLBACKS.status,
      ),
    enabled: Boolean(jobId),
    refetchInterval: (stateQuery) => {
      const job = stateQuery.state.data as TestImportJob | undefined;
      if (job && isTerminalImportStatus(job.status)) return false;
      if (streamConnected) return false;
      return POLL_INTERVAL_MS;
    },
    // A job that is still running is never "fresh" — the whole point is that
    // its answer changes without us asking.
    staleTime: 0,
    gcTime: 5 * 60 * 1000,
  });
  const terminal = query.data
    ? isTerminalImportStatus(query.data.status)
    : false;

  useEffect(() => {
    if (!jobId || terminal) return;

    const source = new EventSource(
      `/api/test-imports/${encodeURIComponent(jobId)}/events`,
    );

    source.onopen = () => setConnectedJobId(jobId);
    source.onerror = () =>
      setConnectedJobId((current) => (current === jobId ? null : current));
    source.onmessage = (event) => {
      let payload: unknown;

      try {
        payload = JSON.parse(event.data) as unknown;
      } catch {
        return;
      }

      const parsed = testImportJobSchema.safeParse(payload);
      if (!parsed.success) return;

      queryClient.setQueryData(queryKeys.testImports.job(jobId), parsed.data);

      if (isTerminalImportStatus(parsed.data.status)) {
        source.close();
        setConnectedJobId((current) => (current === jobId ? null : current));
      }
    };

    return () => {
      source.close();
    };
  }, [jobId, queryClient, terminal]);

  return query;
}

/* -------------------------------------------------------------------------- */
/* Mutations                                                                   */
/* -------------------------------------------------------------------------- */

/**
 * `POST /classes/:classId/tests/imports` — uploads the PDF and the page
 * selection, and returns the job id the loader then polls.
 */
export function useCreateTestImportMutation() {
  return useMutation({
    mutationFn: async (input: CreateTestImportInput) =>
      readSafeActionData(await createTestImportAction(input), FALLBACKS.start),
  });
}

/** `DELETE /tests/imports/:jobId` — the teacher backing out mid-import. */
export function useCancelTestImportMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: TestImportJobIdInput) =>
      readSafeActionData(await cancelTestImportAction(input), FALLBACKS.cancel),
    onSettled: (_data, _error, variables) => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.testImports.job(variables.jobId),
      });
    },
  });
}

/**
 * Invalidates the tests cache once an import has produced a draft, so the class
 * list and the library show it without a manual refresh.
 */
export function useInvalidateTestsAfterImport() {
  const queryClient = useQueryClient();
  return useCallback(
    () => queryClient.invalidateQueries({ queryKey: queryKeys.tests.all }),
    [queryClient],
  );
}
