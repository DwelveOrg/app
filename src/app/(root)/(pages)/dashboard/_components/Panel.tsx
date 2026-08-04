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
};

/**
 * A dashboard panel: a resting surface with an optional heading row.
 *
 * The surface treatment itself now comes from `Surface`, so a panel here and a card in the classes
 * grid cannot drift apart. Panel only owns the heading rhythm.
 */
export default function Panel({ title, aside, children, className, bodyClassName }: PanelProps) {
  return (
    <Surface as="section" padding="none" className={className}>
      {title ? (
        <div className="flex items-center justify-between gap-3 px-5 pt-5 md:px-6 md:pt-6">
          <h2 className="type-heading text-foreground">{title}</h2>
          {aside ? <div className="shrink-0 text-sm text-muted-foreground">{aside}</div> : null}
        </div>
      ) : null}
      <div className={cn("p-5 md:p-6", title && "pt-4 md:pt-4", bodyClassName)}>{children}</div>
    </Surface>
  );
}
