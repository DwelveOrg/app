import type { ReactNode } from "react";

import type { AnswerValue } from "@/lib/tests/answers";
import type { PaperItem, PaperTest } from "@/lib/tests/paper.schemas";
import type { NavigatorEntry } from "../QuestionNavigator";

export type ExamEnvironmentProps = {
  test: PaperTest;
  items: PaperItem[];
  index: number;
  direction: number;
  answers: Map<string, AnswerValue | null>;
  flagged: Set<string>;
  crossedOut: Map<string, Set<string>>;
  onAnswer: (questionId: string, value: AnswerValue | null) => void;
  onToggleFlag: (questionId: string) => void;
  onToggleCrossOut: (questionId: string, optionId: string) => void;
  goTo: (index: number) => void;
  navigatorEntries: NavigatorEntry[];
  unanswered: number;
  submitting: boolean;
  onRequestSubmit: () => void;
  allowBack: boolean;
  timer: ReactNode;
  saveStatus: ReactNode;
  appearanceMenu: ReactNode;
};
