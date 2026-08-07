import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * The mark that stands in for a test's format — on the identity tile in the builder and on each
 * card in the create dialog.
 *
 * The icon arrives as a prop rather than being looked up here, which is the same shape
 * `SectionHeader` and `SectionCard` use. Resolving a component *inside* render gives React a new
 * type on every pass and remounts the subtree; taking it as a prop keeps the reference stable.
 * Callers pass `formatIcon(format)` from `../_constants`.
 */
export default function FormatMark({
  icon: Icon,
  className,
  iconClassName,
}: {
  icon: LucideIcon;
  className?: string;
  iconClassName?: string;
}) {
  return (
    <span
      aria-hidden="true"
      className={cn("grid shrink-0 place-items-center rounded-xl", className)}
    >
      <Icon className={cn("size-4", iconClassName)} />
    </span>
  );
}

export { FormatMark };
