import { z } from "zod";

import type { TestAnswerKind } from "@/app/(root)/_lib/tests.schemas";

/**
 * What a student's answer looks like, for every grading engine.
 *
 * One shape per `answerKind`, matching
 * `docs/features/test-taking-backend-handoff.md` §B.6 exactly. This module is
 * the single definition: the exam runtime writes these, `PATCH /answers` sends
 * them, the backend grades them, and the teacher's review reads them back. A
 * seventh shape invented at one of those four points is a silently unmarked
 * question.
 *
 * They are **discriminated by the question's `answerKind`, not by a field on
 * the value.** The question already knows what kind it is, and a `type` tag
 * inside every stored answer would be a second copy of that fact — one that a
 * question retyped from `SHORT_ANSWER` to `NUMERIC` would immediately
 * contradict.
 */

export const singleChoiceAnswerSchema = z.object({ optionId: z.string() });
export const multiChoiceAnswerSchema = z.object({ optionIds: z.array(z.string()) });
export const textAnswerSchema = z.object({ text: z.string() });
export const numericAnswerSchema = z.object({ number: z.number() });
export const matchingAnswerSchema = z.object({
  pairs: z.array(z.object({ optionId: z.string(), key: z.string() })),
});
export const orderingAnswerSchema = z.object({ optionIds: z.array(z.string()) });

/**
 * Permissive on read, exact on write.
 *
 * A stored answer arrives as whatever was saved, including by an older client
 * or against a question that has since been retyped. The union accepts any of
 * the six; the *renderer* narrows by the question's current `answerKind` and
 * treats a mismatch as unanswered, which is the only reading that cannot
 * invent a response the student never gave.
 */
export const answerValueSchema = z.union([
  singleChoiceAnswerSchema,
  multiChoiceAnswerSchema,
  textAnswerSchema,
  numericAnswerSchema,
  matchingAnswerSchema,
  orderingAnswerSchema,
]);

/**
 * The **answer key**, which is a different shape from an answer.
 *
 * This is not an oversight to be tidied away — the two genuinely differ, and
 * assuming otherwise is what made the result screen fail validation the first
 * time it met a real payload:
 *
 * - a short answer is one string, but its key is the *list* of accepted ones;
 * - a numeric answer is one number, but its key is a value plus a tolerance, or
 *   a range;
 * - a single-choice key can be `null` — a question whose correct option was
 *   never marked;
 * - a written response has no key at all.
 *
 * Permissive on purpose: this is read-only display data, and a key the client
 * cannot interpret should degrade to "not shown" rather than take the page down
 * with it.
 */
export const answerKeySchema = z.union([
  z.object({ optionId: z.string().nullable() }),
  z.object({ optionIds: z.array(z.string()) }),
  z.object({ acceptedAnswers: z.array(z.string()) }),
  z.object({
    number: z.number().nullable(),
    tolerance: z.number().nullable().optional(),
  }),
  z.object({ acceptedRange: z.unknown() }),
  z.object({
    pairs: z.array(
      z.object({ optionId: z.string(), key: z.string().nullable() }),
    ),
  }),
]);
export type AnswerKey = z.infer<typeof answerKeySchema>;

export type SingleChoiceAnswer = z.infer<typeof singleChoiceAnswerSchema>;
export type MultiChoiceAnswer = z.infer<typeof multiChoiceAnswerSchema>;
export type TextAnswer = z.infer<typeof textAnswerSchema>;
export type NumericAnswer = z.infer<typeof numericAnswerSchema>;
export type MatchingAnswer = z.infer<typeof matchingAnswerSchema>;
export type OrderingAnswer = z.infer<typeof orderingAnswerSchema>;
export type AnswerValue = z.infer<typeof answerValueSchema>;

/* -------------------------------------------------------------------------- */
/* Narrowing                                                                   */
/* -------------------------------------------------------------------------- */

/**
 * Reads a stored value as the shape this question's engine expects, or `null`
 * when it is not that shape.
 *
 * Every input component goes through this rather than casting. The cast would
 * be right almost always and wrong exactly when it matters — a teacher who
 * changed a question from multiple choice to short answer after a student
 * answered it leaves an `{ optionIds }` on a `TEXT` question, and a cast turns
 * that into `value.text === undefined` rendered as the string "undefined" in a
 * field the student is about to submit.
 */
export function readAnswer<K extends TestAnswerKind>(
  answerKind: K,
  value: unknown,
): AnswerFor<K> | null {
  const schema = SCHEMA_BY_KIND[answerKind];
  if (!schema) return null;
  const parsed = schema.safeParse(value);
  return parsed.success ? (parsed.data as AnswerFor<K>) : null;
}

export type AnswerFor<K extends TestAnswerKind> = K extends "SINGLE_CHOICE"
  ? SingleChoiceAnswer
  : K extends "MULTI_CHOICE"
    ? MultiChoiceAnswer
    : K extends "TEXT" | "MANUAL"
      ? TextAnswer
      : K extends "NUMERIC"
        ? NumericAnswer
        : K extends "MATCHING"
          ? MatchingAnswer
          : K extends "ORDERING"
            ? OrderingAnswer
            : never;

const SCHEMA_BY_KIND: Record<TestAnswerKind, z.ZodTypeAny> = {
  SINGLE_CHOICE: singleChoiceAnswerSchema,
  MULTI_CHOICE: multiChoiceAnswerSchema,
  TEXT: textAnswerSchema,
  NUMERIC: numericAnswerSchema,
  MATCHING: matchingAnswerSchema,
  ORDERING: orderingAnswerSchema,
  // A written response is a `TEXT` value that is never auto-graded. Two shapes
  // for one thing would mean two renderers and two save paths.
  MANUAL: textAnswerSchema,
};

/* -------------------------------------------------------------------------- */
/* Answered-ness                                                               */
/* -------------------------------------------------------------------------- */

/**
 * Whether a student has actually responded.
 *
 * This drives the question navigator, the "3 unanswered" warning before
 * submitting, and the `unanswered` count in the statistics — so "answered" has
 * to mean the same thing in all three, and it has to be stricter than "a row
 * exists". A student who clicks into an essay and clicks out has a stored
 * `{ text: "" }`, and counting that as answered is how someone submits a blank
 * paper believing the count that told them they were done.
 */
export function isAnswered(answerKind: TestAnswerKind, value: unknown): boolean {
  const answer = readAnswer(answerKind, value);
  if (!answer) return false;

  switch (answerKind) {
    case "SINGLE_CHOICE":
      return Boolean((answer as SingleChoiceAnswer).optionId);
    case "MULTI_CHOICE":
    case "ORDERING":
      return (answer as MultiChoiceAnswer).optionIds.length > 0;
    case "TEXT":
    case "MANUAL":
      return (answer as TextAnswer).text.trim().length > 0;
    case "NUMERIC":
      return Number.isFinite((answer as NumericAnswer).number);
    case "MATCHING":
      // Every pair, not any: a half-matched question is a half-answered one,
      // and the navigator has to be able to send the student back to it.
      return (answer as MatchingAnswer).pairs.some((pair) => Boolean(pair.key));
    default:
      return false;
  }
}

/*
 * There is deliberately no `emptyAnswer(answerKind)` helper.
 *
 * It existed, and every value it returned — `{ optionId: "" }`,
 * `{ number: NaN }`, `{ pairs: [] }` — is one the backend's answer validator
 * rejects, because an option id must be a real option and a number must be
 * finite. "No answer" has exactly one representation on the wire: `null`.
 */

/* -------------------------------------------------------------------------- */
/* Word counting                                                               */
/* -------------------------------------------------------------------------- */

/**
 * Words in a written response, counted the way the limit is meant.
 *
 * IELTS "NO MORE THAN TWO WORDS" counts whitespace-separated tokens, and a
 * hyphenated compound is one word. Shared with the backend's grading rule by
 * specification rather than by code, so the count the student watches while
 * typing is the count that marks them.
 */
export function countWords(text: string): number {
  const trimmed = text.trim();
  return trimmed ? trimmed.split(/\s+/).length : 0;
}

/**
 * The answer key as a line of text, for the kinds whose input cannot show it
 * in place.
 *
 * A choice question marks its own correct option and a matching question marks
 * each row, so those need nothing here — `null` means "already visible". What
 * is left is the typed kinds, where the key is a list of accepted spellings or
 * a value with a tolerance and there is nowhere in the field to put it.
 *
 * `optionIds` is deliberately excluded too: an ordering key is a sequence of
 * ids, and rendering ids at a student is worse than rendering nothing.
 */
export function describeAnswerKey(key: unknown): string | null {
  if (!key || typeof key !== "object") return null;
  const record = key as Record<string, unknown>;

  if (Array.isArray(record.acceptedAnswers)) {
    const values = record.acceptedAnswers.filter(
      (value): value is string => typeof value === "string",
    );
    return values.length > 0 ? values.join(" / ") : null;
  }

  if (Array.isArray(record.acceptedRange)) {
    const [min, max] = record.acceptedRange as unknown[];
    if (typeof min === "number" && typeof max === "number") return `${min} – ${max}`;
  }

  if (typeof record.number === "number") {
    const tolerance = typeof record.tolerance === "number" ? record.tolerance : 0;
    return tolerance > 0 ? `${record.number} ± ${tolerance}` : String(record.number);
  }

  return null;
}
