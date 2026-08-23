import type { AnswerValue } from "@/lib/tests/answers";
import type { PaperQuestion } from "@/lib/tests/paper.schemas";

/**
 * How a question is being rendered.
 *
 * The same component renders all three, which is the whole reason this folder
 * exists. A teacher marking an essay has to see exactly the paper the student
 * saw — same option order, same wording, same layout — and the only way to
 * guarantee that is for it to be the same code. Two renderers agree on the day
 * they are written and never again.
 */
export type PaperMode =
  /** A live attempt. Inputs are enabled and every change is saved. */
  | "answer"
  /** A submitted attempt. Read-only, with marks and — if released — the key. */
  | "review"
  /** Nobody's attempt. Read-only, no answer, no marks. */
  | "preview";

/** What a question was marked, from the teacher's review or a released result. */
export type QuestionResult = {
  /**
   * `null` means "not a clean right or wrong" — which covers **two** different
   * states, so it cannot be read as "unmarked" on its own. The backend's
   * `correctnessFromPoints` returns `true` only at full marks and `false` only
   * at zero, so every partial mark is also `null`. Use {@link gradedAt} to tell
   * an unmarked answer from a partially credited one.
   */
  isCorrect: boolean | null;
  /**
   * When a human marked this, or `null` if nobody has. The only trustworthy
   * "has it been marked" signal; `isCorrect: null` is not one.
   */
  gradedAt?: string | null;
  pointsAwarded: number;
  /**
   * The answer key, in the same shape as a student's answer. Present only when
   * the viewer is entitled to it — a teacher always, a student only once
   * `delivery.showCorrectAnswers` and release both allow it. **Absent, not
   * null**, when they are not: a `correctAnswer: null` in a payload is still a
   * field a component might decide to render an empty state for.
   */
  correctValue?: unknown;
  feedback?: string | null;
  /** Cohort comparison, for the teacher's "compare with class" toggle. */
  classCorrectRate?: number | null;
};

export type QuestionRenderProps = {
  question: PaperQuestion;
  mode: PaperMode;
  /** The student's answer, or `null` when unanswered. */
  value: unknown;
  /**
   * Absent outside `answer` mode; a read-only input has nothing to call.
   *
   * `null` clears the answer, and it is the **only** way to express "nothing".
   * An empty-but-present value — `{ optionId: "" }`, `{ number: NaN }` — is
   * rejected by the backend's answer validator, and a rejected autosave during
   * an exam is silent data loss.
   */
  onChange?: (value: AnswerValue | null) => void;
  result?: QuestionResult;
  disabled?: boolean;
  /**
   * The number to print, when it is not the question's canonical one.
   *
   * The two differ under `shuffleQuestions`: the server shuffles the paper but
   * keeps each question's original number, so a student would otherwise read
   * "14, 15, 16, 1, 2" down the page and a navigator grid whose positions and
   * labels disagree. The exam room numbers by position; the teacher's review
   * and the statistics keep the canonical numbering, which is the one they
   * share with each other.
   */
  displayNumber?: number;
  hideMeta?: boolean;
  struckOptionIds?: Set<string>;
};
