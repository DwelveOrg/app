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
 * ## The numbers are fractions of the backdrop, not of the viewport
 *
 * The backdrop is not the window. In the authenticated shell it is the content
 * column, inset by a 264px sidebar; elsewhere (`anchor="viewport"`) it happens
 * to fill the screen. The light is placed at a percentage *of that box*, so the
 * fraction has to be measured against that box too — dividing by
 * `window.innerWidth` puts the light up to 200px to the right of the cursor and
 * only lines the two up at the far right edge.
 *
 * The box is measured lazily and cached: the cursor moves constantly, the
 * column only when the window resizes or the sidebar appears.
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
    // read the same two numbers to compute its parallax. It is also the box the
    // light's `%` position resolves against, which is why it is what we measure.
    const element = ref.current?.closest<HTMLElement>(".shell-backdrop");
    if (!element) return;

    let frame = 0;
    let pending: { x: number; y: number } | null = null;
    let box: DOMRect | null = null;

    const paint = () => {
      frame = 0;
      if (!pending) return;

      // Measured here rather than per event: reading layout inside the frame
      // callback costs one read at most per frame, and only while the cursor is
      // actually moving.
      box ??= element.getBoundingClientRect();

      if (box.width > 0 && box.height > 0) {
        const offsetX = pending.x - box.left;
        const offsetY = pending.y - box.top;

        // Two representations of the same point, because the two things that
        // read it need different units.
        //
        // Fractions drive the parallax, which scales a fixed pixel amplitude by
        // how far across the box the cursor is. Left unclamped on purpose: with
        // the cursor over the sidebar the fraction goes negative, which is the
        // correct lean for a cursor that is off the canvas to the left.
        element.style.setProperty("--pointer-x", (offsetX / box.width).toFixed(4));
        element.style.setProperty("--pointer-y", (offsetY / box.height).toFixed(4));

        // Pixels drive the light itself, and they exist so that moving it is a
        // *transform* rather than a repaint. The light used to be a gradient
        // positioned by percentage inside a full-bleed box, which meant every
        // frame re-rasterised a viewport-sized radial gradient — around three
        // million device pixels of gradient maths per frame on a Retina display.
        // It trailed the cursor badly. The gradient is now drawn once into a
        // fixed 44rem square that the compositor slides, so the light lands
        // exactly where the cursor is.
        element.style.setProperty("--pointer-px", `${offsetX.toFixed(1)}px`);
        element.style.setProperty("--pointer-py", `${offsetY.toFixed(1)}px`);

        element.dataset.tracking = "true";
      }

      pending = null;
    };

    const onPointerMove = (event: PointerEvent) => {
      // A coarse pointer firing into a fine-pointer session (a touchscreen on a
      // laptop) should not yank the light to wherever a finger landed.
      if (event.pointerType === "touch") return;

      pending = { x: event.clientX, y: event.clientY };

      // Coalesce to one write per frame. `pointermove` can fire far faster than
      // the display refreshes, and every extra write is a style recalculation
      // for nothing.
      frame ||= requestAnimationFrame(paint);
    };

    // Losing the cursor fades the light out rather than freezing it mid-canvas,
    // which would read as a stain on the page instead of as a reflection. The
    // queued frame goes with it: a move that arrived just before the cursor left
    // would otherwise paint the light straight back on at a stale position.
    const stopTracking = () => {
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
      pending = null;
      element.dataset.tracking = "false";
    };

    // `pointerleave` does not bubble, so a listener on `document` is never run
    // for the one the UA fires at `<html>` when the cursor leaves the window —
    // which is why the light used to freeze instead of fading. `pointerout`
    // does bubble, and a null `relatedTarget` is precisely "went nowhere in this
    // document", i.e. out of the window.
    const onPointerOut = (event: PointerEvent) => {
      if (!event.relatedTarget) stopTracking();
    };

    // Both of these move the column the light is measured against: the window
    // resizing, and the sidebar arriving or leaving at the md breakpoint.
    const remeasure = () => {
      box = null;
    };

    const observer = new ResizeObserver(remeasure);
    observer.observe(element);

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("pointerout", onPointerOut, { passive: true });
    window.addEventListener("resize", remeasure, { passive: true });
    window.addEventListener("blur", stopTracking);

    return () => {
      if (frame) cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerout", onPointerOut);
      window.removeEventListener("resize", remeasure);
      window.removeEventListener("blur", stopTracking);
    };
  }, [enabled]);

  if (!enabled) return null;

  return <span ref={ref} className="shell-backdrop-pointer" />;
}
