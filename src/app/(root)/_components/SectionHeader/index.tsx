import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

export type SectionHeaderProps = {
  icon?: LucideIcon;
  title: ReactNode;
  description?: ReactNode;
  /** Trailing control on the title row — a link, a count, a button. */
  aside?: ReactNode;
  className?: string;
};

/**
 * The heading block inside a panel: an accent icon chip, a title, and a line of supporting copy.
 *
 * The icon chip alone — `grid size-10 place-items-center rounded-xl` over a 12% primary tint — was
 * written out in seven files, four of which wrapped it in the same header markup with the same
 * heading and description classes.
 */
export default function SectionHeader({
  icon: Icon,
  title,
  description,
  aside,
  className,
}: SectionHeaderProps) {
  return (
    <div className={cn("flex items-start gap-3.5", className)}>
      {Icon ? (
        <span
          aria-hidden
          className="grid size-10 shrink-0 place-items-center rounded-xl bg-[color-mix(in_srgb,var(--primary)_12%,transparent)] text-primary"
        >
          <Icon className="size-[18px]" />
        </span>
      ) : null}

      <div className="min-w-0 flex-1">
        <h2 className="type-heading text-foreground">{title}</h2>
        {description ? (
          <p className="mt-1 max-w-[68ch] text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>

      {aside ? <div className="shrink-0">{aside}</div> : null}
    </div>
  );
}

export { SectionHeader };
