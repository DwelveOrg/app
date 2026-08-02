import type { Control, UseFormSetValue } from "react-hook-form";

import type {
  FormatBlueprint,
  QuestionTypeCatalog,
  QuestionTypeSpec,
} from "@/app/(root)/_lib/tests.schemas";
import type { TestBuilderForm } from "@/app/(root)/_lib/tests.actions.schemas";

/**
 * Derived, UI-only types for the test builder. Everything describing *what a
 * test may contain* lives in the backend catalogue and is threaded through as
 * props; nothing here re-declares it.
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
 * The contract every answer-kind editor implements. Editors receive `control`
 * plus a composed `name` and never a slice of form state, so typing in one
 * editor cannot re-render its siblings.
 */
export type QuestionEditorProps = {
  control: Control<TestBuilderForm>;
  /**
   * Passed explicitly rather than read from `FormProvider`: context would
   * re-render every editor whenever the builder re-renders, defeating the
   * `React.memo` around `QuestionCard`. `setValue` is stable, so a prop costs
   * nothing.
   */
  setValue: UseFormSetValue<TestBuilderForm>;
  name: QuestionFieldName;
  /** The catalogue entry for this question's preset. */
  spec: QuestionTypeSpec;
  disabled?: boolean;
};

/** A question type paired with the id it is registered under. */
export type CatalogEntry = {
  type: string;
  spec: QuestionTypeSpec;
};
