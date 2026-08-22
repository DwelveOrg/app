import { cn } from "@/lib/utils";

/**
 * The ambient canvas behind an authenticated shell.
 *
 * A flat `--background` is only ever as good as the page in front of it, and
 * the pages that show the most of it are the ones with the least on them: a
 * fresh account with no membership renders three cards and then half a screen
 * of white. This puts a floor under that — faintly ruled paper, and nothing else.
 *
 * The two drifting orbs of brand light that used to cross it are gone. Slow
 * violet blobs behind a UI are the most legible "generated" tell there is:
 * light with no source, motion with no cause, present on every screen of a
 * product whose actual job is marking papers. What survives is the ruling,
 * which is the part that was ever doing work — it is structural, it is what an
 * assessment product is *made of*, and it holds still.
 *
 * It is a server component with no props to speak of and no client JavaScript,
 * because everything it does lives in `globals.css` (`.shell-backdrop*`). With
 * the orbs removed there is no animation left at all, so the reduced-motion
 * case and the default case are now the same screen.
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
    </div>
  );
}

export { ShellBackdrop };
