import type { ReactNode } from "react";

import Surface from "@/components/ui/Surface";
import { cn } from "@/lib/utils";

type PanelProps = {
  /** Section heading rendered at the top of the panel. Omit for a bare surface. */
  title?: ReactNode;
  /** Optional trailing element on the title row (caption, link, control). */
  aside?: ReactNode;
  children: ReactNode;
  className?: string;
  /** Padding on the outer surface. Defaults to comfortable panel padding. */
  bodyClassName?: string;
  /**
   * Where short content sits in a stretched panel.
   *
   * Panels fill their grid row, so a card holding one list row or a donut ends
   * up much taller than its content. `start` leaves the slack underneath — the
   * void that made rows look ragged. `center` floats the content in the middle
   * instead, which reads as deliberate.
   */
  align?: "start" | "center";
};

/**
 * A dashboard panel: a resting surface with an optional heading row.
 *
 * The surface treatment itself now comes from `Surface`, so a panel here and a card in the classes
 * grid cannot drift apart. Panel only owns the heading rhythm.
 */
export default function Panel({
  title,
  aside,
  children,
  className,
  bodyClassName,
  align = "start",
}: PanelProps) {
  return (
    // `h-full` + column flex makes every panel fill its grid cell, so cards
    // sharing a row end level instead of leaving a ragged step where one has
    // less content. The body then grows to absorb the slack, which is what
    // lets an empty state centre itself in the space rather than clinging to
    // the top and leaving a void underneath.
    <Surface as="section" padding="none" className={cn("flex h-full flex-col", className)}>
      {title ? (
        <div className="flex items-center justify-between gap-3 px-5 pt-5 md:px-6 md:pt-6">
          <h2 className="type-heading text-foreground">{title}</h2>
          {aside ? <div className="shrink-0 text-sm text-muted-foreground">{aside}</div> : null}
        </div>
      ) : null}
      <div
        className={cn(
          "flex flex-1 flex-col p-5 md:p-6",
          title && "pt-4 md:pt-4",
          align === "center" && "justify-center",
          bodyClassName,
        )}
      >
        {children}
      </div>
    </Surface>
  );
}
