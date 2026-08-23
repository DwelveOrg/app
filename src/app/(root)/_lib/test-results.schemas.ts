import { z } from "zod";

import { answerKeySchema, answerValueSchema } from "@/lib/tests/answers";
import { paperSectionSchema } from "@/lib/tests/paper.schemas";
import { attemptStatusSchema, violationTypeSchema } from "@/app/exam/_lib/attempts.schemas";
import { integrityActionSchema } from "./test-delivery";

/**
 * What a teacher sees after a class has sat a test.
 *
 * Mirrors `docs/features/test-taking-backend-handoff.md` §B.4. Three payloads,
 * and the split between them is deliberate:
 *
 * - **`results`** is one row per *enrolled student*, including the ones who
 *   never started. A list of attempts cannot show an absence, and the absences
 *   are the most actionable column on the screen.
 * - **`statistics`** is the cohort and the per-question analysis, computed
 *   server-side over completed attempts only. Sending raw attempts and reducing
 *   them in the browser would mean the mean changes as the table paginates.
 * - **`review`** is one student's paper with the key beside it — the teacher's
 *   view, which no delivery switch narrows. Those switches govern what the
 *   *student* sees.
 */

/* -------------------------------------------------------------------------- */
/* GET /tests/:testId/results                                                  */
/* -------------------------------------------------------------------------- */

/**
 * The state of the attempt a row is showing.
 *
 * `ABANDONED` is here because the backend picks the row's attempt with
 * `selectAttempt()`, which falls back to the latest attempt of *any* status
 * when none is complete — so a student whose attempt a teacher voided arrives
 * with that status, and an enum without it would fail validation and take the
 * whole results table down with it.
 */
export const resultRowStateSchema = z.enum([
  "NOT_STARTED",
  "IN_PROGRESS",
  "SUBMITTED",
  "GRADED",
  "EXPIRED",
  "ABANDONED",
]);
export type ResultRowState = z.infer<typeof resultRowStateSchema>;

export const testResultRowSchema = z
  .object({
    studentId: z.string(),
    userId: z.string().optional(),
    fullName: z.string(),
    email: z.string().nullable().optional(),
    avatarUrl: z.string().nullable().optional(),
    state: resultRowStateSchema,
    /** The attempt shown: the best when graded, else the latest. Null if none. */
    attemptId: z.string().nullable().default(null),
    attemptCount: z.number().default(0),
    score: z.number().nullable().default(null),
    maxScore: z.number().nullable().default(null),
    /** Rounded server-side, so the table, the histogram and any export agree. */
    percentage: z.number().nullable().default(null),
    passed: z.boolean().nullable().default(null),
    submittedAt: z.string().nullable().default(null),
    timeSpentSeconds: z.number().nullable().default(null),
    isLate: z.boolean().default(false),
    violationCount: z.number().default(0),
    /** Unmarked written answers. Drives the "needs marking" filter. */
    pendingManual: z.number().default(0),
  })
  .passthrough();
export type TestResultRow = z.infer<typeof testResultRowSchema>;

export const testResultsResponseSchema = z.object({
  rows: z.array(testResultRowSchema),
  meta: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
    totalPages: z.number(),
    hasMore: z.boolean(),
  }),
  summary: z.object({
    enrolled: z.number().default(0),
    notStarted: z.number().default(0),
    inProgress: z.number().default(0),
    submitted: z.number().default(0),
    graded: z.number().default(0),
    pendingManual: z.number().default(0),
  }),
});
export type TestResultsResponse = z.infer<typeof testResultsResponseSchema>;

/* -------------------------------------------------------------------------- */
/* GET /tests/:testId/statistics                                               */
/* -------------------------------------------------------------------------- */

export const questionStatSchema = z
  .object({
    id: z.string(),
    questionNumber: z.number(),
    prompt: z.string(),
    type: z.string(),
    answerKind: z.string(),
    points: z.number(),
    sectionId: z.string().nullable().optional(),
    answered: z.number().default(0),
    unanswered: z.number().default(0),
    correct: z.number().default(0),
    partial: z.number().default(0),
    incorrect: z.number().default(0),
    /** `correct / attemptsCounted`, 0..1. The UI names the bands. */
    difficulty: z.number().nullable().default(null),
    /**
     * Upper-lower index: correct-rate in the top 27% by total score minus the
     * bottom 27%. `null` under six attempts, because with five it is noise
     * presented as a statistic.
     */
    discrimination: z.number().nullable().default(null),
    averageTimeSeconds: z.number().nullable().default(null),
    /** Choice questions only — how the class spread across the options. */
    options: z
      .array(
        z.object({
          id: z.string(),
          label: z.string().nullable().optional(),
          text: z.string(),
          isCorrect: z.boolean().default(false),
          chosen: z.number().default(0),
        }),
      )
      .optional(),
    /** TEXT/NUMERIC only — the commonest wrong responses, capped at five. */
    topWrongAnswers: z
      .array(z.object({ value: z.string(), count: z.number() }))
      .optional(),
  })
  .passthrough();
export type QuestionStat = z.infer<typeof questionStatSchema>;

export const testStatisticsResponseSchema = z.object({
  cohort: z.object({
    attemptsCounted: z.number().default(0),
    enrolled: z.number().default(0),
    mean: z.number().nullable().default(null),
    median: z.number().nullable().default(null),
    stdDev: z.number().nullable().default(null),
    min: z.number().nullable().default(null),
    max: z.number().nullable().default(null),
    maxScore: z.number().default(0),
    passRate: z.number().nullable().default(null),
    passingScore: z.number().nullable().default(null),
    medianTimeSeconds: z.number().nullable().default(null),
    /** Ten fixed percentage buckets, so two tests are comparable. */
    distribution: z
      .array(z.object({ from: z.number(), to: z.number(), count: z.number() }))
      .default([]),
  }),
  sections: z
    .array(
      z.object({
        id: z.string(),
        title: z.string(),
        maxScore: z.number(),
        mean: z.number().nullable().default(null),
        meanPercentage: z.number().nullable().default(null),
      }),
    )
    .default([]),
  questions: z.array(questionStatSchema).default([]),
});
export type TestStatisticsResponse = z.infer<typeof testStatisticsResponseSchema>;

/* -------------------------------------------------------------------------- */
/* GET /attempts/:attemptId/review                                             */
/* -------------------------------------------------------------------------- */

export const reviewAnswerSchema = z
  .object({
    questionId: z.string(),
    value: answerValueSchema.nullable().default(null),
    /**
     * The key. Always present for a teacher; no delivery switch narrows it.
     * Its own shape — `{ acceptedAnswers }` for a short answer, `{ number,
     * tolerance }` for a numeric — not an answer's.
     */
    correctValue: answerKeySchema.nullable().default(null),
    isCorrect: z.boolean().nullable().default(null),
    pointsAwarded: z.number().default(0),
    points: z.number().default(0),
    feedback: z.string().nullable().default(null),
    gradedAt: z.string().nullable().default(null),
    timeSpentSeconds: z.number().nullable().default(null),
    /**
     * The cohort comparison, delivered with the paper so the "compare with
     * class" toggle costs no second request — it is a switch on data already in
     * the browser, not a fetch. Null under three graded attempts.
     */
    classCorrectRate: z.number().nullable().default(null),
    classAveragePoints: z.number().nullable().default(null),
  })
  .passthrough();
export type ReviewAnswer = z.infer<typeof reviewAnswerSchema>;

export const attemptReviewResponseSchema = z.object({
  attempt: z
    .object({
      id: z.string(),
      testId: z.string(),
      status: attemptStatusSchema,
      attemptNumber: z.number().default(1),
      startedAt: z.string(),
      submittedAt: z.string().nullable().default(null),
      timeSpentSeconds: z.number().nullable().default(null),
      score: z.number().default(0),
      maxScore: z.number().default(0),
      passed: z.boolean().nullable().default(null),
      isLate: z.boolean().default(false),
      violationCount: z.number().default(0),
    })
    .passthrough(),
  student: z.object({
    id: z.string(),
    fullName: z.string(),
    email: z.string().nullable().optional(),
    avatarUrl: z.string().nullable().optional(),
  }),
  /**
   * Optional: the review payload does not carry the test today, so the page
   * loads the title and pass mark alongside it. Kept in the schema because it
   * is the natural home for them and costs nothing to accept if the backend
   * starts sending it.
   */
  test: z
    .object({
      id: z.string(),
      title: z.string(),
      passingScore: z.number().nullable().optional(),
    })
    .optional(),
  sections: z.array(paperSectionSchema).default([]),
  answers: z.array(reviewAnswerSchema).default([]),
  violations: z
    .array(
      z.object({
        type: violationTypeSchema,
        action: integrityActionSchema,
        occurredAt: z.string(),
      }),
    )
    .default([]),
});
export type AttemptReviewResponse = z.infer<typeof attemptReviewResponseSchema>;

/** `PATCH /attempts/:attemptId/grade` */
export const gradeAttemptSchema = z.object({
  attemptId: z.string().min(1),
  marks: z
    .array(
      z.object({
        questionId: z.string().min(1),
        pointsAwarded: z.number().int().min(0),
        feedback: z.string().max(4_000).optional(),
      }),
    )
    .min(1)
    .max(200),
});
export type GradeAttemptInput = z.infer<typeof gradeAttemptSchema>;

/**
 * What `PATCH /attempts/:attemptId/grade` actually returns.
 *
 * Not `testSuccessResponseSchema`. That schema requires `{ success: boolean }`,
 * which only `POST /tests/:testId/unpublish` sends; grading answers with the
 * updated attempt instead. Validating the reply against the wrong shape made a
 * committed save throw on the way back, so the teacher was told "Could not save
 * these marks" about marks the database had already accepted.
 *
 * Passthrough because the summary is read from the refreshed page, not from
 * here — this only has to prove the request landed.
 */
export const gradeAttemptResponseSchema = z
  .object({ attempt: z.object({ id: z.string() }).passthrough() })
  .passthrough();

/** What `POST /tests/:testId/results/release` actually returns. */
export const releaseResultsResponseSchema = z
  .object({ released: z.number().int().min(0) })
  .passthrough();
