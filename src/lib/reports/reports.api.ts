import "server-only";

import { authedBackendJson } from "@/app/(authentication)/_lib/backend";
import { reportResponseSchema, type ReportKind } from "./reports.schemas";

export type CreateReportBody = {
  message: string;
  kind: ReportKind;
  pageUrl?: string;
  userAgent?: string;
  viewport?: string;
  locale?: string;
};

/**
 * `POST /reports` — files a text-only problem report.
 *
 * The backend requires a session but **not** a selected school: a user can hit
 * a bug before picking one, or because picking one is what is broken.
 */
export function createReportRequest(body: CreateReportBody) {
  return authedBackendJson("/reports", {
    method: "POST",
    body,
    responseSchema: reportResponseSchema,
  });
}
