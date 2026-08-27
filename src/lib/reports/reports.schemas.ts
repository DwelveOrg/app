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
