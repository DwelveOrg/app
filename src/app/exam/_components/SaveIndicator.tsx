"use client";

import { Check, CircleDashed, CloudOff, Loader2, PencilLine } from "lucide-react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";
import type { SaveState } from "../_hooks/useAnswerAutosave";

/**
 * Whether the student's answers have reached the server.
 *
 * The studio has the same control for the same reason, and here it matters
 * more. A teacher who loses an autosave loses a draft they can retype; a
 * student who loses one loses an exam they cannot re-sit. This is the only
 * evidence they have, so the failed state is the loud one — amber, an icon, and
 * words, rather than the quiet grey the other three states use.
 *
 * It never claims more than it knows: "Saved" appears only after a write the
 * server acknowledged, and the moment anything is typed it goes back to
 * "Saving…".
 */
export default function SaveIndicator({
  state,
  savedAt,
}: {
  state: SaveState;
  savedAt: Date | null;
}) {
  const { t } = useTranslation();

  // The check is reserved for an acknowledged write. "Not saved yet" under a
  // check mark reads as saved to a student glancing at the corner mid-exam.
  const Icon =
    state === "saving"
      ? Loader2
      : state === "error"
        ? CloudOff
        : state === "pending"
          ? PencilLine
          : state === "idle"
            ? CircleDashed
            : Check;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-2xs",
        state === "error" ? "font-medium text-warning" : "text-muted-foreground",
      )}
      // Announced, because it changes without the student doing anything and
      // the failure is something they need to know about immediately.
      role="status"
      aria-live="polite"
    >
      <Icon aria-hidden="true" className={cn("size-3.5", state === "saving" && "animate-spin")} />
      <span className="hidden sm:inline">
        {state === "saved" && savedAt
          ? t("exam.runtime.save.savedAt", {
              time: savedAt.toLocaleTimeString(undefined, {
                hour: "2-digit",
                minute: "2-digit",
              }),
            })
          : t(`exam.runtime.save.${state}`)}
      </span>
    </span>
  );
}
