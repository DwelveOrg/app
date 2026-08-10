import type {
  GroupForm,
  QuestionForm,
} from "@/app/(root)/_lib/tests.actions.schemas";
import {
  createGroupDraft,
  duplicateQuestionDraft,
} from "@/app/(root)/_lib/test-form";

/**
 * A part, as the teacher sees it: one flat, numbered list of questions, with
 * shared material sitting above the run of questions that depends on it.
 *
 * ## Why this module exists
 *
 * The backend models a test as section → **question group** → question, and the
 * group is load-bearing: it is how one reading passage is attached to the twelve
 * questions about it. The builder used to expose it directly, which meant a
 * teacher writing a ten-question quiz had to create a container first, name it,
 * and then put questions in it — three decisions to reach the one thing they
 * came to do. Worse, the container was unavoidable: every test carries at least
 * one group whether or not its author wanted one.
 *
 * So the group is now a wire concept only. A part renders as a single list; a
 * group boundary is visible exactly where it means something, which is where a
 * passage starts. Everything in this module is the translation between the two.
 *
 * ## The rules the whole flat model rests on
 *
 * 1. **Group 0 may be material-less.** It holds the questions that come before
 *    any shared material — for a simple quiz, all of them. It is never rendered.
 * 2. **Every other group carries material** and renders as one card that visibly
 *    spans the questions beneath it.
 * 3. **A question always belongs to the nearest material above it.** That is the
 *    only rule a teacher has to hold, it matches what they can see, and it is
 *    what makes dragging a question across a boundary mean something.
 *
 * Every function here is pure and returns a **new `groups` array**. The caller
 * applies it with `replace()`, so one structural edit is one form write and the
 * before/after states are both valid trees.
 */

/** One row of the rendered part, in reading order. */
export type SectionBlock =
  | {
      kind: "material";
      /** `group.uid` — stable across the `replace()` that applied the last edit. */
      key: string;
      groupIndex: number;
      /** How many questions this material covers, for its "Questions 14–20" range. */
      questionCount: number;
      /** 1-based number of the first question under it, across the whole test. */
      startNumber: number;
    }
  | {
      kind: "question";
      /** `question.uid`. Also the drag id. */
      key: string;
      groupIndex: number;
      questionIndex: number;
      /** 1-based across the whole test, as the student will see it. */
      questionNumber: number;
      /** True when a material card sits above this question. */
      underMaterial: boolean;
      /** Last question under its material, so the spanning rail can close. */
      lastUnderMaterial: boolean;
    };

/**
 * Flattens a part's groups into the list the builder renders.
 *
 * `startNumber` is the part's first question number across the whole test; the
 * numbers simply run from there, because the flat list is the reading order.
 */
export function toBlocks(groups: GroupForm[], startNumber: number): SectionBlock[] {
  const blocks: SectionBlock[] = [];
  let questionNumber = startNumber;

  groups.forEach((group, groupIndex) => {
    // A material-less group is a container the teacher never asked for, so it
    // contributes rows and no chrome. Group 0 is normally this one.
    if (group.hasMaterial) {
      blocks.push({
        kind: "material",
        key: group.uid,
        groupIndex,
        questionCount: group.questions.length,
        startNumber: questionNumber,
      });
    }

    group.questions.forEach((question, questionIndex) => {
      blocks.push({
        kind: "question",
        key: question.uid,
        groupIndex,
        questionIndex,
        questionNumber: questionNumber++,
        underMaterial: group.hasMaterial,
        lastUnderMaterial:
          group.hasMaterial && questionIndex === group.questions.length - 1,
      });
    });
  });

  return blocks;
}

/** Every question in the part, in reading order, paired with where it lives. */
export function flatQuestions(
  groups: GroupForm[],
): { question: QuestionForm; groupIndex: number; questionIndex: number }[] {
  return groups.flatMap((group, groupIndex) =>
    group.questions.map((question, questionIndex) => ({
      question,
      groupIndex,
      questionIndex,
    })),
  );
}

/** The drag ids of a part's questions, in reading order. */
export function questionUids(groups: GroupForm[]): string[] {
  return flatQuestions(groups).map(({ question }) => question.uid);
}

export function totalQuestions(groups: GroupForm[]): number {
  return groups.reduce((total, group) => total + group.questions.length, 0);
}

/* -------------------------------------------------------------------------- */
/* Structural edits                                                            */
/* -------------------------------------------------------------------------- */

/** Shallow-clones down to the arrays a caller is about to change. */
function cloneGroups(groups: GroupForm[]): GroupForm[] {
  return groups.map((group) => ({ ...group, questions: [...group.questions] }));
}

function locate(groups: GroupForm[], uid: string) {
  for (let groupIndex = 0; groupIndex < groups.length; groupIndex += 1) {
    const questionIndex = groups[groupIndex].questions.findIndex(
      (question) => question.uid === uid,
    );
    if (questionIndex !== -1) return { groupIndex, questionIndex };
  }
  return null;
}

/**
 * Appends a question to the end of the part — under the last material, which is
 * the one the teacher is looking at.
 *
 * `needsMaterial` comes from the question type's `requiresGroupStimulus`. Some
 * presets are unanswerable without a passage — an IELTS reading MCQ has no stem
 * of its own — and the backend refuses to publish a test where one sits outside
 * any material (`GROUP_STIMULUS_REQUIRED`). Creating the card here is what stops
 * a teacher discovering that at publish time, three questions later, with no
 * indication of what they did wrong.
 */
export function appendQuestion(
  groups: GroupForm[],
  question: QuestionForm,
  needsMaterial = false,
): GroupForm[] {
  const next = cloneGroups(groups);
  if (next.length === 0) next.push(createGroupDraft());

  if (needsMaterial && !next[next.length - 1].hasMaterial) {
    next.push(createGroupDraft(true));
  }

  next[next.length - 1].questions.push(question);
  return next;
}

/**
 * Inserts a question directly after the one identified by `afterUid`.
 *
 * When the question needs material and lands in a run that has none, the run is
 * split in three — what came before, a new material holding just this question,
 * and what came after. Only the new question moves under the new passage;
 * dragging its neighbours along would silently re-file questions the teacher
 * did not touch.
 */
export function insertQuestionAfter(
  groups: GroupForm[],
  afterUid: string,
  question: QuestionForm,
  needsMaterial = false,
): GroupForm[] {
  const at = locate(groups, afterUid);
  if (!at) return appendQuestion(groups, question, needsMaterial);

  const next = cloneGroups(groups);
  const target = next[at.groupIndex];

  if (needsMaterial && !target.hasMaterial) {
    const after = target.questions.splice(at.questionIndex + 1);
    next.splice(
      at.groupIndex + 1,
      0,
      { ...createGroupDraft(true), questions: [question] },
      ...(after.length > 0 ? [{ ...createGroupDraft(), questions: after }] : []),
    );
    return next;
  }

  target.questions.splice(at.questionIndex + 1, 0, question);
  return next;
}

export function removeQuestion(groups: GroupForm[], uid: string): GroupForm[] {
  const at = locate(groups, uid);
  if (!at) return groups;

  const next = cloneGroups(groups);
  next[at.groupIndex].questions.splice(at.questionIndex, 1);
  return next;
}

/**
 * Copies a question in beside its original.
 *
 * This is the fastest path to a real paper — twelve True/False/Not Given
 * statements over one passage differ only in their prompt — so the copy lands
 * directly below rather than at the end of the part, where the teacher would
 * have to drag it back.
 */
export function duplicateQuestion(groups: GroupForm[], uid: string): GroupForm[] {
  const at = locate(groups, uid);
  if (!at) return groups;

  const source = groups[at.groupIndex].questions[at.questionIndex];
  const next = cloneGroups(groups);
  next[at.groupIndex].questions.splice(
    at.questionIndex + 1,
    0,
    duplicateQuestionDraft(source),
  );
  return next;
}

/**
 * Moves a question one place up or down **through the whole part**, crossing a
 * material boundary when it reaches one.
 *
 * Crossing is the point. In the old builder the up-arrow stopped at the edge of
 * its group and the only way to move a question under a different passage was
 * to delete and rewrite it. Here the boundary is just another position: a
 * question at the top of its material steps out from under it, and a question
 * at the bottom of the run above steps in.
 */
export function nudgeQuestion(
  groups: GroupForm[],
  uid: string,
  direction: -1 | 1,
): GroupForm[] {
  const order = questionUids(groups);
  const from = order.indexOf(uid);
  const to = from + direction;
  if (from === -1 || to < 0 || to >= order.length) return groups;

  return moveQuestion(groups, uid, order[to], direction === 1 ? "after" : "before");
}

/**
 * Moves a question to sit before or after another, wherever both live.
 *
 * The single entry point for reordering: the up/down buttons resolve to it via
 * {@link nudgeQuestion}, and a drag resolves to it directly with the id it was
 * dropped on. Ownership follows position — the question joins the group of the
 * question it lands next to, which is exactly the rule the rendered list shows.
 */
export function moveQuestion(
  groups: GroupForm[],
  uid: string,
  targetUid: string,
  placement: "before" | "after",
): GroupForm[] {
  if (uid === targetUid) return groups;

  const from = locate(groups, uid);
  if (!from) return groups;

  const next = cloneGroups(groups);
  const [moved] = next[from.groupIndex].questions.splice(from.questionIndex, 1);

  // Re-locate after the removal: pulling the question out shifts every index
  // after it, and splicing at a stale one drops the row a place off.
  const to = locate(next, targetUid);
  if (!to) {
    next[from.groupIndex].questions.splice(from.questionIndex, 0, moved);
    return next;
  }

  next[to.groupIndex].questions.splice(
    placement === "after" ? to.questionIndex + 1 : to.questionIndex,
    0,
    moved,
  );
  return next;
}

/**
 * Starts a new shared material at the end of the part.
 *
 * Everything added afterwards belongs to it, which is the behaviour the layout
 * already implies: the card is at the bottom, so the next question appears
 * under it.
 */
export function appendMaterial(groups: GroupForm[]): GroupForm[] {
  return [...cloneGroups(groups), createGroupDraft(true)];
}

/**
 * Attaches shared material to a question that has none, splitting the part at
 * that point.
 *
 * Reached from a question's own menu — "these questions share a passage" is a
 * thought a teacher has while looking at the questions, not before writing
 * them. The question it is invoked on becomes the first one covered.
 */
export function insertMaterialBefore(groups: GroupForm[], uid: string): GroupForm[] {
  const at = locate(groups, uid);
  if (!at) return appendMaterial(groups);

  const next = cloneGroups(groups);
  const source = next[at.groupIndex];

  // Already the first question under a material: there is nothing to split, the
  // teacher is looking at the card they would be creating.
  if (source.hasMaterial && at.questionIndex === 0) return groups;

  const moved = source.questions.splice(at.questionIndex);
  next.splice(at.groupIndex + 1, 0, {
    ...createGroupDraft(true),
    questions: moved,
  });
  return next;
}

/**
 * Removes shared material and keeps its questions.
 *
 * Deleting a passage must not delete the twelve questions about it — that is a
 * different, much more destructive act, and one the teacher can still perform
 * question by question. The questions merge upward into the run before them,
 * which is where the flat list already showed them sitting.
 */
export function removeMaterial(groups: GroupForm[], groupIndex: number): GroupForm[] {
  const target = groups[groupIndex];
  if (!target) return groups;

  const next = cloneGroups(groups);

  if (groupIndex === 0) {
    // Nothing above to merge into: the group stays as the part's unnamed
    // container and simply stops carrying material.
    next[0] = {
      ...next[0],
      hasMaterial: false,
      title: "",
      passage: "",
      instructions: "",
      imageUrl: "",
    };
    return next;
  }

  const [removed] = next.splice(groupIndex, 1);
  next[groupIndex - 1].questions.push(...removed.questions);
  return next;
}

/**
 * The questions a material covers, and where they sit — for the confirmation
 * that says what removing it will do.
 */
export function materialSummary(
  groups: GroupForm[],
  groupIndex: number,
  startNumber: number,
): { count: number; from: number; to: number } | null {
  const group = groups[groupIndex];
  if (!group) return null;

  let from = startNumber;
  for (let index = 0; index < groupIndex; index += 1) {
    from += groups[index].questions.length;
  }

  return {
    count: group.questions.length,
    from,
    to: from + Math.max(0, group.questions.length - 1),
  };
}
