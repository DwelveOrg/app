"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { UseFormWatch } from "react-hook-form";

import type { TestBuilderForm } from "@/app/(root)/_lib/tests.actions.schemas";

/** How long the teacher has to stop typing before a save is attempted. */
const IDLE_DELAY_MS = 12_000;

export type AutosaveState = "idle" | "pending" | "saving" | "saved" | "blocked";

/**
 * Saves the builder after a pause in typing.
 *
 * A test is a long authoring session — forty questions is an hour of work — and
 * the previous builder's only save was a button. The `beforeunload` guard
 * catches a closed tab, but it does not catch a laptop lid, a crashed tab, or a
 * teacher who assumed a web app saves itself. Whole-tree `PUT` is idempotent
 * and runs in one transaction, so repeating it costs nothing and cannot leave a
 * half-saved paper.
 *
 * Two rules keep it from becoming a nuisance:
 *
 * - **It never fires mid-thought.** The timer restarts on every change, so a
 *   save only happens after the teacher stops for {@link IDLE_DELAY_MS}.
 * - **It never nags.** An autosave that fails validation — a half-written option
 *   with no text, which the backend rejects outright — reports `blocked` and
 *   waits. It does not raise a toast, because the teacher is mid-edit and knows
 *   the row is unfinished. Explicit save still reports the error properly.
 */
export function useAutosave({
  watch,
  enabled,
  save,
}: {
  watch: UseFormWatch<TestBuilderForm>;
  /** False while the test is not a draft, or a save is already in flight. */
  enabled: boolean;
  /** Resolves `true` when the save happened, `false` when validation blocked it. */
  save: () => Promise<boolean>;
}) {
  const [state, setState] = useState<AutosaveState>("idle");
  const [savedAt, setSavedAt] = useState<Date | null>(null);

  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Held in refs so the subscription below is created once. Re-subscribing on
  // every render would drop pending timers and autosave would never fire.
  // Written in an effect rather than during render: the only reader is the
  // watch callback, which runs long after commit, so a frame of staleness is
  // impossible to observe.
  const saveRef = useRef(save);
  const enabledRef = useRef(enabled);

  useEffect(() => {
    saveRef.current = save;
    enabledRef.current = enabled;
  }, [save, enabled]);

  const run = useCallback(async () => {
    if (!enabledRef.current) return;
    setState("saving");
    const ok = await saveRef.current();
    if (ok) {
      setSavedAt(new Date());
      setState("saved");
    } else {
      setState("blocked");
    }
  }, []);

  useEffect(() => {
    const subscription = watch((_values, info) => {
      // `type` is only set for user-driven changes. A `reset()` — which is what
      // re-seeding after a save does — reports no type, and scheduling on it
      // would make every save schedule the next one forever.
      if (info.type !== "change") return;
      if (!enabledRef.current) return;

      setState("pending");
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => void run(), IDLE_DELAY_MS);
    });

    return () => {
      subscription.unsubscribe();
      if (timer.current) clearTimeout(timer.current);
    };
  }, [watch, run]);

  /** Cancels a pending autosave — an explicit save has just superseded it. */
  const cancel = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    setState("idle");
  }, []);

  const markSaved = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    setSavedAt(new Date());
    setState("saved");
  }, []);

  return { state, savedAt, cancel, markSaved };
}

export default useAutosave;
