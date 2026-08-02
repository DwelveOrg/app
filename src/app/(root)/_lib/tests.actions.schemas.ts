import { z } from "zod";

import { imageFileSchema } from "./actions.schemas";

/**
 * Input schemas for the tests server actions **and** the builder form.
 *
 * Kept in a plain module (not a `"use server"` file, which may only export
 * async functions) so both the actions and the client `zodResolver` can import
 * from it — the same split as `actions.schemas.ts`.
 *
 * Two families live here:
 *
 * - *wire* schemas (`saveTestStructureSchema`, …) describe what goes to the
 *   backend. They never carry `answerKind` (derived server-side from `type`) or
 *   `questionNumber` (computed at read time), and they echo existing `id`s so
 *   rows are updated rather than recreated.
 * - *form* schemas (`testBuilderFormSchema`) describe what react-hook-form
 *   holds. The form flattens `config` so a single set of fields can back every
 *   answer-kind editor; `buildStructurePayload` narrows it per answer kind.
 */

/* -------------------------------------------------------------------------- */
/* Backend DTO caps (backend_nestJS/docs/features/tests.md, "Guardrails")       */
/* -------------------------------------------------------------------------- */

export const TEST_LIMITS = {
  sectionsPerTest: 20,
  groupsPerSection: 20,
  questionsPerGroup: 100,
  questionsPerTest: 300,
  passageChars: 20_000,
  promptChars: 2_000,
  optionsPerQuestion: 26,
  titleChars: 200,
  /** Section and group instructions (`SaveTest*Dto`). */
  instructionsChars: 2_000,
  /** Test-level instructions (`UpdateTestDto` allows 10 000). */
  testInstructionsChars: 4_000,
  optionChars: 2_000,
  optionLabelChars: 16,
  matchKeyChars: 120,
} as const;

/* -------------------------------------------------------------------------- */
/* Wire schemas                                                                */
/* -------------------------------------------------------------------------- */

/** An id echoed back from a previous read, or absent for a brand-new row. */
const echoedId = z.string().min(1).optional();

export const saveOptionSchema = z.object({
  id: echoedId,
  // `@IsNotEmpty()` on the backend: a blank option is a 400, not a stored blank.
  text: z.string().min(1).max(TEST_LIMITS.optionChars),
  label: z.string().max(TEST_LIMITS.optionLabelChars).optional(),
  imageUrl: z.string().optional(),
  isCorrect: z.boolean(),
  matchKey: z.string().max(TEST_LIMITS.matchKeyChars).optional(),
});

export const saveQuestionSchema = z.object({
  id: echoedId,
  // Never `answerKind`: the backend derives it from `type`.
  type: z.string().min(1),
  prompt: z.string().min(1).max(TEST_LIMITS.promptChars),
  helpText: z.string().max(2_000).optional(),
  imageUrl: z.string().optional(),
  // `@IsInt() @Min(0)` on the backend — fractional points are rejected.
  points: z.number().int().min(0).max(1_000),
  config: z.record(z.string(), z.unknown()).optional(),
  options: z.array(saveOptionSchema).max(TEST_LIMITS.optionsPerQuestion),
});

export const saveGroupSchema = z.object({
  id: echoedId,
  title: z.string().min(1).max(TEST_LIMITS.titleChars).optional(),
  passage: z.string().min(1).max(TEST_LIMITS.passageChars).optional(),
  instructions: z.string().min(1).max(TEST_LIMITS.instructionsChars).optional(),
  imageUrl: z.string().optional(),
  questions: z.array(saveQuestionSchema).max(TEST_LIMITS.questionsPerGroup),
});

export const saveSectionSchema = z.object({
  id: echoedId,
  title: z.string().min(1).max(TEST_LIMITS.titleChars),
  instructions: z.string().max(TEST_LIMITS.instructionsChars).optional(),
  kind: z.string().min(1),
  durationMinutes: z.number().int().min(1).max(600).optional(),
  groups: z.array(saveGroupSchema).max(TEST_LIMITS.groupsPerSection),
});

/** `PUT /tests/:testId/structure` - the whole-tree replace. */
export const saveTestStructureSchema = z.object({
  testId: z.string().min(1),
  sections: z
    .array(saveSectionSchema)
    .min(1)
    .max(TEST_LIMITS.sectionsPerTest)
    .refine(
      (sections) =>
        sections.reduce(
          (total, section) =>
            total +
            section.groups.reduce((count, group) => count + group.questions.length, 0),
          0,
        ) <= TEST_LIMITS.questionsPerTest,
      { message: `A test may hold at most ${TEST_LIMITS.questionsPerTest} questions.` },
    ),
});
export type SaveTestStructureInput = z.infer<typeof saveTestStructureSchema>;
export type SaveSectionInput = z.infer<typeof saveSectionSchema>;
export type SaveGroupInput = z.infer<typeof saveGroupSchema>;
export type SaveQuestionInput = z.infer<typeof saveQuestionSchema>;
export type SaveOptionInput = z.infer<typeof saveOptionSchema>;

/** `POST /classes/:classId/tests` - creates a DRAFT and opens the builder. */
export const createTestSchema = z.object({
  classId: z.string().min(1),
  title: z.string().trim().min(1).max(TEST_LIMITS.titleChars),
  format: z.string().min(1),
});
export type CreateTestInput = z.infer<typeof createTestSchema>;

/**
 * `PATCH /tests/:testId` - metadata only. Every field is optional so the
 * settings dialog can send just what changed. Datetimes are ISO strings.
 */
export const updateTestSchema = z.object({
  testId: z.string().min(1),
  title: z.string().trim().min(1).max(TEST_LIMITS.titleChars).optional(),
  description: z.string().trim().max(1_000).optional(),
  instructions: z.string().trim().max(TEST_LIMITS.testInstructionsChars).optional(),
  durationMinutes: z.number().int().min(1).max(600).nullable().optional(),
  passingScore: z.number().int().min(0).max(100_000).nullable().optional(),
  shuffleQuestions: z.boolean().optional(),
  availableFrom: z.string().nullable().optional(),
  availableUntil: z.string().nullable().optional(),
});
export type UpdateTestInput = z.infer<typeof updateTestSchema>;

/** Every single-test action shares this shape. */
export const testIdSchema = z.object({ testId: z.string().min(1) });
export type TestIdInput = z.infer<typeof testIdSchema>;

export const publishTestSchema = testIdSchema;
export const unpublishTestSchema = testIdSchema;
export const deleteTestSchema = testIdSchema;
export const duplicateTestSchema = testIdSchema;

/** `POST /tests/:testId/media` - one image for a passage or a question. */
export const uploadTestMediaSchema = z.object({
  testId: z.string().min(1),
  image: imageFileSchema,
});
export type UploadTestMediaInput = z.infer<typeof uploadTestMediaSchema>;

/** `GET /classes/:classId/tests` query. */
export const listTestsSchema = z.object({
  classId: z.string().min(1),
  status: z.string().optional(),
  page: z.number().int().min(1).optional(),
  limit: z.number().int().min(1).max(100).optional(),
});
export type ListTestsInput = z.infer<typeof listTestsSchema>;

/* -------------------------------------------------------------------------- */
/* Builder form schema                                                         */
/* -------------------------------------------------------------------------- */

/**
 * A number field that is empty in the DOM. `valueAsNumber` yields `NaN` for an
 * empty input, so the editors normalise to `null` and this accepts it.
 */
const formNumber = z.number().nullable();

/**
 * The flattened answer key the editors write into. Only the fields relevant to
 * a question's `answerKind` are read back out at submit time, so a teacher who
 * switches nothing loses nothing.
 */
export const questionConfigFormSchema = z.object({
  /** TEXT - wrapped in objects because `useFieldArray` needs object items. */
  acceptedAnswers: z.array(z.object({ value: z.string() })),
  caseSensitive: z.boolean(),
  maxWords: formNumber,
  minWords: formNumber,
  /** NUMERIC */
  answer: formNumber,
  tolerance: formNumber,
  rangeMin: formNumber,
  rangeMax: formNumber,
  /** MANUAL */
  rubric: z.string(),
  /** MATCHING - the right-hand items each option's `matchKey` resolves to. */
  rightItems: z.array(z.object({ key: z.string(), text: z.string() })),
});
export type QuestionConfigForm = z.infer<typeof questionConfigFormSchema>;

/**
 * Form rows carry the backend id as `serverId`, not `id`.
 *
 * `useFieldArray` overwrites `id` on every item of its `fields` snapshot with
 * its own generated key, so a field named `id` would be unreadable in exactly
 * the place the builder needs it (deep-link anchors). The form values sent to
 * `buildStructurePayload` map `serverId` back onto the wire `id`.
 */
export const optionFormSchema = z.object({
  serverId: z.string(),
  // Required, because the backend rejects a blank option outright. Leaving a
  // half-written option behind is not something a draft save can absorb.
  // The message is an i18n **key**: this schema is shared by the server action
  // and the client resolver, and only the client can translate. `RowTextInput`
  // runs it through `t()`.
  text: z
    .string()
    .trim()
    .min(1, "root.tests.builder.options.textRequired")
    .max(TEST_LIMITS.optionChars),
  label: z.string().max(TEST_LIMITS.optionLabelChars),
  imageUrl: z.string(),
  isCorrect: z.boolean(),
  matchKey: z.string().max(TEST_LIMITS.matchKeyChars),
});
export type OptionForm = z.infer<typeof optionFormSchema>;

export const questionFormSchema = z.object({
  serverId: z.string(),
  type: z.string().min(1),
  /** Mirrored from the catalogue so editors can switch without a lookup. */
  answerKind: z.string(),
  prompt: z
    .string()
    .trim()
    .min(1, "Write the question prompt.")
    .max(TEST_LIMITS.promptChars),
  helpText: z.string().max(2_000),
  imageUrl: z.string(),
  points: z
    .number()
    .int("Points must be a whole number.")
    .min(0, "Points cannot be negative.")
    .max(1_000),
  config: questionConfigFormSchema,
  options: z.array(optionFormSchema).max(TEST_LIMITS.optionsPerQuestion),
});
export type QuestionForm = z.infer<typeof questionFormSchema>;

export const groupFormSchema = z.object({
  serverId: z.string(),
  title: z.string().max(TEST_LIMITS.titleChars),
  passage: z.string().max(TEST_LIMITS.passageChars),
  instructions: z.string().max(TEST_LIMITS.instructionsChars),
  imageUrl: z.string(),
  questions: z.array(questionFormSchema).max(TEST_LIMITS.questionsPerGroup),
});
export type GroupForm = z.infer<typeof groupFormSchema>;

export const sectionFormSchema = z.object({
  serverId: z.string(),
  title: z.string().trim().min(1, "Name this section.").max(TEST_LIMITS.titleChars),
  instructions: z.string().max(TEST_LIMITS.instructionsChars),
  kind: z.string().min(1),
  durationMinutes: formNumber,
  groups: z.array(groupFormSchema).max(TEST_LIMITS.groupsPerSection),
});
export type SectionForm = z.infer<typeof sectionFormSchema>;

/** The single `useForm` shape hosted by `TestBuilder`. */
export const testBuilderFormSchema = z.object({
  sections: z.array(sectionFormSchema).min(1).max(TEST_LIMITS.sectionsPerTest),
});
export type TestBuilderForm = z.infer<typeof testBuilderFormSchema>;

/** The settings dialog, which saves through `PATCH /tests/:testId`. */
export const testSettingsFormSchema = z
  .object({
    title: z.string().trim().min(1, "Give the test a title.").max(TEST_LIMITS.titleChars),
    description: z.string().max(1_000),
    instructions: z.string().max(TEST_LIMITS.instructionsChars),
    durationMinutes: formNumber,
    passingScore: formNumber,
    shuffleQuestions: z.boolean(),
    availableFrom: z.string(),
    availableUntil: z.string(),
  })
  .refine(
    (values) =>
      !values.availableFrom ||
      !values.availableUntil ||
      new Date(values.availableUntil) > new Date(values.availableFrom),
    { message: "The closing time must be after the opening time.", path: ["availableUntil"] },
  );
export type TestSettingsForm = z.infer<typeof testSettingsFormSchema>;
