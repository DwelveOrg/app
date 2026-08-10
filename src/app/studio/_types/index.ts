import type { Control, UseFormSetValue, UseFormWatch } from "react-hook-form";

import type {
  FormatBlueprint,
  QuestionTypeCatalog,
  QuestionTypeSpec,
} from "@/app/(root)/_lib/tests.schemas";
import type { TestBuilderForm } from "@/app/(root)/_lib/tests.actions.schemas";

/**
 * Derived, UI-only types for the studio. Everything describing *what a test may
 * contain* lives in the backend catalogue and is threaded through as props;
 * nothing here re-declares it.
 */

/** The catalogue slice every level of the builder needs. */
export type BuilderCatalog = {
  /** `GET /tests/formats` -> `questionTypes`, keyed by question type. */
  questionTypes: QuestionTypeCatalog;
  /** The blueprint for *this* test's format. */
  blueprint: FormatBlueprint;
};

/** RHF path to one question, e.g. `sections.0.groups.1.questions.2`. */
export type QuestionFieldName = `sections.${number}.groups.${number}.questions.${number}`;

/** RHF path to one group. */
export type GroupFieldName = `sections.${number}.groups.${number}`;

/** RHF path to one section. */
export type SectionFieldName = `sections.${number}`;

/**
 * The contract every question editor implements. Editors receive `control` plus
 * a composed `name` and never a slice of form state, so typing in one editor
 * cannot re-render its siblings.
 */
export type QuestionEditorProps = {
  control: Control<TestBuilderForm>;
  /**
   * Passed explicitly rather than read from `FormProvider`: context would
   * re-render every editor whenever the builder re-renders, defeating the
   * `React.memo` around the question row. `setValue` is stable, so a prop costs
   * nothing.
   */
  setValue: UseFormSetValue<TestBuilderForm>;
  name: QuestionFieldName;
  /** The catalogue entry for this question's preset. */
  spec: QuestionTypeSpec;
  /** The preset id itself, so an editor can vary by preset and not only by engine. */
  type: string;
  disabled?: boolean;
  /**
   * The path to the shared material this question sits under, for the editors
   * that derive their content from it — matching-headings offers the passage's
   * paragraph labels as its right-hand items rather than making the teacher
   * retype A/B/C.
   *
   * A path rather than the text itself, so the one editor that needs it can
   * subscribe on its own. Passing the text down would mean watching it where
   * the material renders, which re-renders every question under that passage on
   * every keystroke in it.
   */
  groupName: GroupFieldName;
};

/** Re-exported so studio code has one import for its builder types. */
export type { CatalogEntry } from "@/app/(root)/_lib/test-form";

/**
 * One node of the outline rail. Flattened from the form tree so the rail can be
 * a single list with indentation, which is what makes it navigable by keyboard
 * and reorderable as one drag context.
 */
export type OutlineNode = {
  id: string;
  kind: "section" | "group" | "question";
  label: string;
  sectionIndex: number;
  groupIndex?: number;
  questionIndex?: number;
  /** Backend id, empty for a row that has never been saved. */
  serverId: string;
  /** 1-based number across the whole test, for questions only. */
  questionNumber?: number;
  /** A publish check points at this row. */
  flagged: boolean;
  /** Present for questions: the preset, so the rail can show its mark. */
  type?: string;
};

/** Everything the builder passes down that does not change per row. */
export type BuilderContext = {
  testId: string;
  classId: string;
  catalog: BuilderCatalog;
  disabled: boolean;
  flaggedIds: ReadonlySet<string>;
};

export type WatchFn = UseFormWatch<TestBuilderForm>;
