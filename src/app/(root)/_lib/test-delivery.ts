import { z } from "zod";

/**
 * How a published test is *delivered* to students, as opposed to what it
 * contains.
 *
 * The authoring tree (sections → groups → questions → options) answers "what is
 * asked". This answers "under what conditions" — timing behaviour, navigation,
 * exam-integrity rules, attempts, and when results become visible. It is the set
 * of questions the publish wizard asks before a draft goes live.
 *
 * ## Why these fields and not the ones already on `Test`
 *
 * `durationMinutes`, `shuffleQuestions`, `passingScore`, `availableFrom` and
 * `availableUntil` already exist on the `Test` row and are saved through
 * `PATCH /tests/:testId`. They are deliberately **not** repeated here: two
 * sources of truth for "how long is this test" is precisely the drift that
 * produces a countdown disagreeing with the deadline. Delivery holds only what
 * is genuinely new, and the wizard edits both objects side by side.
 *
 * Per-section timing is likewise absent: a section's `durationMinutes` belongs
 * to the structure tree, is edited in the builder, and is saved by
 * `PUT /tests/:testId/structure`.
 *
 * ## Contract status
 *
 * The backend does not serve or accept this object yet. The full server-side
 * contract — Prisma model, DTO, endpoints, validation, and sanitizer rules — is
 * specified in `backend_nestJS/docs/frontend/test-delivery-and-publish-handoff.md`.
 * Until it ships, `GET /tests/:testId` simply omits `delivery` and every read
 * here falls back to {@link DEFAULT_TEST_DELIVERY}, so the wizard renders a
 * sensible default set rather than an empty form.
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

export const INTEGRITY_ACTIONS = integrityActionSchema.options;

/** Whether students see the whole paper or one question at a time. */
export const navigationModeSchema = z.enum(["ALL_AT_ONCE", "ONE_AT_A_TIME"]);
export type NavigationMode = z.infer<typeof navigationModeSchema>;

export const NAVIGATION_MODES = navigationModeSchema.options;

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

export const RESULTS_RELEASE_MODES = resultsReleaseSchema.options;

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

/** The write shape: complete, no partials, because the wizard always sends all of it. */
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
 * taken through the wizard never silently ejects a student for switching tabs.
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
 * The strict preset offered as one click in the wizard — what a teacher means
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
  leaveScreenAction: "SUBMIT",
  blockCopyPaste: true,
  blockContextMenu: true,
  requireHonorCode: true,
  resultsRelease: "AFTER_CLOSE",
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

/* -------------------------------------------------------------------------- */
/* Derived reads                                                               */
/* -------------------------------------------------------------------------- */

/** True when any rule would end or interrupt an attempt. Drives the "locked down" badge. */
export function isLockedDown(delivery: TestDelivery): boolean {
  return (
    delivery.requireFullscreen ||
    delivery.detectLeaveScreen ||
    delivery.blockCopyPaste ||
    delivery.blockContextMenu ||
    delivery.navigationMode === "ONE_AT_A_TIME"
  );
}

/**
 * Which preset a delivery object corresponds to, or `null` when the teacher has
 * customised it. Compared field by field rather than by a stored preset name,
 * because a stored name goes stale the moment one switch is flipped.
 */
export function matchPreset(delivery: TestDelivery): DeliveryPresetName | null {
  const entry = Object.entries(DELIVERY_PRESETS).find(([, preset]) =>
    (Object.keys(deliveryShape) as (keyof TestDelivery)[]).every(
      (key) => preset[key] === delivery[key],
    ),
  );

  return (entry?.[0] as DeliveryPresetName | undefined) ?? null;
}

/**
 * The integrity rules currently in force, as translation keys plus their action.
 * The confirm step reads these back to the teacher in plain language — a wizard
 * that collects fifteen switches and then says only "Publish?" has not actually
 * confirmed anything.
 */
export function activeIntegrityRules(
  delivery: TestDelivery,
): { key: string; action: IntegrityAction | null }[] {
  const rules: { key: string; action: IntegrityAction | null }[] = [];

  if (delivery.requireFullscreen) {
    rules.push({ key: "requireFullscreen", action: delivery.fullscreenExitAction });
  }
  if (delivery.detectLeaveScreen) {
    rules.push({ key: "detectLeaveScreen", action: delivery.leaveScreenAction });
  }
  if (delivery.blockCopyPaste) rules.push({ key: "blockCopyPaste", action: null });
  if (delivery.blockContextMenu) rules.push({ key: "blockContextMenu", action: null });
  if (delivery.requireHonorCode) rules.push({ key: "requireHonorCode", action: null });
  if (delivery.navigationMode === "ONE_AT_A_TIME") {
    rules.push({ key: "oneAtATime", action: null });
  }
  if (!delivery.allowBackNavigation && delivery.navigationMode === "ONE_AT_A_TIME") {
    rules.push({ key: "noBackNavigation", action: null });
  }
  if (delivery.shuffleOptions) rules.push({ key: "shuffleOptions", action: null });

  return rules;
}

/**
 * `violationLimit` is only read when an action is `COUNT`. Normalising here
 * keeps the confirm summary honest — showing "3 violations allowed" beside a
 * rule set to `SUBMIT` would describe behaviour the student will never see.
 */
export function effectiveViolationLimit(delivery: TestDelivery): number | null {
  const counts =
    (delivery.requireFullscreen && delivery.fullscreenExitAction === "COUNT") ||
    (delivery.detectLeaveScreen && delivery.leaveScreenAction === "COUNT");

  return counts ? delivery.violationLimit : null;
}
