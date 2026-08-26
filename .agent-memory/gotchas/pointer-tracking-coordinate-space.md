# Pointer Tracking Coordinate Space

## Context

`ShellBackdropMotion` publishes the cursor position as two CSS custom properties that
`.shell-backdrop-pointer` reads to place a radial-gradient light, and `.shell-backdrop-rules` reads
to compute a few pixels of counter-parallax. Both defects below shipped and survived `tsc`, ESLint,
and the build, because neither is a type or syntax error — the feature simply pointed at the wrong
place and never faded out.

## Knowledge

**The backdrop is not the viewport.** In `(root)/layout.tsx` the backdrop is a child of the content
column, which a 264px sidebar insets on `md` and up (measured: viewport 1280, box `x=264 w=1016`).
The light's position resolves as a percentage *of that box*, so a fraction computed as
`event.clientX / window.innerWidth` displaces it by up to ~210px to the right, converging on the
cursor only at the far right edge. Measure `getBoundingClientRect()` on `.shell-backdrop` and use
`(clientX - box.left) / box.width`. Fractions outside `0..1` are correct and must not be clamped —
with the cursor over the sidebar the light's centre belongs off the canvas — but anything scaling a
*length* off them (the parallax lean) needs its own `clamp()`.

**`document.addEventListener("pointerleave", …)` never fires.** `pointerleave` does not bubble, and
`document` is an ancestor of the `<html>` element the UA dispatches it at, so a non-capture listener
there is never invoked (verified in-page: `document` 0 calls, `documentElement` 1). The light
therefore froze mid-canvas instead of fading when the cursor left the window. Use `pointerout` on
`window` and test `!event.relatedTarget`, which bubbles and means "went nowhere in this document".

Cache the box and invalidate it from a `ResizeObserver` plus `resize`, rather than measuring per
event. Guard on a non-zero box: a backgrounded or collapsed window reports `0×0` and would otherwise
divide by zero.

## Relevant files

- `src/components/Custom/ShellBackdropMotion.tsx`
- `src/components/Custom/ShellBackdrop.tsx`
- `src/app/globals.css` (`.shell-backdrop*`)
- `src/app/(root)/layout.tsx`, `src/app/(root)/_components/Sidebar/index.tsx` (the 264px inset)

## Implications

Any future pointer-reactive layer must map into the box its CSS percentages resolve against, not
into the window. Verify it by reading the written variables back against a real pointer event and
asserting the error is zero — the bug is invisible to every automated gate this repository runs.
`/dev/preview/dashboard` renders the same shell composition without a session and is the cheapest
place to check.
