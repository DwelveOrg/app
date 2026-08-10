"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import screenfull from "screenfull";

import { readSafeActionData } from "@/lib/actions/read-safe-action-result";
import type { IntegrityAction } from "@/app/(root)/_lib/test-delivery";
import { reportViolationAction } from "../_lib/attempts.actions";
import type { TakerDelivery } from "@/lib/tests/paper.schemas";
import type { ViolationType } from "../_lib/attempts.schemas";

export type IntegrityNotice = {
  type: ViolationType;
  action: IntegrityAction;
  count: number;
  limit: number | null;
  /** The server ended the attempt over this one. */
  ended: boolean;
};

/**
 * Exam integrity, as the delivery rules describe it.
 *
 * ## What this hook does and does not decide
 *
 * It **detects** and **reports**. Every consequence — warn, count, end the
 * attempt — is resolved by the server, which owns the rule and owns the
 * attempt. That split is not ceremony: a client that decided when to end an
 * exam would be a client that a modified copy simply never ends, and the whole
 * feature would be theatre.
 *
 * ## The rules it enforces locally
 *
 * `blockCopyPaste` and `blockContextMenu` are prevented in the page as well as
 * reported, because there the point is friction rather than proof. Preventing a
 * paste stops the accident; reporting it records the attempt. Neither is a
 * security boundary and neither is presented as one.
 *
 * ## Fullscreen
 *
 * `screenfull.isEnabled` is the reason this uses the library: a browser can
 * refuse fullscreen outright (an iframe without the permission, some mobile
 * browsers), and a request that silently does nothing would leave a student
 * pressing a button that never opens their exam. When it is unavailable the
 * requirement is reported as unavailable, and the attempt proceeds — locking a
 * student out of an exam over a browser capability is a worse outcome than a
 * missing precaution.
 *
 * ## Noise
 *
 * Every detector is debounced and de-duplicated. A window losing focus can fire
 * `blur` and `visibilitychange` for one act, and an overlay that says "you left
 * the screen" twice for one alt-tab is an accusation the student knows is
 * wrong.
 */
export function useIntegrityGuard({
  attemptId,
  delivery,
  active,
  onEnded,
}: {
  attemptId: string;
  delivery: TakerDelivery;
  /** False once the paper is submitted — nothing to police after that. */
  active: boolean;
  onEnded: () => void;
}) {
  const [notice, setNotice] = useState<IntegrityNotice | null>(null);
  const [fullscreenBlocked, setFullscreenBlocked] = useState(false);
  const [violations, setViolations] = useState(0);

  /**
   * Written in an effect, never during render.
   *
   * `onEnded` submits the attempt, and its identity changes whenever the
   * runtime re-renders — which is every keystroke in an essay. Reading it
   * through a ref is what lets every listener below be registered once instead
   * of being torn down and rebuilt continuously.
   */
  const onEndedRef = useRef(onEnded);
  useEffect(() => {
    onEndedRef.current = onEnded;
  });

  /** Last report per type, so one act cannot be counted twice. */
  const lastReportRef = useRef<Map<ViolationType, number>>(new Map());

  const report = useCallback(
    async (type: ViolationType) => {
      if (!active) return;

      const now = Date.now();
      const previous = lastReportRef.current.get(type) ?? 0;
      // 1.5s: long enough to collapse the blur/visibilitychange pair that one
      // alt-tab produces, short enough that two deliberate exits are two.
      if (now - previous < 1_500) return;
      lastReportRef.current.set(type, now);

      try {
        const result = readSafeActionData(
          await reportViolationAction({
            attemptId,
            type,
            occurredAt: new Date(now).toISOString(),
          }),
          "exam.errors.generic",
        );

        setViolations(result.violationCount);
        setNotice({
          type,
          action: result.action,
          count: result.violationCount,
          limit: result.violationLimit,
          ended: result.attemptEnded,
        });

        if (result.attemptEnded) onEndedRef.current();
      } catch {
        // A violation that could not be reported is not the student's problem
        // and must not block their paper. The server missed one event; the
        // attempt continues.
      }
    },
    // `active` rather than a ref: it flips exactly once, at submit, so
    // rebuilding the callback then costs nothing and keeps the read honest.
    [attemptId, active],
  );

  /* --- Leaving the screen ------------------------------------------------- */

  useEffect(() => {
    if (!active || !delivery.detectLeaveScreen) return;

    const onVisibility = () => {
      if (document.visibilityState === "hidden") void report("LEFT_SCREEN");
    };

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("blur", onVisibility);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("blur", onVisibility);
    };
  }, [active, delivery.detectLeaveScreen, report]);

  /* --- Fullscreen --------------------------------------------------------- */

  const requestFullscreen = useCallback(async () => {
    if (!screenfull.isEnabled) {
      setFullscreenBlocked(true);
      return false;
    }
    try {
      await screenfull.request();
      return true;
    } catch {
      setFullscreenBlocked(true);
      return false;
    }
  }, []);

  useEffect(() => {
    if (!active || !delivery.requireFullscreen || !screenfull.isEnabled) return;

    const onChange = () => {
      if (!screenfull.isFullscreen) void report("FULLSCREEN_EXIT");
    };

    screenfull.on("change", onChange);
    return () => screenfull.off("change", onChange);
  }, [active, delivery.requireFullscreen, report]);

  /* --- Copy, paste, context menu ------------------------------------------ */

  useEffect(() => {
    if (!active || !delivery.blockCopyPaste) return;

    const onCopy = (event: ClipboardEvent) => {
      event.preventDefault();
      void report("COPY_ATTEMPT");
    };
    const onPaste = (event: ClipboardEvent) => {
      event.preventDefault();
      void report("PASTE_ATTEMPT");
    };

    document.addEventListener("copy", onCopy);
    document.addEventListener("cut", onCopy);
    document.addEventListener("paste", onPaste);
    return () => {
      document.removeEventListener("copy", onCopy);
      document.removeEventListener("cut", onCopy);
      document.removeEventListener("paste", onPaste);
    };
  }, [active, delivery.blockCopyPaste, report]);

  useEffect(() => {
    if (!active || !delivery.blockContextMenu) return;

    const onContextMenu = (event: MouseEvent) => {
      event.preventDefault();
      void report("CONTEXT_MENU");
    };

    document.addEventListener("contextmenu", onContextMenu);
    return () => document.removeEventListener("contextmenu", onContextMenu);
  }, [active, delivery.blockContextMenu, report]);

  /* --- Leaving the page --------------------------------------------------- */

  useEffect(() => {
    if (!active) return;

    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      // The browser's own prompt, deliberately: this is the one moment where a
      // native modal is right, because it is the only thing that can actually
      // stop the navigation.
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [active]);

  return {
    notice,
    dismissNotice: () => setNotice(null),
    violations,
    /** The browser will not grant fullscreen; the requirement cannot be met. */
    fullscreenBlocked,
    requestFullscreen,
    fullscreenSupported: screenfull.isEnabled,
  };
}
