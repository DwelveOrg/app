import "server-only";

import { authedBackendJson } from "@/app/(authentication)/_lib/backend";
import { reportResponseSchema } from "./reports.schemas";

/**
 * `POST /reports` — files a problem report, optionally with a screenshot.
 *
 * Multipart, so the body is a `FormData` the action forwards untouched. The
 * backend requires a session but **not** a selected school: a user can hit a
 * bug before picking one, or because picking one is what is broken.
 */
export function createReportRequest(body: FormData) {
  return authedBackendJson("/reports", {
    method: "POST",
    body,
    responseSchema: reportResponseSchema,
  });
}
