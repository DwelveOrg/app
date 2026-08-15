import { z } from "zod";

import { answerKeySchema, answerValueSchema } from "@/lib/tests/answers";
import { paperTestSchema, takerDeliverySchema } from "@/lib/tests/paper.schemas";
import { integrityActionSchema } from "@/app/(root)/_lib/test-delivery";

/**
 * Every response shape the test-taking API returns.
 *
 * One-to-one with `docs/features/test-taking-backend-handoff.md` §B.3. That
 * document is the contract; this file is the enforcement. A backend that starts
 * sending something else fails here — with the field named, inside
 * `BackendResponseValidationError` — rather than three components later as an
 * undefined read on a page a student is sitting an exam on.
 */

/* -------------------------------------------------------------------------- */
/* States                                                                      */
/* -------------------------------------------------------------------------- */

/**
 * What a student can do with a test right now, resolved **server-side**.
 *
 * Deliberately not derived on the client from `availableFrom`/`availableUntil`.
 * Only the server knows what time it is, and a device clock an hour fast would
 * otherwise show a paper as open before it is — or, worse, as closed while the
 * student still has twenty minutes.
 */
export const testTakerStateSchema = z.enum([
  "NOT_YET_OPEN",
  "AVAILABLE",
  "IN_PROGRESS",
  "SUBMITTED",
  "GRADED",
  "CLOSED",
  "NO_ATTEMPTS_LEFT",
]);
export type TestTakerState = z.infer<typeof testTakerStateSchema>;

export const attemptStatusSchema = z.enum([
  "IN_PROGRESS",
  "SUBMITTED",
  "GRADED",
  "EXPIRED",
  "ABANDONED",
]);
export type AttemptStatus = z.infer<typeof attemptStatusSchema>;

export const violationTypeSchema = z.enum([
  "FULLSCREEN_EXIT",
  "LEFT_SCREEN",
  "COPY_ATTEMPT",
  "PASTE_ATTEMPT",
  "CONTEXT_MENU",
]);
export type ViolationType = z.infer<typeof violationTypeSchema>;

/* -------------------------------------------------------------------------- */
/* GET /me/tests                                                               */
/* -------------------------------------------------------------------------- */

export const studentTestRowSchema = z
  .object({
    id: z.string(),
    classId: z.string(),
    className: z.string().nullable().optional(),
    title: z.string(),
    format: z.string(),
    durationMinutes: z.number().nullable().optional(),
    totalPoints: z.number().default(0),
    questionCount: z.number().default(0),
    availableFrom: z.string().nullable().optional(),
    availableUntil: z.string().nullable().optional(),
    attemptsAllowed: z.number().default(1),
    attemptsUsed: z.number().default(0),
    state: testTakerStateSchema,
    activeAttemptId: z.string().nullable().default(null),
    lastAttempt: z
      .object({
        id: z.string(),
        status: attemptStatusSchema,
        score: z.number().nullable().optional(),
        maxScore: z.number().nullable().optional(),
        submittedAt: z.string().nullable().optional(),
        /** The server's resolution of `resultsRelease`. Never re-derived here. */
        resultAvailable: z.boolean().default(false),
      })
      .nullable()
      .default(null),
  })
  .passthrough();
export type StudentTestRow = z.infer<typeof studentTestRowSchema>;

export const studentTestsResponseSchema = z.object({
  tests: z.array(studentTestRowSchema),
  meta: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
    totalPages: z.number(),
    hasMore: z.boolean(),
  }),
});
export type StudentTestsResponse = z.infer<typeof studentTestsResponseSchema>;

/* -------------------------------------------------------------------------- */
/* GET /tests/:testId/taker — the cover screen                                 */
/* -------------------------------------------------------------------------- */

export const takerOverviewResponseSchema = z.object({
  test: z
    .object({
      id: z.string(),
      title: z.string(),
      description: z.string().nullable().optional(),
      instructions: z.string().nullable().optional(),
      format: z.string(),
      classId: z.string().optional(),
      className: z.string().nullable().optional(),
      durationMinutes: z.number().nullable().optional(),
      totalPoints: z.number().default(0),
      questionCount: z.number().default(0),
      sectionSummaries: z
        .array(
          z.object({
            id: z.string(),
            title: z.string(),
            kind: z.string(),
            questionCount: z.number().default(0),
            durationMinutes: z.number().nullable().optional(),
          }),
        )
        .default([]),
      availableFrom: z.string().nullable().optional(),
      availableUntil: z.string().nullable().optional(),
      delivery: takerDeliverySchema,
    })
    .passthrough(),
  state: testTakerStateSchema,
  attemptsUsed: z.number().default(0),
  activeAttempt: z
    .object({
      id: z.string(),
      startedAt: z.string(),
      expiresAt: z.string().nullable().default(null),
      answeredCount: z.number().default(0),
    })
    .nullable()
    .default(null),
});
export type TakerOverviewResponse = z.infer<typeof takerOverviewResponseSchema>;

/* -------------------------------------------------------------------------- */
/* The live attempt                                                            */
/* -------------------------------------------------------------------------- */

export const attemptSchema = z
  .object({
    id: z.string(),
    testId: z.string(),
    status: attemptStatusSchema,
    attemptNumber: z.number().default(1),
    startedAt: z.string(),
    /** Server-authoritative deadline, written once at creation. */
    expiresAt: z.string().nullable().default(null),
    /**
     * The server's clock at the moment it answered. The runtime measures its
     * own drift against this once and counts down on a corrected clock, so a
     * device an hour slow cannot buy its owner an hour of exam time.
     */
    serverTime: z.string(),
    violationCount: z.number().default(0),
    violationLimit: z.number().nullable().default(null),
    honorCodeAcceptedAt: z.string().nullable().default(null),
  })
  .passthrough();
export type Attempt = z.infer<typeof attemptSchema>;

export const savedAnswerSchema = z.object({
  questionId: z.string(),
  value: answerValueSchema.nullable(),
  updatedAt: z.string().optional(),
});
export type SavedAnswer = z.infer<typeof savedAnswerSchema>;

export const attemptResponseSchema = z.object({
  attempt: attemptSchema,
  test: paperTestSchema,
  answers: z.array(savedAnswerSchema).default([]),
});
export type AttemptResponse = z.infer<typeof attemptResponseSchema>;

/** `PATCH /attempts/:id/answers` — carries no grading information by design. */
export const saveAnswersResponseSchema = z.object({
  saved: z.number(),
  serverTime: z.string(),
  expiresAt: z.string().nullable().default(null),
});
export type SaveAnswersResponse = z.infer<typeof saveAnswersResponseSchema>;

/** `POST /attempts/:id/violations` — the server decides what happens. */
export const violationResponseSchema = z.object({
  action: integrityActionSchema,
  violationCount: z.number(),
  violationLimit: z.number().nullable().default(null),
  attemptEnded: z.boolean().default(false),
});
export type ViolationResponse = z.infer<typeof violationResponseSchema>;

export const submitResponseSchema = z.object({
  attempt: z.object({
    id: z.string(),
    status: attemptStatusSchema,
    submittedAt: z.string().nullable().default(null),
    isLate: z.boolean().default(false),
    timeSpentSeconds: z.number().nullable().default(null),
  }),
  resultAvailable: z.boolean().default(false),
});
export type SubmitResponse = z.infer<typeof submitResponseSchema>;

/* -------------------------------------------------------------------------- */
/* GET /attempts/:id/result — the student's own result                         */
/* -------------------------------------------------------------------------- */

/**
 * Release is a normal state, not an error.
 *
 * A result that is not out yet answers `200` with `released: false`, because a
 * student who submitted an hour ago and is waiting for their teacher has done
 * nothing wrong, and a 403 page would tell them they had.
 */
export const attemptResultResponseSchema = z.discriminatedUnion("released", [
  z.object({
    released: z.literal(false),
    releaseMode: z.enum(["IMMEDIATELY", "AFTER_CLOSE", "MANUAL"]),
    availableAt: z.string().nullable().default(null),
  }),
  z.object({
    released: z.literal(true),
    attempt: z
      .object({
        id: z.string(),
        status: attemptStatusSchema,
        submittedAt: z.string().nullable().default(null),
        timeSpentSeconds: z.number().nullable().default(null),
        score: z.number().optional(),
        maxScore: z.number().optional(),
        passed: z.boolean().nullable().optional(),
        isLate: z.boolean().default(false),
        attemptNumber: z.number().default(1),
        attemptsAllowed: z.number().default(1),
      }),
    /** Present only when `delivery.showScore`. */
    breakdown: z
      .object({
        correct: z.number().default(0),
        incorrect: z.number().default(0),
        unanswered: z.number().default(0),
        pendingManual: z.number().default(0),
        sections: z
          .array(
            z.object({
              id: z.string(),
              title: z.string(),
              score: z.number(),
              maxScore: z.number(),
            }),
          )
          .default([]),
      })
      .optional(),
    questions: z
      .array(
        z.object({
          id: z.string(),
          questionNumber: z.number(),
          prompt: z.string(),
          answerKind: z.string(),
          points: z.number().optional(),
          pointsAwarded: z.number().optional(),
          isCorrect: z.boolean().nullable().optional(),
          yourAnswer: answerValueSchema.nullable().default(null),
          // The key, not an answer — a different shape. See `answerKeySchema`.
          correctAnswer: answerKeySchema.nullable().optional(),
          feedback: z.string().nullable().optional(),
        }),
      )
      .optional(),
  }),
]);
export type AttemptResultResponse = z.infer<typeof attemptResultResponseSchema>;
