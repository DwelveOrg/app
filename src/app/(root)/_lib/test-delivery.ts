import { z } from "zod";

/**
 * How a published test is *delivered* to students, as opposed to what it
 * contains.
 *
 * The authoring tree (sections → groups → questions → options) answers "what is
 * asked". This answers "under what conditions" — timing behaviour, navigation,
 * exam-integrity rules, attempts, and when results become visible. It is the set
 * of decisions the publish screen resolves before a draft goes live.
 *
 * ## Why these fields and not the ones already on `Test`
 *
 * `durationMinutes`, `shuffleQuestions`, `passingScore`, `availableFrom` and
 * `availableUntil` already exist on the `Test` row and are saved through
 * `PATCH /tests/:testId`. They are deliberately **not** repeated here: two
 * sources of truth for "how long is this test" is precisely the drift that
 * produces a countdown disagreeing with the deadline. Delivery holds only what
 * is genuinely new, and the publish screen edits both objects side by side.
 *
 * Per-section timing is likewise absent: a section's `durationMinutes` belongs
 * to the structure tree, is edited in the builder, and is saved by
 * `PUT /tests/:testId/structure`.
 *
 * ## Contract status
 *
 * Shipped on both sides. `GET /tests/:testId` serves `delivery` and
 * `PUT /tests/:testId/delivery` replaces it; the server-side contract lives in
 * `backend_nestJS/docs/features/tests.md`. Every field still carries a default
 * so a test written before the model existed — or served by an older server —
 * reads as {@link DEFAULT_TEST_DELIVERY} rather than as an empty form.
 */

/* -------------------------------------------------------------------------- */
/* Enumerations                                                                */
/* -------------------------------------------------------------------------- */

/**
 * What happens when a student breaks an integrity rule.
 *
 * Three levels rather than a bare on/off, because the same rule means different
 * things to different teachers: a low-stakes homework quiz wants a nudge, a
 * mock exam wants a recorded count, and a final wants the paper closed.
 */
export const integrityActionSchema = z.enum([
  /** Show the student a warning. Nothing is recorded against them. */
  "WARN",
  /** Record a violation; the attempt ends once `violationLimit` is reached. */
  "COUNT",
  /** End and submit the attempt on the first occurrence. */
  "SUBMIT",
]);
export type IntegrityAction = z.infer<typeof integrityActionSchema>;

/** Whether students see the whole paper or one question at a time. */
export const navigationModeSchema = z.enum(["ALL_AT_ONCE", "ONE_AT_A_TIME"]);
export type NavigationMode = z.infer<typeof navigationModeSchema>;

/** When a student may see how they did. */
export const resultsReleaseSchema = z.enum([
  /** As soon as they submit. */
  "IMMEDIATELY",
  /** Once the availability window closes — the default for a real exam. */
  "AFTER_CLOSE",
  /** Never automatically; a teacher releases them by hand. */
  "MANUAL",
]);
export type ResultsRelease = z.infer<typeof resultsReleaseSchema>;

/* -------------------------------------------------------------------------- */
/* Limits                                                                      */
/* -------------------------------------------------------------------------- */

export const DELIVERY_LIMITS = {
  /** Minutes before expiry at which the countdown starts insisting. */
  minTimeWarning: 1,
  maxTimeWarning: 120,
  minViolationLimit: 1,
  maxViolationLimit: 20,
  minAttempts: 1,
  maxAttempts: 10,
} as const;

/* -------------------------------------------------------------------------- */
/* The object itself                                                           */
/* -------------------------------------------------------------------------- */

const deliveryShape = {
  /* --- Timing ------------------------------------------------------------ */

  /** Show a live countdown. Off is a real choice: a visible clock raises anxiety. */
  showTimer: z.boolean(),
  /** Minutes remaining at which the countdown turns into a warning. */
  timeWarningMinutes: z
    .number()
    .int()
    .min(DELIVERY_LIMITS.minTimeWarning)
    .max(DELIVERY_LIMITS.maxTimeWarning)
    .nullable(),
  /** Submit whatever is answered when the clock runs out, rather than blocking. */
  autoSubmitOnExpiry: z.boolean(),

  /* --- Navigation -------------------------------------------------------- */

  navigationMode: navigationModeSchema,
  /** Only meaningful for `ONE_AT_A_TIME`; ignored when the whole paper is shown. */
  allowBackNavigation: z.boolean(),
  /**
   * Shuffles each question's options. Separate from `Test.shuffleQuestions`,
   * which shuffles the questions themselves — a matching or ordering question
   * must never have its options shuffled, so the two cannot be one switch.
   */
  shuffleOptions: z.boolean(),

  /* --- Integrity --------------------------------------------------------- */

  /** Require the browser to be in fullscreen before the attempt starts. */
  requireFullscreen: z.boolean(),
  fullscreenExitAction: integrityActionSchema,
  /** Watch for the tab losing visibility or the window losing focus. */
  detectLeaveScreen: z.boolean(),
  leaveScreenAction: integrityActionSchema,
  /** Violations tolerated before the attempt ends. Only read by `COUNT`. */
  violationLimit: z
    .number()
    .int()
    .min(DELIVERY_LIMITS.minViolationLimit)
    .max(DELIVERY_LIMITS.maxViolationLimit)
    .nullable(),
  blockCopyPaste: z.boolean(),
  blockContextMenu: z.boolean(),
  /** A "I will not cheat" acknowledgement gate before question one. */
  requireHonorCode: z.boolean(),

  /* --- Attempts ---------------------------------------------------------- */

  attemptsAllowed: z
    .number()
    .int()
    .min(DELIVERY_LIMITS.minAttempts)
    .max(DELIVERY_LIMITS.maxAttempts),
  /** Accept a submission that arrives after `availableUntil`, flagged as late. */
  allowLateSubmission: z.boolean(),

  /* --- Results ----------------------------------------------------------- */

  resultsRelease: resultsReleaseSchema,
  showScore: z.boolean(),
  /** Reveal the answer key. Independent of the score — most exams show one, not both. */
  showCorrectAnswers: z.boolean(),
  showFeedback: z.boolean(),
} as const;

/**
 * The read shape. Every field carries a default so a backend that has not
 * shipped the model yet — or has shipped only part of it — still produces a
 * complete object rather than a form full of `undefined`.
 */
export const testDeliverySchema = z
  .object(deliveryShape)
  .partial()
  .transform((value) => ({ ...DEFAULT_TEST_DELIVERY, ...stripUndefined(value) }));

/** The write shape: complete, no partials, because publishing always sends all of it. */
export const testDeliveryInputSchema = z.object(deliveryShape);
export type TestDelivery = z.infer<typeof testDeliveryInputSchema>;

function stripUndefined<T extends object>(value: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(value).filter(([, entry]) => entry !== undefined),
  ) as Partial<T>;
}

/**
 * What an unconfigured test behaves like.
 *
 * Chosen to be the *least surprising* delivery, not the strictest one: nothing
 * is locked down, the whole paper is visible, and results appear on submit.
 * Integrity rules are a deliberate act by the teacher, so a test that was never
 * taken through the publish screen never silently ejects a student for switching tabs.
 */
export const DEFAULT_TEST_DELIVERY: TestDelivery = {
  showTimer: true,
  timeWarningMinutes: 5,
  autoSubmitOnExpiry: true,

  navigationMode: "ALL_AT_ONCE",
  allowBackNavigation: true,
  shuffleOptions: false,

  requireFullscreen: false,
  fullscreenExitAction: "WARN",
  detectLeaveScreen: false,
  leaveScreenAction: "WARN",
  violationLimit: 3,
  blockCopyPaste: false,
  blockContextMenu: false,
  requireHonorCode: false,

  attemptsAllowed: 1,
  allowLateSubmission: false,

  resultsRelease: "IMMEDIATELY",
  showScore: true,
  showCorrectAnswers: false,
  showFeedback: true,
};

/**
 * The strict preset offered as one click on the publish screen — what a teacher means
 * by "make this a real exam".
 */
export const PROCTORED_TEST_DELIVERY: TestDelivery = {
  ...DEFAULT_TEST_DELIVERY,
  navigationMode: "ONE_AT_A_TIME",
  allowBackNavigation: false,
  shuffleOptions: true,
  requireFullscreen: true,
  fullscreenExitAction: "COUNT",
  detectLeaveScreen: true,
  leaveScreenAction: "COUNT",
  blockCopyPaste: true,
  blockContextMenu: true,
  requireHonorCode: true,
  resultsRelease: "MANUAL",
  showCorrectAnswers: false,
};

/** The relaxed preset — a practice paper students can learn from. */
export const PRACTICE_TEST_DELIVERY: TestDelivery = {
  ...DEFAULT_TEST_DELIVERY,
  showTimer: false,
  timeWarningMinutes: null,
  autoSubmitOnExpiry: false,
  attemptsAllowed: 3,
  allowLateSubmission: true,
  showCorrectAnswers: true,
  showFeedback: true,
};

export const DELIVERY_PRESETS = {
  practice: PRACTICE_TEST_DELIVERY,
  standard: DEFAULT_TEST_DELIVERY,
  proctored: PROCTORED_TEST_DELIVERY,
} as const;

export type DeliveryPresetName = keyof typeof DELIVERY_PRESETS;
