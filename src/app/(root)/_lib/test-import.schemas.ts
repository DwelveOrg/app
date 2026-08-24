import { z } from "zod";

/**
 * Zod schemas for the AI PDF import API (`/tests/imports`).
 *
 * **This module is the contract.** The backend is written against these shapes
 * (see `AI_PDF_TO_TEST_BACKEND_PLAN.md`), so a field renamed here is a breaking
 * change there. Keeping the contract in the frontend is deliberate: a response
 * that drifts surfaces as a Zod parse error at the boundary rather than as
 * `undefined` three components deep.
 *
 * The limits are **not** hard-coded into validation here. `GET
 * /tests/imports/limits` serves them so that raising a cap server-side updates
 * the page counter and question field without a frontend deploy. The Next
 * request-body transport ceiling remains a separate deployment constraint.
 * That is the same principle `GET /tests/formats` already uses for the format
 * blueprints.
 */

/* -------------------------------------------------------------------------- */
/* GET /tests/imports/limits                                                   */
/* -------------------------------------------------------------------------- */

export const testImportLimitsSchema = z
  .object({
    /** Hard ceiling on questions the AI may return in one import. */
    maxQuestions: z.number().int().positive(),
    /** Pages the teacher may select in one import. Sits under the model's own page limit. */
    maxSelectedPages: z.number().int().positive(),
    /** Pages we will open and let the teacher browse, before any selection. */
    maxDocumentPages: z.number().int().positive(),
    maxBytes: z.number().int().positive(),
    dailyQuotaPerSchool: z.number().int().positive(),
    /** Added by the server action when the deployment has import switched off. */
    enabled: z.boolean().default(true),
  })
  .passthrough();
export type TestImportLimits = z.infer<typeof testImportLimitsSchema>;

/**
 * What the UI falls back to before the limits request resolves, and if it fails.
 *
 * A fallback is needed because the picker must refuse an oversized document
 * *before* upload, and it cannot wait on a network round trip to do that. These
 * mirror the backend defaults; if they ever disagree, the server wins — it
 * rejects the request regardless of what the UI allowed.
 */
export const FALLBACK_IMPORT_LIMITS: TestImportLimits = {
  maxQuestions: 100,
  maxSelectedPages: 40,
  maxDocumentPages: 300,
  maxBytes: 20 * 1024 * 1024,
  dailyQuotaPerSchool: 50,
  enabled: true,
};

/* -------------------------------------------------------------------------- */
/* The job                                                                     */
/* -------------------------------------------------------------------------- */

/**
 * The job's lifecycle, in the order the stepper renders it.
 *
 * A closed enum rather than a passthrough string because the vertical loader
 * switches on it exhaustively — an unknown status would render no active step
 * at all, which reads as a hung import.
 */
export const testImportStatusSchema = z.enum([
  "PENDING",
  "UPLOADING",
  "ANALYZING",
  "EXTRACTING",
  "BUILDING",
  "READY",
  "FAILED",
]);
export type TestImportStatus = z.infer<typeof testImportStatusSchema>;

/** Statuses after which progress streaming and fallback polling stop. */
export const TERMINAL_IMPORT_STATUSES: readonly TestImportStatus[] = ["READY", "FAILED"];

export function isTerminalImportStatus(status: TestImportStatus): boolean {
  return TERMINAL_IMPORT_STATUSES.includes(status);
}

/**
 * Why a question needs the teacher's attention.
 *
 * `NO_ANSWER` is the common one and is not a failure: it is the expected
 * outcome for a PDF that never contained an answer key, or whose key page the
 * teacher did not select. See the answer rule in `AI_PDF_TO_TEST_PLAN.md`.
 */
export const testImportWarningReasonSchema = z.enum([
  "NO_ANSWER",
  "LOW_CONFIDENCE",
  "UNSUPPORTED_TYPE",
  "TRUNCATED",
]);
export type TestImportWarningReason = z.infer<typeof testImportWarningReasonSchema>;

export const testImportWarningSchema = z
  .object({
    questionNumber: z.number().int().nonnegative().nullable().optional(),
    reason: testImportWarningReasonSchema,
  })
  .passthrough();
export type TestImportWarning = z.infer<typeof testImportWarningSchema>;

/**
 * Every way an import can fail, as a code rather than a message — the copy is
 * translated in all three catalogues, so the backend must not send prose here.
 */
export const testImportErrorCodeSchema = z.enum([
  "TOO_MANY_PAGES",
  "TOO_MANY_SELECTED_PAGES",
  "INVALID_PAGES",
  "INVALID_PDF",
  "QUOTA_EXCEEDED",
  "EXTRACTION_FAILED",
  "NO_QUESTIONS_FOUND",
  "INTERRUPTED",
  "DISABLED",
]);
export type TestImportErrorCode = z.infer<typeof testImportErrorCodeSchema>;

export const testImportJobSchema = z
  .object({
    id: z.string(),
    status: testImportStatusSchema,
    /** 0-100. Advances within a status, so the stepper never looks stalled. */
    progress: z.number().int().min(0).max(100),
    fileName: z.string(),
    /** Pages in the slice actually sent to the model. */
    pageCount: z.number().int().nonnegative().nullable().optional(),
    /** Questions actually imported. */
    questionCount: z.number().int().nonnegative().nullable().optional(),
    /**
     * Questions seen before the cap applied. Greater than `questionCount` means
     * the import was truncated, which the builder banner reports explicitly
     * rather than letting the teacher discover a short test on their own.
     */
    questionsFound: z.number().int().nonnegative().nullable().optional(),
    /** Set once the DRAFT exists — the redirect target. */
    testId: z.string().nullable().optional(),
    warnings: z.array(testImportWarningSchema).nullable().optional(),
    errorCode: testImportErrorCodeSchema.nullable().optional(),
  })
  .passthrough();
export type TestImportJob = z.infer<typeof testImportJobSchema>;

/** `POST /classes/:classId/tests/imports` — returns immediately with the job id. */
export const createTestImportResponseSchema = z
  .object({ jobId: z.string() })
  .passthrough();
export type CreateTestImportResponse = z.infer<typeof createTestImportResponseSchema>;

/* -------------------------------------------------------------------------- */
/* Derived helpers                                                             */
/* -------------------------------------------------------------------------- */

/** True only when the configured question cap cut the extraction short. */
export function wasTruncated(job: Pick<TestImportJob, "warnings">) {
  return (job.warnings ?? []).some(
    (warning) => warning.reason === "TRUNCATED" && warning.questionNumber == null,
  );
}

/** The outline counted more questions than the model returned, without hitting the cap. */
export function wasIncomplete(
  job: Pick<TestImportJob, "questionCount" | "questionsFound" | "warnings">,
) {
  return (
    !wasTruncated(job) &&
    (job.questionsFound ?? 0) > (job.questionCount ?? 0) &&
    (job.warnings ?? []).some(
      (warning) =>
        warning.reason === "LOW_CONFIDENCE" && warning.questionNumber == null,
    )
  );
}

/** How many questions still need a correct answer chosen. */
export function countMissingAnswers(job: Pick<TestImportJob, "warnings">) {
  return (job.warnings ?? []).filter((warning) => warning.reason === "NO_ANSWER").length;
}
