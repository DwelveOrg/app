import { z } from "zod";

import { DEFAULT_TEST_DELIVERY, testDeliverySchema } from "./test-delivery";

/**
 * Zod schemas for the tests authoring API. Shapes mirror the NestJS
 * `TestsService` sanitizers exactly (see `backend_nestJS/docs/features/tests.md`).
 * `.passthrough()` keeps forward-compatible backend-owned fields (timestamps,
 * ids) from failing validation.
 *
 * Deliberately **not** enums: `type` (the question-type preset), `format`, and
 * `family`. The catalogue is served by `GET /tests/formats`, and duplicating it
 * here is exactly the drift the feature design exists to prevent. Only
 * `answerKind` (the seven grading engines) and `status` are closed sets, because
 * the UI switches on them.
 */

export const testStatusSchema = z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]);
export type TestStatus = z.infer<typeof testStatusSchema>;

/** The seven storage/grading engines. Derived server-side from `type`. */
export const testAnswerKindSchema = z.enum([
  "SINGLE_CHOICE",
  "MULTI_CHOICE",
  "TEXT",
  "NUMERIC",
  "MATCHING",
  "ORDERING",
  "MANUAL",
]);
export type TestAnswerKind = z.infer<typeof testAnswerKindSchema>;

/* -------------------------------------------------------------------------- */
/* Catalogue: GET /tests/formats                                               */
/* -------------------------------------------------------------------------- */

/** One preset in the tabbed question picker. `family` names its tab. */
export const questionTypeSpecSchema = z
  .object({
    family: z.string(),
    answerKind: testAnswerKindSchema,
    labelKey: z.string(),
    descriptionKey: z.string(),
    requiresGroupStimulus: z.boolean(),
    autoGradable: z.boolean(),
    defaultPoints: z.number(),
    minOptions: z.number().optional(),
    maxOptions: z.number().optional(),
    fixedOptions: z.array(z.string()).optional(),
  })
  .passthrough();
export type QuestionTypeSpec = z.infer<typeof questionTypeSpecSchema>;

export const sectionPresetSchema = z
  .object({
    kind: z.string(),
    titleKey: z.string(),
    defaultDurationMinutes: z.number().nullable().optional(),
  })
  .passthrough();
export type SectionPreset = z.infer<typeof sectionPresetSchema>;

/** What a format allows and how the builder should render it. */
export const formatBlueprintSchema = z
  .object({
    labelKey: z.string(),
    defaultDurationMinutes: z.number().nullable().optional(),
    sectionPresets: z.array(sectionPresetSchema).default([]),
    allowedQuestionTypes: z.array(z.string()).default([]),
    allowsCustomSections: z.boolean(),
    requiresGroupStimulus: z.boolean(),
    hidesStructure: z.boolean(),
  })
  .passthrough();
export type FormatBlueprint = z.infer<typeof formatBlueprintSchema>;

/** `GET /tests/formats` - both registries, keyed by their enum value. */
export const testFormatsResponseSchema = z.object({
  formats: z.record(z.string(), formatBlueprintSchema),
  questionTypes: z.record(z.string(), questionTypeSpecSchema),
});
export type TestFormatsResponse = z.infer<typeof testFormatsResponseSchema>;
export type QuestionTypeCatalog = TestFormatsResponse["questionTypes"];
export type FormatBlueprintRegistry = TestFormatsResponse["formats"];

/* -------------------------------------------------------------------------- */
/* The test tree                                                               */
/* -------------------------------------------------------------------------- */

/**
 * Answer-key payload. Which fields are populated depends on the question's
 * `answerKind`; the backend validates it with a discriminated validator on
 * every write, so this stays permissive enough to round-trip anything it
 * accepted.
 */
export const questionConfigSchema = z
  .object({
    acceptedAnswers: z.array(z.string()).optional(),
    caseSensitive: z.boolean().optional(),
    maxWords: z.number().nullable().optional(),
    minWords: z.number().nullable().optional(),
    answer: z.number().nullable().optional(),
    tolerance: z.number().nullable().optional(),
    /**
     * `[min, max]`, ascending — a tuple, not an object. `tests.validation.ts`
     * rejects anything else with a 400.
     */
    acceptedRange: z.tuple([z.number(), z.number()]).nullable().optional(),
    rubric: z.string().nullable().optional(),
    rightItems: z.array(z.object({ key: z.string(), text: z.string() })).optional(),
  })
  .passthrough();
export type QuestionConfig = z.infer<typeof questionConfigSchema>;

export const testQuestionOptionSchema = z
  .object({
    id: z.string(),
    text: z.string(),
    label: z.string().nullable().optional(),
    imageUrl: z.string().nullable().optional(),
    orderIndex: z.number(),
    isCorrect: z.boolean().optional(),
    matchKey: z.string().nullable().optional(),
  })
  .passthrough();
export type ApiTestQuestionOption = z.infer<typeof testQuestionOptionSchema>;

export const testQuestionSchema = z
  .object({
    id: z.string(),
    type: z.string(),
    answerKind: testAnswerKindSchema,
    prompt: z.string(),
    helpText: z.string().nullable().optional(),
    imageUrl: z.string().nullable().optional(),
    orderIndex: z.number(),
    points: z.number(),
    /** Computed at read time by the backend; never stored, never sent back. */
    questionNumber: z.number().optional(),
    config: questionConfigSchema.nullable().optional(),
    options: z.array(testQuestionOptionSchema).default([]),
  })
  .passthrough();
export type ApiTestQuestion = z.infer<typeof testQuestionSchema>;

export const testQuestionGroupSchema = z
  .object({
    id: z.string(),
    title: z.string().nullable().optional(),
    passage: z.string().nullable().optional(),
    instructions: z.string().nullable().optional(),
    imageUrl: z.string().nullable().optional(),
    orderIndex: z.number(),
    questions: z.array(testQuestionSchema).default([]),
  })
  .passthrough();
export type ApiTestQuestionGroup = z.infer<typeof testQuestionGroupSchema>;

export const testSectionSchema = z
  .object({
    id: z.string(),
    title: z.string(),
    instructions: z.string().nullable().optional(),
    kind: z.string(),
    orderIndex: z.number(),
    durationMinutes: z.number().nullable().optional(),
    groups: z.array(testQuestionGroupSchema).default([]),
  })
  .passthrough();
export type ApiTestSection = z.infer<typeof testSectionSchema>;

/** Fields shared by the list rows and the full tree. */
const testBaseShape = {
  id: z.string(),
  schoolId: z.string().optional(),
  classId: z.string(),
  createdById: z.string().nullable().optional(),
  title: z.string(),
  description: z.string().nullable().optional(),
  format: z.string(),
  status: testStatusSchema,
  instructions: z.string().nullable().optional(),
  durationMinutes: z.number().nullable().optional(),
  totalPoints: z.number().default(0),
  passingScore: z.number().nullable().optional(),
  shuffleQuestions: z.boolean().optional(),
  availableFrom: z.string().nullable().optional(),
  availableUntil: z.string().nullable().optional(),
  publishedAt: z.string().nullable().optional(),
  archivedAt: z.string().nullable().optional(),
  createdAt: z.union([z.string(), z.date()]).optional(),
  updatedAt: z.union([z.string(), z.date()]).optional(),
  /**
   * Delivery and exam-integrity rules, collected by the publish screen.
   *
   * Defaulted rather than optional: a test written before the model existed has
   * no `TestDelivery` row, and a screen opening onto `undefined` would have
   * nothing to render. Such a test behaves exactly as tests behaved before the
   * feature, because `DEFAULT_TEST_DELIVERY` locks nothing down.
   */
  delivery: testDeliverySchema.default(DEFAULT_TEST_DELIVERY),
  /**
   * Roll-ups for the list card. The contract does not promise them, so the card
   * falls back to a dash rather than inventing a number.
   */
  counts: z
    .object({
      sections: z.number(),
      groups: z.number(),
      questions: z.number(),
      students: z.number(),
    })
    .partial()
    .optional(),
  questionCount: z.number().optional(),
};

/** A row in `GET /classes/:classId/tests`. */
export const testSummarySchema = z.object(testBaseShape).passthrough();
export type ApiTestSummary = z.infer<typeof testSummarySchema>;

/** `GET /tests/:testId` - the full tree, including the answer key. */
export const testDetailSchema = z
  .object({
    ...testBaseShape,
    sections: z.array(testSectionSchema).default([]),
  })
  .passthrough();
export type ApiTestDetail = z.infer<typeof testDetailSchema>;

/* -------------------------------------------------------------------------- */
/* Response envelopes                                                          */
/* -------------------------------------------------------------------------- */

/** Pagination envelope, identical to the classes/enrollment lists. */
export const testsPaginationMetaSchema = z.object({
  page: z.number(),
  limit: z.number(),
  total: z.number(),
  totalPages: z.number(),
  hasMore: z.boolean(),
});
export type TestsPaginationMeta = z.infer<typeof testsPaginationMetaSchema>;

export const testsListResponseSchema = z.object({
  tests: z.array(testSummarySchema),
  meta: testsPaginationMetaSchema,
});
export type TestsListResponse = z.infer<typeof testsListResponseSchema>;

export const testDetailResponseSchema = z.object({ test: testDetailSchema });
export type TestDetailResponse = z.infer<typeof testDetailResponseSchema>;

export const testSummaryResponseSchema = z.object({ test: testSummarySchema });
export type TestSummaryResponse = z.infer<typeof testSummaryResponseSchema>;

/** One blocking problem found by `validateTestForPublish()`. */
export const testValidationIssueSchema = z
  .object({
    code: z.string(),
    messageKey: z.string(),
    severity: z.enum(["BLOCKING", "WARNING"]).default("BLOCKING"),
    sectionId: z.string().nullable().optional(),
    groupId: z.string().nullable().optional(),
    questionId: z.string().nullable().optional(),
  })
  .passthrough();
export type TestValidationIssue = z.infer<typeof testValidationIssueSchema>;

/** `GET /tests/:testId/validation` - publish readiness. */
export const testValidationResponseSchema = z.object({
  ok: z.boolean(),
  issues: z.array(testValidationIssueSchema).default([]),
});
export type TestValidationResponse = z.infer<typeof testValidationResponseSchema>;

/** `POST /tests/:testId/media` - one uploaded image. */
export const testMediaResponseSchema = z
  .object({ url: z.string() })
  .passthrough();
export type TestMediaResponse = z.infer<typeof testMediaResponseSchema>;

export const testSuccessResponseSchema = z
  .object({ success: z.boolean() })
  .passthrough();
