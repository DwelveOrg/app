import "server-only";

import { BackendApiError } from "@/lib/api/backend";
import { listLibraryTestsRequest } from "../_lib/tests.api";
import type { LibraryTestsResponse } from "../_lib/tests.schemas";

/** Why the library could not be shown, so each case gets its own UI state. */
export type LibraryFetchFailure = "forbidden" | "error";

export type LibraryTestsResult =
  | { ok: true; data: LibraryTestsResponse }
  | { ok: false; reason: LibraryFetchFailure };

/**
 * Every test the caller has given, across their classes (`GET /tests`).
 *
 * The backend decides the scope: an admin sees the school's tests, a teacher
 * sees their own. That is why this is not assembled from per-class calls — the
 * "which classes are mine" question is already answered there, and answering it
 * again on the client would be a second, weaker copy of the same rule.
 */
export async function getLibraryTests(
  query: { status?: string; page?: number; limit?: number; search?: string } = {},
): Promise<LibraryTestsResult> {
  try {
    const data = await listLibraryTestsRequest(query);
    return { ok: true, data };
  } catch (error) {
    if (error instanceof BackendApiError && error.status === 403) {
      return { ok: false, reason: "forbidden" };
    }
    console.error("Failed to load the test library:", error);
    return { ok: false, reason: "error" };
  }
}
