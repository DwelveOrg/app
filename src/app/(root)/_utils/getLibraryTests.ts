import "server-only";

import { authedBackendJson } from "@/app/(authentication)/_lib/backend";
import { BackendApiError } from "@/lib/api/backend";
import { listLibraryTestsRequest } from "../_lib/tests.api";
import type { LibraryTestsListResponse } from "../_lib/tests.schemas";
import type { TestsFetchFailure } from "./getClassTests";

export type LibraryTestsResult =
  | { ok: true; data: LibraryTestsListResponse }
  | { ok: false; reason: TestsFetchFailure };

/**
 * Fetches the first page of the caller's test library (`GET /tests`).
 *
 * Mirrors `getClassTests`, including the 403/404 split, so both test lists fail
 * into the same three UI states. There is no not-found case for the unfiltered
 * library — the route needs no class to exist — but the filtered variant can
 * still 404 on a class the caller cannot see.
 */
export async function getLibraryTests(
  query: {
    status?: string;
    page?: number;
    limit?: number;
    classId?: string;
    search?: string;
  } = {},
): Promise<LibraryTestsResult> {
  try {
    const data = await listLibraryTestsRequest(query, authedBackendJson);
    return { ok: true, data };
  } catch (error) {
    if (error instanceof BackendApiError) {
      if (error.status === 403) return { ok: false, reason: "forbidden" };
      if (error.status === 404) return { ok: false, reason: "notFound" };
    }
    console.error("Failed to load the test library:", error);
    return { ok: false, reason: "error" };
  }
}
