"use client";

import { Check, CloudOff, Loader2, PencilLine } from "lucide-react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";
import type { AutosaveState } from "../_hooks/useAutosave";

/**
 * What the studio has done with the teacher's work, in four words or fewer.
 *
 * Autosave that does not say so is indistinguishable from data loss, so this is
 * not decoration — it is the only evidence the teacher has. Each state pairs an
 * icon with its own wording rather than a coloured dot: "unsaved" has to survive
 * a greyscale screenshot and a colour-blind reader
 * (`docs/design/design-system.md` §3.3).
 */
export default function SaveState({
  state,
  savedAt,
  isDirty,
}: {
  state: AutosaveState;
  savedAt: Date | null;
  isDirty: boolean;
}) {
  const { t } = useTranslation();

  const resolved = resolve(state, isDirty);

  const Icon =
    resolved === "saving"
      ? Loader2
      : resolved === "blocked"
        ? CloudOff
        : resolved === "dirty"
          ? PencilLine
          : Check;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-2xs",
        resolved === "blocked" ? "text-warning" : "text-muted-foreground",
      )}
      // Save state changes without user action, so it has to be announced.
      role="status"
      aria-live="polite"
    >
      <Icon
        aria-hidden="true"
        className={cn("size-3.5", resolved === "saving" && "animate-spin")}
      />
      {resolved === "saved" && savedAt
        ? t("root.tests.builder.save.savedAt", {
            time: savedAt.toLocaleTimeString(undefined, {
              hour: "2-digit",
              minute: "2-digit",
            }),
          })
        : t(`root.tests.builder.save.${resolved}`)}
    </span>
  );
}

/**
 * `isDirty` is the truth about whether the backend has this work; the autosave
 * machine only knows about its own last attempt. A teacher who types after a
 * successful save must not keep reading "Saved 14:02".
 */
function resolve(state: AutosaveState, isDirty: boolean) {
  if (state === "saving") return "saving" as const;
  if (state === "blocked") return "blocked" as const;
  if (isDirty) return "dirty" as const;
  if (state === "saved") return "saved" as const;
  return "clean" as const;
}
