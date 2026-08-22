import {
  AlignLeft,
  ArrowLeftRight,
  ArrowUpDown,
  Baseline,
  Brackets,
  Calculator,
  CircleDot,
  Grid3x3,
  Hash,
  Heading,
  Image as ImageIcon,
  ListChecks,
  PenLine,
  ScanLine,
  Table,
  TextCursorInput,
  ToggleLeft,
  type LucideIcon,
} from "lucide-react";

import type { QuestionTypeSpec, TestAnswerKind } from "@/app/(root)/_lib/tests.schemas";

/**
 * How a question *looks* while it is being authored.
 *
 * The old builder rendered every one of the twenty-six presets as the same card:
 * a prompt textarea, a help-text input, an image picker, and then whichever of
 * six answer-key editors matched the engine. That is correct and unreadable. A
 * True/False/Not Given statement, an SAT stem with four lettered choices, an
 * IELTS gap-fill with a two-word limit, and an essay with a rubric are four
 * different authoring jobs, and making them share one chrome means the teacher
 * has to read the type badge to know which job they are doing.
 *
 * This registry is what makes each question type look like itself. It is
 * presentation only: nothing here reaches the wire, and the answer key is still
 * stored by the seven engines in `answerKind`. That separation is what lets the
 * backend catalogue grow to fifty presets — a preset this file has never heard
 * of falls back to its engine's presentation via {@link fallbackPresentation}
 * and renders correctly, just without the tailoring.
 */

/** Which answer-key editor renders. Finer-grained than `answerKind` on purpose. */
export type QuestionEditorKind =
  /** An open list of options with a correct-answer control. */
  | "choice"
  /** A closed set the teacher may only pick from — TRUE / FALSE / NOT GIVEN. */
  | "fixedChoice"
  /** Exactly four lettered options in a 2x2 board, SAT style. */
  | "letteredGrid"
  /** Accepted answers as removable chips. */
  | "text"
  /** Accepted answers plus a word limit, for completion tasks. */
  | "gapFill"
  /** A value with a tolerance band and a live "what counts as correct" read-out. */
  | "numeric"
  /** Student-produced response: numeric, but shown as the SAT grid. */
  | "gridIn"
  /** Two columns wired together by `matchKey`. */
  | "matching"
  /** Matching whose right-hand items are the passage's paragraph labels. */
  | "headings"
  /** An ordered stack; position is the answer. */
  | "ordering"
  /** No key at all — word range and rubric. */
  | "manual";

/** How the prompt field itself is framed. */
export type PromptStyle =
  /** "Write the question" — the default. */
  | "question"
  /** "Write the statement students judge" — TFNG, YNNG. */
  | "statement"
  /** A passage-dependent stem, shown wider and taller. */
  | "stem"
  /** A sentence containing a gap, with a marker helper. */
  | "gap"
  /** A writing task brief, tall and prose-shaped. */
  | "task";

export type QuestionPresentation = {
  editor: QuestionEditorKind;
  prompt: PromptStyle;
  icon: LucideIcon;
  /**
   * The hue that tints this question's number chip and left rule. Grouped by
   * job rather than by family, so a teacher scanning a mixed paper sees
   * "choice", "written", "numeric", "wiring" as four shapes.
   *
   * These are chart tokens, never the semantic ones: `--success` and
   * `--destructive` mean *correct* and *incorrect* in this product, and a green
   * question number would read as "this one is right".
   */
  accent: "chart-1" | "chart-2" | "chart-3" | "chart-4" | "chart-5";
  /** The image is the subject of the question, not a decoration beside it. */
  imageFirst: boolean;
  /** Offer the IELTS word-limit presets above the accepted answers. */
  wordLimits: boolean;
  /** Rows in the prompt textarea. */
  promptRows: number;
};

/** Presentation derived from the engine alone — the safety net for unknown presets. */
export function fallbackPresentation(answerKind: TestAnswerKind): QuestionPresentation {
  switch (answerKind) {
    case "SINGLE_CHOICE":
      return base("choice", "question", CircleDot, "chart-1");
    case "MULTI_CHOICE":
      return base("choice", "question", ListChecks, "chart-1");
    case "TEXT":
      return base("text", "question", TextCursorInput, "chart-2");
    case "NUMERIC":
      return base("numeric", "question", Hash, "chart-5");
    case "MATCHING":
      return base("matching", "question", ArrowLeftRight, "chart-3");
    case "ORDERING":
      return base("ordering", "question", ArrowUpDown, "chart-3");
    case "MANUAL":
      return base("manual", "task", PenLine, "chart-4", { promptRows: 4 });
  }
}

function base(
  editor: QuestionEditorKind,
  prompt: PromptStyle,
  icon: LucideIcon,
  accent: QuestionPresentation["accent"],
  overrides: Partial<QuestionPresentation> = {},
): QuestionPresentation {
  return {
    editor,
    prompt,
    icon,
    accent,
    imageFirst: false,
    wordLimits: false,
    promptRows: 2,
    ...overrides,
  };
}

/**
 * Per-preset tailoring. Only entries that genuinely differ from their engine's
 * fallback appear here — an entry that repeats the fallback is a future
 * divergence waiting to happen.
 */
const PRESENTATIONS: Record<string, QuestionPresentation> = {
  /* --- BASIC ------------------------------------------------------------- */

  TRUE_FALSE: base("fixedChoice", "statement", ToggleLeft, "chart-1", { promptRows: 2 }),
  FILL_IN_BLANK: base("gapFill", "gap", Brackets, "chart-2"),
  SHORT_ANSWER: base("text", "question", TextCursorInput, "chart-2"),
  ESSAY: base("manual", "task", AlignLeft, "chart-4", { promptRows: 4 }),

  /* --- IELTS ------------------------------------------------------------- */

  IELTS_MCQ_SINGLE: base("choice", "stem", CircleDot, "chart-1", { promptRows: 3 }),
  IELTS_MCQ_MULTI: base("choice", "stem", ListChecks, "chart-1", { promptRows: 3 }),
  IELTS_TRUE_FALSE_NOT_GIVEN: base("fixedChoice", "statement", ToggleLeft, "chart-1"),
  IELTS_YES_NO_NOT_GIVEN: base("fixedChoice", "statement", ToggleLeft, "chart-1"),

  // Headings are the one matching variant whose right-hand column already exists
  // in the passage. Making the teacher retype A/B/C is the single most tedious
  // thing about authoring IELTS reading, so this editor offers them instead.
  IELTS_MATCHING_HEADINGS: base("headings", "question", Heading, "chart-3"),
  IELTS_MATCHING_INFORMATION: base("matching", "question", ScanLine, "chart-3"),
  IELTS_MATCHING_FEATURES: base("matching", "question", ArrowLeftRight, "chart-3"),
  IELTS_SENTENCE_ENDINGS: base("matching", "gap", ArrowLeftRight, "chart-3"),

  IELTS_SENTENCE_COMPLETION: base("gapFill", "gap", Brackets, "chart-2", {
    wordLimits: true,
  }),
  IELTS_SUMMARY_COMPLETION: base("gapFill", "gap", Baseline, "chart-2", {
    wordLimits: true,
    promptRows: 3,
  }),
  IELTS_NOTE_TABLE_COMPLETION: base("gapFill", "gap", Table, "chart-2", {
    wordLimits: true,
    promptRows: 3,
  }),
  IELTS_DIAGRAM_LABEL: base("gapFill", "gap", ImageIcon, "chart-2", {
    wordLimits: true,
    imageFirst: true,
  }),
  IELTS_SHORT_ANSWER: base("text", "question", TextCursorInput, "chart-2", {
    wordLimits: true,
  }),
  IELTS_WRITING_TASK: base("manual", "task", PenLine, "chart-4", { promptRows: 5 }),

  /* --- SAT --------------------------------------------------------------- */

  SAT_RW_MCQ: base("letteredGrid", "stem", Grid3x3, "chart-1", { promptRows: 3 }),
  SAT_MATH_MCQ: base("letteredGrid", "question", Calculator, "chart-1"),
  SAT_GRID_IN: base("gridIn", "question", Hash, "chart-5"),
};

/**
 * The presentation for a question. Falls back to the engine's default when the
 * backend serves a preset this file predates, so the studio never has to be
 * redeployed for the catalogue to grow.
 */
export function presentationFor(
  type: string,
  spec: QuestionTypeSpec,
): QuestionPresentation {
  return PRESENTATIONS[type] ?? fallbackPresentation(spec.answerKind);
}

/**
 * IELTS word-limit instructions, as the wording that appears on a real paper.
 * Offered as one-click chips because every teacher types one of these four and
 * they all mean a `maxWords` value.
 */
export const WORD_LIMIT_PRESETS = [
  { maxWords: 1, key: "oneWord" },
  { maxWords: 2, key: "twoWords" },
  { maxWords: 3, key: "threeWords" },
] as const;

/** The marker a gap-fill prompt uses to show where the blank sits. */
export const GAP_MARKER = "____";

/**
 * The accent classes for a presentation, written out per slot rather than
 * interpolated: Tailwind cannot see `bg-[var(--chart-${n})]` and would emit
 * nothing for it.
 *
 * The chip pairs `--chart-N-tint` with `--chart-N-ink`, not the raw ramp with a
 * `color-mix` wash. That is the whole reason those tokens exist — `globals.css`
 * records that the ramp value on a 16% wash of its own hue lands at 4.0–4.2:1
 * for three of the five slots, which fails AA once it is 11px text. The `-ink`
 * value is the same hue deepened only as far as AA needs, and `check:contrast`
 * asserts the pairing, so using anything else here silently leaves the gate.
 *
 * `rule` is the thin bar down the left of a question. It stays on the raw ramp
 * because it is a non-text mark, which the gate holds to 3:1.
 */
export const ACCENT_CLASSES: Record<
  QuestionPresentation["accent"],
  { chip: string; rule: string; icon: string }
> = {
  "chart-1": {
    chip: "bg-[var(--chart-1-tint)] text-[var(--chart-1-ink)]",
    rule: "bg-[var(--chart-1)]",
    icon: "text-[var(--chart-1-ink)]",
  },
  "chart-2": {
    chip: "bg-[var(--chart-2-tint)] text-[var(--chart-2-ink)]",
    rule: "bg-[var(--chart-2)]",
    icon: "text-[var(--chart-2-ink)]",
  },
  "chart-3": {
    chip: "bg-[var(--chart-3-tint)] text-[var(--chart-3-ink)]",
    rule: "bg-[var(--chart-3)]",
    icon: "text-[var(--chart-3-ink)]",
  },
  "chart-4": {
    chip: "bg-[var(--chart-4-tint)] text-[var(--chart-4-ink)]",
    rule: "bg-[var(--chart-4)]",
    icon: "text-[var(--chart-4-ink)]",
  },
  "chart-5": {
    chip: "bg-[var(--chart-5-tint)] text-[var(--chart-5-ink)]",
    rule: "bg-[var(--chart-5)]",
    icon: "text-[var(--chart-5-ink)]",
  },
};
