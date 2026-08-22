import { cn } from "@/lib/utils";
import ShellBackdropMotion from "./ShellBackdropMotion";

/**
 * The ambient canvas behind an authenticated shell.
 *
 * A flat `--background` is only ever as good as the page in front of it, and
 * the pages that show the most of it are the ones with the least on them: a
 * fresh account with no membership renders three cards and then half a screen
 * of white. This puts a floor under that.
 *
 * ## Why it moves again
 *
 * It used to carry two drifting orbs of brand light; those were removed, on the
 * grounds that slow violet blobs behind a UI are the most legible "generated"
 * tell there is — light with no source, motion with no cause. That objection
 * was right about *those* orbs and is answered here rather than ignored:
 *
 * - The motion has a **cause**. The field parallaxes against the pointer and
 *   carries a faint light where the cursor is, so what moves moves *because the
 *   user did something*. Nothing drifts on its own except the paper grain, at a
 *   rate closer to a minute hand than to an animation.
 * - The motion has a **source**. It is the ruling itself that shifts, and the
 *   motes that drift are grid-aligned squares — the page breathing, not
 *   coloured gas behind it. The one lit element is anchored to the cursor,
 *   which is a source the user can see themselves controlling.
 *
 * Everything is transform and opacity on GPU-composited layers, painted once.
 * There is no `filter: blur()` on anything that moves: the soft edges come from
 * gradients that reach zero inside their own box, which is free. The pointer
 * layer is the only client JavaScript, it listens passively, and it writes two
 * CSS variables inside a rAF — it never triggers React work.
 *
 * Under `prefers-reduced-motion` every drift stops and the pointer light is not
 * mounted at all: a still ruled canvas is the fallback, which is exactly the
 * screen this component used to be.
 *
 * Deliberately absent from the studio and the exam room. Both set their canvas
 * to `--sidebar` precisely so the surface announces "different rules here", and
 * an exam in particular is a screen with nothing to look at but the paper.
 *
 * @param anchor `container` (default) positions against the nearest positioned
 * ancestor — right for a shell that fills the viewport and scrolls internally.
 * `viewport` pins it instead, for a shell whose own box scrolls, so the field
 * stays put underneath rather than sliding away with the content.
 * @param interactive Set `false` on a surface that should stay inert.
 */
export default function ShellBackdrop({
  anchor = "container",
  interactive = true,
  className,
}: {
  anchor?: "container" | "viewport";
  interactive?: boolean;
  className?: string;
}) {
  return (
    <div
      aria-hidden="true"
      data-anchor={anchor}
      className={cn("shell-backdrop", className)}
    >
      <span className="shell-backdrop-rules" />

      {/*
        Four, not a field of them. Enough that the canvas is never quite the
        same twice; few enough that counting them is not a thing you would do.
        Their offsets are staggered in CSS rather than randomised here so the
        server and client render the same markup.
      */}
      <span className="shell-backdrop-motes">
        <i style={{ "--mote": "0" } as React.CSSProperties} />
        <i style={{ "--mote": "1" } as React.CSSProperties} />
        <i style={{ "--mote": "2" } as React.CSSProperties} />
        <i style={{ "--mote": "3" } as React.CSSProperties} />
      </span>

      {interactive ? <ShellBackdropMotion /> : null}
    </div>
  );
}

export { ShellBackdrop };
