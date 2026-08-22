"use client";

import { useMemo } from "react";
import { useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";

import { paragraphLabels } from "@/app/(root)/_lib/test-form";
import type { QuestionEditorProps } from "../../_types";
import {
  presentationFor,
  type QuestionEditorKind,
} from "@/lib/tests/question-presentation";
import ChoiceEditor from "./ChoiceEditor";
import FixedChoiceEditor from "./FixedChoiceEditor";
import GridInEditor from "./GridInEditor";
import LetteredGridEditor from "./LetteredGridEditor";
import ManualEditor from "./ManualEditor";
import MatchingEditor from "./MatchingEditor";
import NumericEditor from "./NumericEditor";
import OrderingEditor from "./OrderingEditor";
import TextAnswerEditor from "./TextAnswerEditor";

/**
 * Picks the answer-key editor for a question.
 *
 * The switch is on the *presentation* kind, not on `answerKind` directly, which
 * is the change that makes each preset look like itself: `TRUE_FALSE` and
 * `SINGLE_CHOICE` are the same engine and get different editors, while
 * `SAT_GRID_IN` and `NUMERIC` are the same engine and differ only by a preview.
 * `presentationFor` falls back to the engine for a preset it has never seen, so
 * the backend catalogue can grow without a frontend release.
 */
export default function QuestionAnswerEditor(props: QuestionEditorProps) {
  const { type, spec } = props;
  const presentation = presentationFor(type, spec);

  return renderEditor(presentation.editor, props, presentation.wordLimits);
}

function renderEditor(
  kind: QuestionEditorKind,
  props: QuestionEditorProps,
  wordLimits: boolean,
) {
  switch (kind) {
    case "choice":
      return <ChoiceEditor {...props} />;
    case "fixedChoice":
      return <FixedChoiceEditor {...props} />;
    case "letteredGrid":
      return <LetteredGridEditor {...props} />;
    case "text":
      return <TextAnswerEditor {...props} wordLimits={wordLimits} />;
    case "gapFill":
      return <TextAnswerEditor {...props} wordLimits={wordLimits} />;
    case "numeric":
      return <NumericEditor {...props} />;
    case "gridIn":
      return <GridInEditor {...props} />;
    case "matching":
      return <MatchingEditor {...props} />;
    case "headings":
      return <HeadingsEditor {...props} />;
    case "ordering":
      return <OrderingEditor {...props} />;
    case "manual":
      return <ManualEditor {...props} />;
  }
}

/**
 * Matching headings, whose right-hand column already exists in the passage.
 *
 * IELTS matching-headings asks students to label paragraphs A, B, C… with
 * headings from a list. The paragraph labels are derived from the passage on
 * every render (`paragraphLabels`), so offering them as one-press right-hand
 * items removes the single most tedious step in authoring IELTS reading:
 * retyping A/B/C/D/E and hoping they still line up after the passage is edited.
 *
 * The subscription to the passage lives **here**, in the one editor that reads
 * it, rather than being watched higher up and passed down. Watching it where
 * the material is rendered would re-render every question sharing that passage
 * on each keystroke — twelve questions and several hundred fields to keep one
 * suggestion list current.
 */
function HeadingsEditor(props: QuestionEditorProps) {
  const { t } = useTranslation();

  const passage = useWatch({
    control: props.control,
    name: `${props.groupName}.passage`,
  });

  const suggestions = useMemo(
    () =>
      paragraphLabels(passage ?? "").map(({ label, text }) => ({
        key: label,
        // The first few words identify the paragraph without turning the right
        // column into the passage all over again.
        text: text.split(/\s+/).slice(0, 8).join(" "),
      })),
    [passage],
  );

  return (
    <MatchingEditor
      {...props}
      suggestions={suggestions}
      labels={{
        left: t("root.tests.builder.headings.leftTitle"),
        right: t("root.tests.builder.headings.rightTitle"),
      }}
    />
  );
}
