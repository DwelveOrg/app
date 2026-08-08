"use client";

import { useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";
import type { QuestionEditorProps } from "../../_types";
import NumericEditor from "./NumericEditor";
import { EditorLabel } from "./fields";

/**
 * `SAT_GRID_IN` — the student-produced response.
 *
 * Storage-wise this is an ordinary `NUMERIC` question, so the answer key editor
 * is the numeric one unchanged. What differs is that the SAT grid can only hold
 * four characters, and the rules that follow from that ("no negative numbers,
 * no more than four digits including the decimal point") are invisible in a
 * plain number field. A teacher who sets the answer to -1.25 finds out at the
 * exam, not in the builder.
 *
 * So the numeric editor gets a grid preview above it that shows the answer as
 * the student will enter it, and says plainly when it will not fit.
 */
export default function GridInEditor(props: QuestionEditorProps) {
  const { t } = useTranslation();
  const answer = useWatch({ control: props.control, name: `${props.name}.config.answer` });

  const entry = gridEntry(answer);

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <EditorLabel hint={t("root.tests.builder.gridIn.hint")}>
          {t("root.tests.builder.gridIn.title")}
        </EditorLabel>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex gap-1" aria-hidden="true">
            {[0, 1, 2, 3].map((column) => (
              <span
                key={column}
                className={cn(
                  "grid h-11 w-8 place-items-center rounded-md border text-sm font-semibold tabular-nums",
                  entry.fits && entry.characters[column]
                    ? "border-primary/40 bg-accent text-accent-foreground"
                    : "border-border bg-background text-muted-foreground",
                )}
              >
                {entry.fits ? (entry.characters[column] ?? "") : ""}
              </span>
            ))}
          </div>

          <p className="text-2xs text-muted-foreground">
            {entry.status === "empty"
              ? t("root.tests.builder.gridIn.empty")
              : entry.status === "ok"
                ? t("root.tests.builder.gridIn.ok")
                : entry.status === "negative"
                  ? t("root.tests.builder.gridIn.negative")
                  : t("root.tests.builder.gridIn.tooLong")}
          </p>
        </div>
      </div>

      <NumericEditor {...props} />
    </div>
  );
}

/**
 * The four-cell grid a student fills in. A College Board grid holds four
 * characters and accepts no minus sign, which is the whole reason this preview
 * exists.
 */
function gridEntry(answer: unknown): {
  characters: string[];
  fits: boolean;
  status: "empty" | "ok" | "negative" | "tooLong";
} {
  if (typeof answer !== "number" || !Number.isFinite(answer)) {
    return { characters: [], fits: false, status: "empty" };
  }

  if (answer < 0) {
    return { characters: [], fits: false, status: "negative" };
  }

  const text = String(Number(answer.toFixed(6)));
  if (text.length > 4) {
    return { characters: [], fits: false, status: "tooLong" };
  }

  return { characters: text.split(""), fits: true, status: "ok" };
}
