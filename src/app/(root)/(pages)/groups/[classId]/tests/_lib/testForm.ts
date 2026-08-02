import type {
  ApiTestDetail,
  QuestionConfig,
  QuestionTypeCatalog,
  QuestionTypeSpec,
  TestAnswerKind,
} from "@/app/(root)/_lib/tests.schemas";
import type {
  GroupForm,
  OptionForm,
  QuestionConfigForm,
  QuestionForm,
  SaveSectionInput,
  SectionForm,
  TestBuilderForm,
} from "@/app/(root)/_lib/tests.actions.schemas";
import type { CatalogEntry } from "../_types";
import { QUESTION_FAMILY_ORDER } from "../_constants";

/**
 * The translation layer between the backend tree and the builder's single
 * `useForm`.
 *
 * Two rules drive everything here:
 *
 * - **Echo ids.** Every row that came from the server keeps its `id` so the
 *   whole-tree save updates it instead of deleting and recreating it, which
 *   would break the answer foreign keys the next pass adds.
 * - **Never invent server-owned fields.** `answerKind` is derived from `type`
 *   by the backend and `questionNumber` is computed at read time, so neither is
 *   ever written back.
 */

/** A, B, C … for option labels and matching keys. */
export function optionLabel(index: number): string {
  return String.fromCharCode(65 + (index % 26));
}

/* -------------------------------------------------------------------------- */
/* Catalogue helpers                                                           */
/* -------------------------------------------------------------------------- */

/** The catalogue entry for a question type, or `null` if the backend dropped it. */
export function specFor(
  catalog: QuestionTypeCatalog,
  type: string,
): QuestionTypeSpec | null {
  return catalog[type] ?? null;
}

/**
 * Catalogue entries this test may use, grouped into picker tabs. Known families
 * lead in the documented order; anything the backend adds later is appended
 * alphabetically rather than silently hidden.
 */
export function entriesByFamily(
  catalog: QuestionTypeCatalog,
  allowedTypes: string[],
): { family: string; entries: CatalogEntry[] }[] {
  const allowed = new Set(allowedTypes);
  const families = new Map<string, CatalogEntry[]>();

  for (const [type, spec] of Object.entries(catalog)) {
    // An empty allow-list is read as "no restriction", which is how `CUSTOM`
    // behaves. A blueprint that means "nothing" would send no types at all,
    // and that format could not be authored in either reading.
    if (allowed.size > 0 && !allowed.has(type)) continue;
    const bucket = families.get(spec.family);
    if (bucket) bucket.push({ type, spec });
    else families.set(spec.family, [{ type, spec }]);
  }

  const order = QUESTION_FAMILY_ORDER as readonly string[];
  return [...families.entries()]
    .sort(([a], [b]) => {
      const rankA = order.indexOf(a);
      const rankB = order.indexOf(b);
      if (rankA !== -1 && rankB !== -1) return rankA - rankB;
      if (rankA !== -1) return -1;
      if (rankB !== -1) return 1;
      return a.localeCompare(b);
    })
    .map(([family, entries]) => ({ family, entries }));
}

/** True when this answer kind is backed by a list of options. */
export function hasOptions(answerKind: string): boolean {
  return (
    answerKind === "SINGLE_CHOICE" ||
    answerKind === "MULTI_CHOICE" ||
    answerKind === "MATCHING" ||
    answerKind === "ORDERING"
  );
}

/* -------------------------------------------------------------------------- */
/* Passage paragraph labels                                                    */
/* -------------------------------------------------------------------------- */

/**
 * Blank-line-separated paragraphs get auto A/B/C labels so matching-headings
 * questions can reference them. Derived on render — never stored, so editing
 * the passage renumbers instantly.
 */
export function paragraphLabels(passage: string): { label: string; text: string }[] {
  return passage
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .map((text, index) => ({ label: optionLabel(index), text }));
}

/* -------------------------------------------------------------------------- */
/* API tree -> form values                                                     */
/* -------------------------------------------------------------------------- */

function emptyConfigForm(): QuestionConfigForm {
  return {
    acceptedAnswers: [],
    caseSensitive: false,
    maxWords: null,
    minWords: null,
    answer: null,
    tolerance: null,
    rangeMin: null,
    rangeMax: null,
    rubric: "",
    rightItems: [],
  };
}

function toConfigForm(config: QuestionConfig | null | undefined): QuestionConfigForm {
  const base = emptyConfigForm();
  if (!config) return base;

  return {
    ...base,
    acceptedAnswers: (config.acceptedAnswers ?? []).map((value) => ({ value })),
    caseSensitive: config.caseSensitive ?? false,
    maxWords: config.maxWords ?? null,
    minWords: config.minWords ?? null,
    answer: config.answer ?? null,
    tolerance: config.tolerance ?? null,
    rangeMin: config.acceptedRange?.[0] ?? null,
    rangeMax: config.acceptedRange?.[1] ?? null,
    rubric: config.rubric ?? "",
    rightItems: config.rightItems ?? [],
  };
}

/**
 * Maps `GET /tests/:testId` onto the builder form. Nullable backend strings
 * become empty strings so every input stays controlled for the form's whole
 * lifetime.
 */
export function buildFormDefaults(
  test: ApiTestDetail,
  catalog: QuestionTypeCatalog,
): TestBuilderForm {
  return {
    sections: test.sections.map((section) => ({
      serverId: section.id,
      title: section.title,
      instructions: section.instructions ?? "",
      kind: section.kind,
      durationMinutes: section.durationMinutes ?? null,
      groups: section.groups.map((group) => ({
        serverId: group.id,
        title: group.title ?? "",
        passage: group.passage ?? "",
        instructions: group.instructions ?? "",
        imageUrl: group.imageUrl ?? "",
        questions: group.questions.map((question) => ({
          serverId: question.id,
          type: question.type,
          // Mirrored for the editor switch. Prefer the catalogue so a preset
          // that was re-mapped server-side takes effect without a reload; fall
          // back to what the row was stored with.
          answerKind: catalog[question.type]?.answerKind ?? question.answerKind,
          prompt: question.prompt,
          helpText: question.helpText ?? "",
          imageUrl: question.imageUrl ?? "",
          points: question.points,
          config: toConfigForm(question.config),
          options: question.options.map((option) => ({
            serverId: option.id,
            text: option.text,
            label: option.label ?? "",
            imageUrl: option.imageUrl ?? "",
            isCorrect: option.isCorrect ?? false,
            matchKey: option.matchKey ?? "",
          })),
        })),
      })),
    })),
  };
}

/* -------------------------------------------------------------------------- */
/* New-row drafts                                                              */
/* -------------------------------------------------------------------------- */

export function blankOption(index: number): OptionForm {
  return {
    serverId: "",
    text: "",
    label: optionLabel(index),
    imageUrl: "",
    isCorrect: false,
    matchKey: "",
  };
}

/**
 * A question pre-shaped for its answer kind, so picking a preset lands the
 * teacher on a form that is already the right shape: fixed options filled in
 * for true/false/not-given, four blanks for an SAT multiple choice, a starter
 * pair for matching.
 */
export function createQuestionDraft(type: string, spec: QuestionTypeSpec): QuestionForm {
  const config = emptyConfigForm();
  let options: OptionForm[] = [];

  if (spec.fixedOptions?.length) {
    options = spec.fixedOptions.map((text, index) => ({
      ...blankOption(index),
      text,
    }));
  } else if (spec.answerKind === "SINGLE_CHOICE" || spec.answerKind === "MULTI_CHOICE") {
    const count = Math.max(spec.minOptions ?? 2, 2);
    options = Array.from({ length: count }, (_, index) => blankOption(index));
  } else if (spec.answerKind === "ORDERING") {
    const count = Math.max(spec.minOptions ?? 3, 2);
    options = Array.from({ length: count }, (_, index) => blankOption(index));
  } else if (spec.answerKind === "MATCHING") {
    const count = Math.max(spec.minOptions ?? 2, 2);
    options = Array.from({ length: count }, (_, index) => ({
      ...blankOption(index),
      matchKey: optionLabel(index),
    }));
    config.rightItems = Array.from({ length: count }, (_, index) => ({
      key: optionLabel(index),
      text: "",
    }));
  }

  if (spec.answerKind === "TEXT") {
    config.acceptedAnswers = [{ value: "" }];
  }

  return {
    serverId: "",
    type,
    answerKind: spec.answerKind,
    prompt: "",
    helpText: "",
    imageUrl: "",
    points: spec.defaultPoints,
    config,
    options,
  };
}

export function createGroupDraft(): GroupForm {
  return {
    serverId: "",
    title: "",
    passage: "",
    instructions: "",
    imageUrl: "",
    questions: [],
  };
}

export function createSectionDraft(kind: string, title: string): SectionForm {
  return {
    serverId: "",
    title,
    instructions: "",
    kind,
    durationMinutes: null,
    groups: [createGroupDraft()],
  };
}

/* -------------------------------------------------------------------------- */
/* Form values -> wire payload                                                 */
/* -------------------------------------------------------------------------- */

/** Drops empty optional strings so the backend stores `null`, not `""`. */
function trimmedOrUndefined(value: string | null | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function numberOrUndefined(value: number | null | undefined): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

/**
 * Word counts and durations are `@IsInt() @Min(1)` on the backend, so a `0` in
 * an otherwise-untouched field must be dropped rather than sent as "no words
 * allowed".
 */
function positiveIntOrUndefined(value: number | null | undefined): number | undefined {
  return typeof value === "number" && Number.isInteger(value) && value > 0
    ? value
    : undefined;
}

/**
 * Narrows the flattened form config down to the fields that actually mean
 * something for this answer kind. Anything a teacher typed into an editor they
 * later navigated away from is dropped rather than persisted as dead JSON — the
 * backend validates `config` per answer kind on every write and would reject it.
 */
function buildConfig(
  answerKind: TestAnswerKind | string,
  config: QuestionConfigForm,
): Record<string, unknown> | undefined {
  switch (answerKind) {
    case "TEXT": {
      const acceptedAnswers = config.acceptedAnswers
        .map((entry) => entry.value.trim())
        .filter(Boolean);
      const payload: Record<string, unknown> = {
        acceptedAnswers,
        caseSensitive: config.caseSensitive,
      };
      const maxWords = positiveIntOrUndefined(config.maxWords);
      if (maxWords !== undefined) payload.maxWords = maxWords;
      return payload;
    }
    case "NUMERIC": {
      const payload: Record<string, unknown> = {};
      const answer = numberOrUndefined(config.answer);
      if (answer !== undefined) payload.answer = answer;
      const tolerance = numberOrUndefined(config.tolerance);
      if (tolerance !== undefined && tolerance >= 0) payload.tolerance = tolerance;
      const min = numberOrUndefined(config.rangeMin);
      const max = numberOrUndefined(config.rangeMax);
      // An ascending two-element tuple. A half-filled or inverted range is
      // dropped rather than sent, because the backend rejects both.
      if (min !== undefined && max !== undefined && min <= max) {
        payload.acceptedRange = [min, max];
      }
      return payload;
    }
    case "MATCHING": {
      // Both halves must be non-empty; an incomplete row is dropped so a draft
      // still saves, and publish validation reports the missing pair.
      const rightItems = config.rightItems
        .map((item) => ({ key: item.key.trim(), text: item.text.trim() }))
        .filter((item) => item.key && item.text);
      return { rightItems };
    }
    case "MANUAL": {
      const payload: Record<string, unknown> = {};
      const minWords = positiveIntOrUndefined(config.minWords);
      if (minWords !== undefined) payload.minWords = minWords;
      const maxWords = positiveIntOrUndefined(config.maxWords);
      if (maxWords !== undefined) payload.maxWords = maxWords;
      const rubric = trimmedOrUndefined(config.rubric);
      if (rubric !== undefined) payload.rubric = rubric;
      return payload;
    }
    default:
      // SINGLE_CHOICE / MULTI_CHOICE / ORDERING keep their answer key in the
      // options themselves (`isCorrect`, and order for ORDERING).
      return undefined;
  }
}

/**
 * Builds the `PUT /tests/:testId/structure` body. Order is array position, so
 * no `orderIndex` is sent — the backend rewrites the sibling sequence to a
 * contiguous `0..n-1` inside the save transaction.
 */
export function buildStructurePayload(
  values: TestBuilderForm,
  catalog: QuestionTypeCatalog,
): SaveSectionInput[] {
  return values.sections.map((section) => ({
    id: section.serverId || undefined,
    title: section.title.trim(),
    instructions: trimmedOrUndefined(section.instructions),
    kind: section.kind,
    durationMinutes: positiveIntOrUndefined(section.durationMinutes),
    groups: section.groups.map((group) => ({
      id: group.serverId || undefined,
      title: trimmedOrUndefined(group.title),
      passage: trimmedOrUndefined(group.passage),
      instructions: trimmedOrUndefined(group.instructions),
      imageUrl: trimmedOrUndefined(group.imageUrl),
      questions: group.questions.map((question) => {
        const answerKind = catalog[question.type]?.answerKind ?? question.answerKind;
        const keepsOptions = hasOptions(answerKind);

        return {
          id: question.serverId || undefined,
          type: question.type,
          prompt: question.prompt.trim(),
          helpText: trimmedOrUndefined(question.helpText),
          imageUrl: trimmedOrUndefined(question.imageUrl),
          points: question.points,
          config: buildConfig(answerKind, question.config),
          options: keepsOptions
            ? question.options.map((option) => ({
                id: option.serverId || undefined,
                text: option.text.trim(),
                label: trimmedOrUndefined(option.label),
                imageUrl: trimmedOrUndefined(option.imageUrl),
                // Only choice questions carry a correct flag; ordering encodes
                // its answer as position and matching as `matchKey`.
                isCorrect:
                  answerKind === "SINGLE_CHOICE" || answerKind === "MULTI_CHOICE"
                    ? option.isCorrect
                    : false,
                matchKey:
                  answerKind === "MATCHING"
                    ? trimmedOrUndefined(option.matchKey)
                    : undefined,
              }))
            : [],
        };
      }),
    })),
  }));
}

/* -------------------------------------------------------------------------- */
/* Derived counts                                                              */
/* -------------------------------------------------------------------------- */

/** Total questions in the current form values. */
export function countQuestions(values: TestBuilderForm): number {
  return values.sections.reduce(
    (total, section) =>
      total + section.groups.reduce((count, group) => count + group.questions.length, 0),
    0,
  );
}

/** Total points in the current form values, mirroring the backend roll-up. */
export function countPoints(values: TestBuilderForm): number {
  return values.sections.reduce(
    (total, section) =>
      total +
      section.groups.reduce(
        (sum, group) =>
          sum + group.questions.reduce((points, question) => points + (question.points || 0), 0),
        0,
      ),
    0,
  );
}

/**
 * The 1-based number of the first question in a group, counted across the whole
 * test — IELTS numbers 1–40 end to end, not per section. This mirrors the
 * backend's read-time walk (sections, then groups, then questions) so the
 * builder shows the numbers students will see.
 */
export function groupStartNumber(
  sections: TestBuilderForm["sections"],
  sectionIndex: number,
  groupIndex: number,
): number {
  let count = 0;

  for (let si = 0; si < sections.length; si += 1) {
    const groups = sections[si]?.groups ?? [];
    for (let gi = 0; gi < groups.length; gi += 1) {
      if (si === sectionIndex && gi === groupIndex) return count + 1;
      count += groups[gi]?.questions?.length ?? 0;
    }
  }

  return count + 1;
}
