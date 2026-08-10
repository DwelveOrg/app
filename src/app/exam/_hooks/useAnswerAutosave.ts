"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { readSafeActionData } from "@/lib/actions/read-safe-action-result";
import type { AnswerValue } from "@/lib/tests/answers";
import { saveAnswersAction } from "../_lib/attempts.actions";

export type SaveState = "idle" | "pending" | "saving" | "saved" | "error";

const IDLE_MS = 2_500;

/**
 * Answer autosave.
 *
 * ## The failure this is designed around
 *
 * A student answers forty questions over an hour and the network drops at
 * minute fifty. Everything about this hook follows from making that survivable:
 *
 * - **Nothing is held only in React state.** Every change goes into a pending
 *   map that is drained to the server, and a failed drain puts the answers
 *   *back* rather than dropping them. The next successful flush carries them.
 * - **Batched by question, not by keystroke.** The map is keyed by
 *   `questionId`, so typing a 300-word essay is one entry that keeps being
 *   overwritten, and one request when the typing stops.
 * - **Flushed on the events that precede losing the page**, not only on a
 *   timer: switching question, blurring the window, and `visibilitychange`.
 *   The last is the one that matters on a phone, where the browser may never
 *   run another timer after the student switches apps.
 * - **`keepalive` is not available here** — the save goes through a server
 *   action, not `fetch` — so `pagehide` cannot be relied on. The 2.5s idle
 *   window plus the visibility flush is what keeps the worst case small.
 *
 * The state it reports is deliberately coarse. A student mid-exam needs to know
 * "saved" or "not saved yet", and a per-question spinner would turn every
 * keystroke into a status change to monitor.
 */
export function useAnswerAutosave(attemptId: string) {
  const [state, setState] = useState<SaveState>("idle");
  const [savedAt, setSavedAt] = useState<Date | null>(null);

  /** Answers changed since the last successful flush, keyed by question. */
  const pendingRef = useRef<Map<string, AnswerValue | null>>(new Map());
  const timerRef = useRef<number | null>(null);
  /** Guards against two flushes overlapping and racing on the same question. */
  const inFlightRef = useRef(false);

  const flush = useCallback(async (): Promise<boolean> => {
    if (inFlightRef.current) return false;
    if (pendingRef.current.size === 0) return true;

    // Taken, not read: anything the student types during the request belongs to
    // the *next* batch, and leaving it in the map would send it twice.
    const batch = [...pendingRef.current.entries()];
    pendingRef.current.clear();
    inFlightRef.current = true;
    setState("saving");

    try {
      readSafeActionData(
        await saveAnswersAction({
          attemptId,
          answers: batch.map(([questionId, value]) => ({ questionId, value })),
        }),
        "exam.errors.saveFailed",
      );
      setSavedAt(new Date());
      setState(pendingRef.current.size > 0 ? "pending" : "saved");
      return true;
    } catch {
      /*
       * Put them back, but never over a newer value: the student may have
       * changed the same question while the failed request was in flight, and
       * restoring the old answer on top of it would silently undo their edit.
       */
      for (const [questionId, value] of batch) {
        if (!pendingRef.current.has(questionId)) {
          pendingRef.current.set(questionId, value);
        }
      }
      setState("error");
      return false;
    } finally {
      inFlightRef.current = false;
    }
  }, [attemptId]);

  const schedule = useCallback(() => {
    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => void flush(), IDLE_MS);
  }, [flush]);

  /** Records a change and starts the idle countdown. */
  const queue = useCallback(
    (questionId: string, value: AnswerValue | null) => {
      pendingRef.current.set(questionId, value);
      setState("pending");
      schedule();
    },
    [schedule],
  );

  /** Sends everything now — on question change, before submitting, on hide. */
  const flushNow = useCallback(() => {
    if (timerRef.current) window.clearTimeout(timerRef.current);
    return flush();
  }, [flush]);

  useEffect(() => {
    const onHide = () => {
      // `hidden` covers switching tabs, switching apps, and locking the phone.
      // On mobile browsers this is frequently the last event the page ever
      // gets, so it is the real last chance to save — not `beforeunload`.
      if (document.visibilityState === "hidden") void flushNow();
    };

    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("blur", onHide);
    return () => {
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("blur", onHide);
    };
  }, [flushNow]);

  useEffect(
    () => () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    },
    [],
  );

  return {
    state,
    savedAt,
    queue,
    flushNow,
    /** True while work is still owed to the server — gates the submit button. */
    hasUnsaved: () => pendingRef.current.size > 0,
  };
}
