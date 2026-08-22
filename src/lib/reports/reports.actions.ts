"use server";

import { BackendApiError, BackendResponseValidationError } from "@/lib/api/backend";
import { UPLOAD_MAX_BYTES } from "@/lib/uploads/limits";
import { createReportRequest } from "./reports.api";
import {
  REPORT_MESSAGE_MAX,
  REPORT_MESSAGE_MIN,
  REPORT_SCREENSHOT_TYPES,
  reportKindSchema,
} from "./reports.schemas";

const GENERIC_ERROR = "Could not send your report. Please try again.";
const NETWORK_ERROR = "Unable to reach Dwelve. Please check your connection.";
const TOO_SHORT = `Please describe the problem in at least ${REPORT_MESSAGE_MIN} characters.`;
const SCREENSHOT_TOO_BIG =
  "That screenshot is too large to send. Please attach a smaller image.";
const SCREENSHOT_WRONG_TYPE = "Screenshots must be a JPEG, PNG, or WebP image.";

/**
 * Files a problem report.
 *
 * A plain server action rather than a `next-safe-action` one, for the same
 * reason `updateAvatarAction` is: the payload is multipart, and the file has to
 * reach the backend as a file rather than as something that survived a JSON
 * round trip.
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
  const screenshot = formData.get("screenshot");
  const hasScreenshot = screenshot instanceof File && screenshot.size > 0;

  if (hasScreenshot) {
    // The transport budget, not the picker's 8 MB: by the time a file is here
    // it has already survived the platform's body limit, so anything above this
    // came from a caller that skipped the dialog's re-encode step. Refuse it
    // with a message rather than let it fail as an opaque 413 further out.
    if (screenshot.size > UPLOAD_MAX_BYTES) {
      return { error: SCREENSHOT_TOO_BIG };
    }
    if (!REPORT_SCREENSHOT_TYPES.includes(screenshot.type as never)) {
      return { error: SCREENSHOT_WRONG_TYPE };
    }
  }

  // Rebuilt rather than forwarded, so a field the dialog never sends cannot be
  // injected into the backend request by anything else on the page.
  const forwarded = new FormData();
  forwarded.set("message", message.slice(0, REPORT_MESSAGE_MAX));
  forwarded.set("kind", kind.success ? kind.data : "BUG");
  appendContext(forwarded, formData, "pageUrl", 2048);
  appendContext(forwarded, formData, "userAgent", 1024);
  appendContext(forwarded, formData, "viewport", 32);
  appendContext(forwarded, formData, "locale", 16);
  if (hasScreenshot) {
    forwarded.set("screenshot", screenshot);
  }

  try {
    const { report } = await createReportRequest(forwarded);
    return { reportId: report.id };
  } catch (error) {
    return { error: getActionError(error) };
  }
}

/** Copies one optional context field, trimmed to the backend's cap. */
function appendContext(
  target: FormData,
  source: FormData,
  key: string,
  maxLength: number,
) {
  const value = source.get(key);

  if (typeof value === "string" && value.trim()) {
    target.set(key, value.trim().slice(0, maxLength));
  }
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
    if (error.status === 413) {
      return SCREENSHOT_TOO_BIG;
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
