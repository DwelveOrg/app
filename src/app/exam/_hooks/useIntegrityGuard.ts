"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
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
 * The cover requests fullscreen inside the Start/Resume gesture. This hook
 * keeps it enforced once the paper is mounted and exposes a recovery gate for
 * a refresh or browser-initiated exit. `screenfull.isEnabled` also lets the
 * recovery path distinguish a missing capability from an ignored request;
 * neither may permanently lock a student out of an attempt.
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
  const [fullscreenUnavailable, setFullscreenUnavailable] = useState(false);
  const [fullscreenBypassed, setFullscreenBypassed] = useState(false);
  const [violations, setViolations] = useState(0);
  const fullscreenActive = useSyncExternalStore(
    subscribeToFullscreen,
    readFullscreen,
    readFullscreenOnServer,
  );

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
      setFullscreenUnavailable(true);
      return false;
    }
    try {
      await screenfull.request(document.documentElement);
      setFullscreenUnavailable(false);
      setFullscreenBypassed(false);
      return true;
    } catch {
      setFullscreenUnavailable(true);
      return false;
    }
  }, []);

  useEffect(() => {
    if (!active || !delivery.requireFullscreen || !screenfull.isEnabled) return;

    // A refreshed/restored attempt has no trusted gesture with which to enter
    // fullscreen. The derived snapshot pauses the paper and asks for one; do
    // not count the refresh as an exit because the student has not left a
    // fullscreen session.

    const onChange = () => {
      if (screenfull.isFullscreen) {
        setFullscreenUnavailable(false);
        setFullscreenBypassed(false);
        return;
      }

      setFullscreenBypassed(false);
      void report("FULLSCREEN_EXIT");
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
    /** The paper pauses until a trusted gesture restores required fullscreen. */
    fullscreenRequired:
      active &&
      delivery.requireFullscreen &&
      screenfull.isEnabled &&
      !fullscreenActive &&
      !fullscreenBypassed,
    /** A trusted request was rejected, so the student needs an explicit fallback. */
    fullscreenUnavailable,
    requestFullscreen,
    continueWithoutFullscreen: () => setFullscreenBypassed(true),
  };
}

function subscribeToFullscreen(onStoreChange: () => void): () => void {
  if (!screenfull.isEnabled) return () => undefined;
  screenfull.on("change", onStoreChange);
  return () => screenfull.off("change", onStoreChange);
}

function readFullscreen(): boolean {
  // Unsupported browsers use the documented capability fallback and never
  // expose a gate the student cannot satisfy.
  return !screenfull.isEnabled || screenfull.isFullscreen;
}

function readFullscreenOnServer(): boolean {
  // Fullscreen is a browser-only capability. Treat the server render as safe;
  // useSyncExternalStore reconciles it immediately after hydration.
  return true;
}
