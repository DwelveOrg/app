import { cn } from "@/lib/utils";

/**
 * The ambient canvas behind an authenticated shell.
 *
 * A flat `--background` is only ever as good as the page in front of it, and
 * the pages that show the most of it are the ones with the least on them: a
 * fresh account with no membership renders three cards and then half a screen
 * of white. This puts a floor under that — faintly ruled paper with two slow
 * washes of brand light moving across it.
 *
 * It is a server component with no props to speak of and no client JavaScript,
 * because everything it does lives in `globals.css` (`.shell-backdrop*`). The
 * motion is CSS keyframes on `transform` alone, which the compositor runs
 * without the main thread — the point being that this is on every page of an
 * app used on school hardware, so it has to cost nothing to be worth having.
 * The design notes, the contrast budget, and the reduced-motion fallback are
 * all documented beside the CSS.
 *
 * Deliberately absent from the studio and the exam room. Both set their canvas
 * to `--sidebar` precisely so the surface announces "different rules here", and
 * an exam in particular is a screen with nothing to look at but the paper.
 *
 * @param anchor `container` (default) positions against the nearest positioned
 * ancestor — right for a shell that fills the viewport and scrolls internally.
 * `viewport` pins it instead, for a shell whose own box scrolls, so the field
 * stays put underneath rather than sliding away with the content.
 */
export default function ShellBackdrop({
  anchor = "container",
  className,
}: {
  anchor?: "container" | "viewport";
  className?: string;
}) {
  return (
    <div
      aria-hidden="true"
      data-anchor={anchor}
      className={cn("shell-backdrop", className)}
    >
      <span className="shell-backdrop-rules" />
      <span className="shell-backdrop-orb shell-backdrop-orb-lead" />
      <span className="shell-backdrop-orb shell-backdrop-orb-trail" />
    </div>
  );
}

export { ShellBackdrop };
