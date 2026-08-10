import { z } from "zod";

import { testAnswerKindSchema } from "@/app/(root)/_lib/tests.schemas";
import {
  integrityActionSchema,
  navigationModeSchema,
  DEFAULT_TEST_DELIVERY,
} from "@/app/(root)/_lib/test-delivery";

/**
 * The paper as anyone other than its author sees it.
 *
 * This mirrors `sanitizeTestForTaker()` in `backend_nestJS/src/tests/tests.service.ts`
 * — the serializer that exists precisely so the answer key cannot leak into a
 * student's payload. The schemas below are the frontend half of that guarantee:
 * they **do not describe** `option.isCorrect`, `option.matchKey`, or the private
 * half of `config`, so a backend regression that started sending them would be
 * dropped here rather than reaching a component that might render it.
 *
 * Used by three surfaces, which is the point:
 *
 * - the exam runtime, where a student answers it;
 * - the teacher's review of a submission, which renders the same tree with the
 *   key alongside;
 * - the studio's student preview.
 *
 * One tree, one renderer, so "what the student saw" and "what the teacher
 * reviews" cannot drift apart.
 */

/* -------------------------------------------------------------------------- */
/* Delivery, as the taker receives it                                          */
/* -------------------------------------------------------------------------- */

/**
 * The sixteen delivery fields a student client needs to enforce timing and
 * integrity.
 *
 * Deliberately **not** `testDeliverySchema`: that one defaults the four
 * results-release fields, and a defaulted `showCorrectAnswers` on the student
 * side is a default that decides whether an answer key is rendered. The server
 * resolves release and sends a single `resultAvailable` boolean instead; there
 * is nothing here for the client to get wrong.
 */
export const takerDeliverySchema = z
  .object({
    showTimer: z.boolean(),
    timeWarningMinutes: z.number().nullable(),
    autoSubmitOnExpiry: z.boolean(),
    navigationMode: navigationModeSchema,
    allowBackNavigation: z.boolean(),
    shuffleOptions: z.boolean(),
    requireFullscreen: z.boolean(),
    fullscreenExitAction: integrityActionSchema,
    detectLeaveScreen: z.boolean(),
    leaveScreenAction: integrityActionSchema,
    violationLimit: z.number().nullable(),
    blockCopyPaste: z.boolean(),
    blockContextMenu: z.boolean(),
    requireHonorCode: z.boolean(),
    attemptsAllowed: z.number(),
    allowLateSubmission: z.boolean(),
  })
  .partial()
  .transform((value) => ({ ...TAKER_DELIVERY_FALLBACK, ...stripUndefined(value) }));

export type TakerDelivery = z.output<typeof takerDeliverySchema>;

/**
 * What a paper behaves like when the server sends no delivery at all — a test
 * written before the model existed. The least surprising delivery, never the
 * strictest: an unconfigured test must not eject a student for switching tabs.
 */
const TAKER_DELIVERY_FALLBACK = {
  showTimer: DEFAULT_TEST_DELIVERY.showTimer,
  timeWarningMinutes: DEFAULT_TEST_DELIVERY.timeWarningMinutes,
  autoSubmitOnExpiry: DEFAULT_TEST_DELIVERY.autoSubmitOnExpiry,
  navigationMode: DEFAULT_TEST_DELIVERY.navigationMode,
  allowBackNavigation: DEFAULT_TEST_DELIVERY.allowBackNavigation,
  shuffleOptions: DEFAULT_TEST_DELIVERY.shuffleOptions,
  requireFullscreen: DEFAULT_TEST_DELIVERY.requireFullscreen,
  fullscreenExitAction: DEFAULT_TEST_DELIVERY.fullscreenExitAction,
  detectLeaveScreen: DEFAULT_TEST_DELIVERY.detectLeaveScreen,
  leaveScreenAction: DEFAULT_TEST_DELIVERY.leaveScreenAction,
  violationLimit: DEFAULT_TEST_DELIVERY.violationLimit,
  blockCopyPaste: DEFAULT_TEST_DELIVERY.blockCopyPaste,
  blockContextMenu: DEFAULT_TEST_DELIVERY.blockContextMenu,
  requireHonorCode: DEFAULT_TEST_DELIVERY.requireHonorCode,
  attemptsAllowed: DEFAULT_TEST_DELIVERY.attemptsAllowed,
  allowLateSubmission: DEFAULT_TEST_DELIVERY.allowLateSubmission,
};

function stripUndefined<T extends object>(value: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(value).filter(([, entry]) => entry !== undefined),
  ) as Partial<T>;
}

/* -------------------------------------------------------------------------- */
/* The tree                                                                    */
/* -------------------------------------------------------------------------- */

export const paperOptionSchema = z
  .object({
    id: z.string(),
    text: z.string(),
    label: z.string().nullable().optional(),
    imageUrl: z.string().nullable().optional(),
    orderIndex: z.number(),
  })
  .passthrough();
export type PaperOption = z.infer<typeof paperOptionSchema>;

/**
 * The public half of `config` — what the question *asks*, never how it is
 * marked.
 *
 * `rightItems` is here because a matching question is unanswerable without the
 * pool to match against; the pairing, which is the actual key, lives in each
 * option's `matchKey` and is not served. Word limits are here because they are
 * printed on the paper.
 */
export const paperQuestionConfigSchema = z
  .object({
    rightItems: z
      .array(z.object({ key: z.string(), text: z.string() }))
      .optional(),
    minWords: z.number().nullable().optional(),
    maxWords: z.number().nullable().optional(),
  })
  .passthrough();
export type PaperQuestionConfig = z.infer<typeof paperQuestionConfigSchema>;

export const paperQuestionSchema = z
  .object({
    id: z.string(),
    type: z.string(),
    answerKind: testAnswerKindSchema,
    prompt: z.string(),
    helpText: z.string().nullable().optional(),
    imageUrl: z.string().nullable().optional(),
    orderIndex: z.number(),
    points: z.number(),
    /** Computed server-side by walking the tree; 1-based across the whole test. */
    questionNumber: z.number(),
    config: paperQuestionConfigSchema.nullable().optional(),
    options: z.array(paperOptionSchema).default([]),
  })
  .passthrough();
export type PaperQuestion = z.infer<typeof paperQuestionSchema>;

/**
 * A wire group, which on this side of the product is simply the shared material
 * plus the questions that refer to it. The student is never told it is a
 * container any more than the teacher is.
 */
export const paperMaterialSchema = z
  .object({
    id: z.string(),
    title: z.string().nullable().optional(),
    passage: z.string().nullable().optional(),
    instructions: z.string().nullable().optional(),
    imageUrl: z.string().nullable().optional(),
    orderIndex: z.number(),
    questions: z.array(paperQuestionSchema).default([]),
  })
  .passthrough();
export type PaperMaterial = z.infer<typeof paperMaterialSchema>;

export const paperSectionSchema = z
  .object({
    id: z.string(),
    title: z.string(),
    instructions: z.string().nullable().optional(),
    kind: z.string(),
    orderIndex: z.number(),
    durationMinutes: z.number().nullable().optional(),
    groups: z.array(paperMaterialSchema).default([]),
  })
  .passthrough();
export type PaperSection = z.infer<typeof paperSectionSchema>;

export const paperTestSchema = z
  .object({
    id: z.string(),
    title: z.string(),
    description: z.string().nullable().optional(),
    format: z.string(),
    instructions: z.string().nullable().optional(),
    durationMinutes: z.number().nullable().optional(),
    totalPoints: z.number(),
    shuffleQuestions: z.boolean().optional(),
    availableFrom: z.string().nullable().optional(),
    availableUntil: z.string().nullable().optional(),
    delivery: takerDeliverySchema,
    sections: z.array(paperSectionSchema).default([]),
  })
  .passthrough();
export type PaperTest = z.infer<typeof paperTestSchema>;

/* -------------------------------------------------------------------------- */
/* Flattening                                                                  */
/* -------------------------------------------------------------------------- */

/** One question, with everything the renderer needs about where it sits. */
export type PaperItem = {
  question: PaperQuestion;
  section: PaperSection;
  /** The shared material above it, or `null` when it stands on its own. */
  material: PaperMaterial | null;
  /** True for the first question under a material — where the material renders. */
  opensMaterial: boolean;
  /** 0-based position in the whole paper, for one-at-a-time navigation. */
  index: number;
};

/**
 * The paper as one ordered list.
 *
 * Every consumer wants this: the runtime pages through it, the navigator grids
 * it, the review lists it, and the "3 unanswered" count sums it. Walking the
 * three-level tree at each of those call sites is four chances to disagree
 * about the order, and the order is the question numbering.
 */
export function flattenPaper(test: PaperTest): PaperItem[] {
  const items: PaperItem[] = [];

  for (const section of test.sections) {
    for (const material of section.groups) {
      const hasMaterial = Boolean(
        material.passage || material.imageUrl || material.instructions,
      );

      material.questions.forEach((question, questionIndex) => {
        items.push({
          question,
          section,
          material: hasMaterial ? material : null,
          opensMaterial: hasMaterial && questionIndex === 0,
          index: items.length,
        });
      });
    }
  }

  return items;
}

/** Total points on the paper, as the tree stands. */
export function paperPoints(test: PaperTest): number {
  return flattenPaper(test).reduce((total, item) => total + item.question.points, 0);
}
