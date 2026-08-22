import { z } from "zod";

/**
 * What a user can be reporting. Kept to three because a picker with eight
 * options is a taxonomy quiz, and the difference between "bug" and "defect" is
 * not one the reporter should have to adjudicate while annoyed.
 */
export const reportKindSchema = z.enum(["BUG", "FEEDBACK", "QUESTION"]);
export type ReportKind = z.infer<typeof reportKindSchema>;

/** Mirrors the backend `CreateIssueReportDto` bounds so the dialog can enforce them. */
export const REPORT_MESSAGE_MIN = 10;
export const REPORT_MESSAGE_MAX = 4000;

/** JPEG, PNG and WebP, matching the backend's image filter. */
export const REPORT_SCREENSHOT_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

/**
 * The largest screenshot a reporter may *choose*.
 *
 * Deliberately larger than what is uploaded. A full-page capture on a Retina
 * display is routinely 6–8 MB, and refusing it at the picker would put the
 * burden of resizing on the person who is already annoyed. The dialog accepts
 * it and re-encodes it to fit `UPLOAD_MAX_BYTES` before it is sent, so this
 * bound is about what a browser should be asked to decode, not about what the
 * network can carry.
 */
export const REPORT_SCREENSHOT_MAX_BYTES = 8 * 1024 * 1024;

/** `POST /reports` — the row the backend wrote back. */
export const reportResponseSchema = z.object({
  report: z
    .object({
      id: z.string(),
      kind: reportKindSchema,
      status: z.string(),
      message: z.string(),
      screenshotUrl: z.string().nullable().optional(),
      createdAt: z.union([z.string(), z.date()]).optional(),
    })
    .passthrough(),
});
export type ReportResponse = z.infer<typeof reportResponseSchema>;
