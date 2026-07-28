import "server-only";

import { authedBackendJson } from "@/app/(authentication)/_lib/backend";
import { BackendApiError } from "@/lib/api/backend";
import { getClassRequest } from "../_lib/classes.api";
import type { ApiClass } from "../_lib/classes.schemas";

/** Why a class could not be shown, so each case gets its own UI state. */
export type ClassFetchFailure = "forbidden" | "notFound" | "error";

export type ClassFetchResult =
  | { ok: true; class: ApiClass }
  | { ok: false; reason: ClassFetchFailure };

/**
 * Fetches a single class by id (`GET /classes/:id`). The backend answers 403
 * when the viewer is a member of the school but not of the class (a student
 * whose request is still pending) and 404 when the class does not exist or is
 * invisible to them, so the two are kept apart: the page shows a friendly
 * access state for 403 and a not-found state for 404. Anything else is a
 * retryable error rather than a crash.
 */
export async function getClass(classId: string): Promise<ClassFetchResult> {
  try {
    const { class: classItem } = await getClassRequest(classId, authedBackendJson);
    return { ok: true, class: classItem };
  } catch (error) {
    if (error instanceof BackendApiError) {
      if (error.status === 403) return { ok: false, reason: "forbidden" };
      if (error.status === 404) return { ok: false, reason: "notFound" };
    }
    console.error("Failed to load class:", error);
    return { ok: false, reason: "error" };
  }
}
