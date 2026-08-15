
export type ExamEnvironmentKind = "sat" | "ielts" | "quiz";

const ENVIRONMENTS: Record<string, ExamEnvironmentKind> = {
  SAT: "sat",
  IELTS: "ielts",
  SIMPLE_QUIZ: "quiz",
  CUSTOM: "quiz",
};

export function environmentForFormat(format: string | undefined): ExamEnvironmentKind {
  return ENVIRONMENTS[(format ?? "").toUpperCase()] ?? "quiz";
}


export const EXAM_THEMES = ["paper", "slate", "contrast"] as const;
export type ExamTheme = (typeof EXAM_THEMES)[number];

export const EXAM_TEXT_SIZES = ["sm", "md", "lg", "xl"] as const;
export type ExamTextSize = (typeof EXAM_TEXT_SIZES)[number];

export type ExamAppearance = {
  theme: ExamTheme;
  textSize: ExamTextSize;
};

export const DEFAULT_APPEARANCE: Record<ExamEnvironmentKind, ExamAppearance> = {
  sat: { theme: "paper", textSize: "md" },
  ielts: { theme: "paper", textSize: "md" },
  quiz: { theme: "slate", textSize: "md" },
};

export function appearanceStorageKey(kind: ExamEnvironmentKind): string {
  return `dwelve-exam-appearance-${kind}`;
}

export function isExamTheme(value: unknown): value is ExamTheme {
  return typeof value === "string" && (EXAM_THEMES as readonly string[]).includes(value);
}

export function isExamTextSize(value: unknown): value is ExamTextSize {
  return (
    typeof value === "string" && (EXAM_TEXT_SIZES as readonly string[]).includes(value)
  );
}
