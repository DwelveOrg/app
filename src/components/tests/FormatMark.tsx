import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * The icon tile that stands in for a test's identity.
 *
 * A test has no meaningful pair of initials — "IELTS Practice 1" would render
 * as "IP" — so where a school or a class shows an `Avatar`, a test shows its
 * format mark. One component, used by the list card, the studio top bar, and the
 * format picker, so the three never disagree about the shape.
 */
export default function FormatMark({
  icon: Icon,
  size = "md",
  className,
}: {
  icon: LucideIcon;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "grid shrink-0 place-items-center rounded-xl",
        "bg-[color-mix(in_srgb,var(--primary)_12%,transparent)] text-primary",
        size === "sm" && "size-8 [&_svg]:size-4",
        size === "md" && "size-11 [&_svg]:size-5",
        size === "lg" && "size-14 rounded-2xl [&_svg]:size-6",
        className,
      )}
    >
      <Icon />
    </span>
  );
}

export { FormatMark };
