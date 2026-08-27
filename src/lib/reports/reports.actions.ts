"use server";

import { BackendApiError, BackendResponseValidationError } from "@/lib/api/backend";
import { createReportRequest, type CreateReportBody } from "./reports.api";
import {
  REPORT_MESSAGE_MAX,
  REPORT_MESSAGE_MIN,
  reportKindSchema,
} from "./reports.schemas";

const GENERIC_ERROR = "Could not send your report. Please try again.";
const NETWORK_ERROR = "Unable to reach Dwelve. Please check your connection.";
const TOO_SHORT = `Please describe the problem in at least ${REPORT_MESSAGE_MIN} characters.`;

/**
 * Files a problem report.
 *
 * The client's page URL, viewport and user agent ride along as description. The
 * *identity* on the report is the session's, read on the backend — nothing here
 * is trusted to say who is reporting.
 */
export async function submitReportAction(
  formData: FormData,
): Promise<{ error?: string; reportId?: string }> {
  const message = String(formData.get("message") ?? "").trim();

  if (message.length < REPORT_MESSAGE_MIN) {
    return { error: TOO_SHORT };
  }

  const kind = reportKindSchema.safeParse(formData.get("kind"));
  const body: CreateReportBody = {
    message: message.slice(0, REPORT_MESSAGE_MAX),
    kind: kind.success ? kind.data : "BUG",
    pageUrl: readContext(formData, "pageUrl", 2048),
    userAgent: readContext(formData, "userAgent", 1024),
    viewport: readContext(formData, "viewport", 32),
    locale: readContext(formData, "locale", 16),
  };

  try {
    const { report } = await createReportRequest(body);
    return { reportId: report.id };
  } catch (error) {
    return { error: getActionError(error) };
  }
}

/** Reads one optional context field, trimmed to the backend's cap. */
function readContext(
  source: FormData,
  key: "pageUrl" | "userAgent" | "viewport" | "locale",
  maxLength: number,
): string | undefined {
  const value = source.get(key);

  if (typeof value === "string" && value.trim()) {
    return value.trim().slice(0, maxLength);
  }

  return undefined;
}

function getActionError(error: unknown) {
  if (error instanceof BackendApiError) {
    // 429 carries a real, actionable message from the rate limiter; so do the
    // validation failures. Anything else is masked.
    if (error.status === 429 || error.status === 400) {
      return error.message || GENERIC_ERROR;
    }
    if (error.status === 401) {
      return "Your session expired. Please sign in again and resend this.";
    }
    return GENERIC_ERROR;
  }
  if (error instanceof TypeError) {
    return NETWORK_ERROR;
  }
  if (error instanceof BackendResponseValidationError) {
    console.error("Report response validation error:", error);
    return GENERIC_ERROR;
  }
  console.error("Report action error:", error);
  return GENERIC_ERROR;
}
