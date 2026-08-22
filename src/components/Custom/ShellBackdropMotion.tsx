"use client";

import { useEffect, useRef, useState } from "react";

/**
 * The part of the canvas that answers the pointer.
 *
 * Two things ride on the same two numbers: a light centred where the cursor is,
 * and a few pixels of parallax on the ruling behind it. Both are written as CSS
 * custom properties on this element, so the whole interaction costs one style
 * mutation per frame and no React render — `useState` appears here exactly once,
 * to decide whether to mount at all.
 *
 * ## What it deliberately does not do
 *
 * It does not mount on a device without a real cursor. On a phone there is no
 * pointer to follow, so a pointer-reactive layer is a permanently-centred glow
 * that never explains itself — worse than nothing. `(hover: hover) and
 * (pointer: fine)` is the gate, re-evaluated if the input method changes (a
 * tablet gaining a trackpad, a laptop's touchscreen taking over).
 *
 * It does not mount under `prefers-reduced-motion`. A light that chases the
 * cursor is motion regardless of how gentle it is, and the reduced-motion
 * contract is that the page holds still.
 *
 * It does not track pointer position in React state. That would re-render an
 * ancestor of the entire authenticated app on every mouse move.
 */
export default function ShellBackdropMotion() {
  const ref = useRef<HTMLSpanElement>(null);
  const [enabled, setEnabled] = useState(false);

  // Gate on capability, not on a user-agent guess, and keep listening: an iPad
  // with a keyboard attached mid-session changes the correct answer.
  useEffect(() => {
    const query = window.matchMedia(
      "(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)",
    );

    const sync = () => setEnabled(query.matches);

    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (!enabled) return;

    // The variables go on the backdrop *root*, not on this span: custom
    // properties inherit downward only, and the ruling — a sibling — has to
    // read the same two numbers to compute its parallax.
    const element = ref.current?.closest<HTMLElement>(".shell-backdrop");
    if (!element) return;

    let frame = 0;
    let pending: { x: number; y: number } | null = null;

    const paint = () => {
      frame = 0;
      if (!pending) return;

      // Fractions of the viewport rather than pixels, so the same two numbers
      // drive a light positioned in `%` and a parallax scaled in `px` without
      // either needing to know the window size.
      element.style.setProperty("--pointer-x", pending.x.toFixed(4));
      element.style.setProperty("--pointer-y", pending.y.toFixed(4));
      element.dataset.tracking = "true";
      pending = null;
    };

    const onPointerMove = (event: PointerEvent) => {
      // A coarse pointer firing into a fine-pointer session (a touchscreen on a
      // laptop) should not yank the light to wherever a finger landed.
      if (event.pointerType === "touch") return;

      pending = {
        x: event.clientX / window.innerWidth,
        y: event.clientY / window.innerHeight,
      };

      // Coalesce to one write per frame. `pointermove` can fire far faster than
      // the display refreshes, and every extra write is a style recalculation
      // for nothing.
      frame ||= requestAnimationFrame(paint);
    };

    // Losing the cursor fades the light out rather than freezing it mid-canvas,
    // which would read as a stain on the page instead of as a reflection.
    const onPointerLeave = () => {
      element.dataset.tracking = "false";
    };

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    document.addEventListener("pointerleave", onPointerLeave);
    window.addEventListener("blur", onPointerLeave);

    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", onPointerMove);
      document.removeEventListener("pointerleave", onPointerLeave);
      window.removeEventListener("blur", onPointerLeave);
    };
  }, [enabled]);

  if (!enabled) return null;

  return <span ref={ref} className="shell-backdrop-pointer" />;
}
