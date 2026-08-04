import type { ComponentProps } from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn, getInitials } from "@/lib/utils";

/**
 * One avatar for people, classes, and schools.
 *
 * The initial-circle was written out in eight places — including a byte-identical local `Avatar`
 * function in both roster tabs — each with its own size, radius, and tint. This is that shape once.
 *
 * `tint` derives a stable colour from the name so two students in the same list are visually
 * distinguishable, while staying inside the chart ramp rather than reaching for raw Tailwind hues.
 */
const avatarVariants = cva(
  "relative inline-flex shrink-0 select-none items-center justify-center overflow-hidden font-semibold uppercase",
  {
    variants: {
      size: {
        xs: "size-7 text-3xs",
        sm: "size-9 text-2xs",
        md: "size-11 text-xs",
        lg: "size-14 text-base",
        xl: "size-16 text-lg",
        "2xl": "size-20 text-xl",
      },
      shape: {
        circle: "rounded-full",
        rounded: "rounded-xl",
      },
    },
    defaultVariants: { size: "md", shape: "circle" },
  },
);

/**
 * Drawn from the chart ramp so category tints follow the theme instead of a hard-coded pastel.
 *
 * Uses the `-tint` / `-ink` pair rather than mixing the raw ramp value: initials are 11px bold,
 * which WCAG counts as normal text, and the raw ramp on a wash of itself lands at 4.0-4.2:1 in
 * light. `check:contrast` asserts every pair at 4.5:1.
 */
const TINTS = [1, 2, 3, 4, 5] as const;

function tintStyle(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  const slot = TINTS[Math.abs(hash) % TINTS.length];
  return {
    backgroundColor: `var(--chart-${slot}-tint)`,
    color: `var(--chart-${slot}-ink)`,
  };
}

export type AvatarProps = Omit<ComponentProps<"span">, "children"> &
  VariantProps<typeof avatarVariants> & {
    name: string | null | undefined;
    src?: string | null;
    /** `brand` for the current user / current org; `seeded` to differentiate items in a list. */
    tint?: "brand" | "neutral" | "seeded";
  };

export default function Avatar({
  name,
  src,
  size,
  shape,
  tint = "brand",
  className,
  ...props
}: AvatarProps) {
  const initials = getInitials(name);

  return (
    <span
      data-slot="avatar"
      aria-hidden={src ? undefined : true}
      className={cn(
        avatarVariants({ size, shape }),
        !src && tint === "brand" && "bg-[color-mix(in_srgb,var(--primary)_13%,transparent)] text-accent-foreground",
        !src && tint === "neutral" && "bg-muted text-muted-foreground",
        className,
      )}
      style={!src && tint === "seeded" ? tintStyle(name ?? "?") : undefined}
      {...props}
    >
      {src ? (
        // Not `next/image`: avatars are user uploads served from the backend host and, while
        // editing, from a local `blob:` preview. `next.config.ts` deliberately allows no remote
        // image hosts, so the optimizer would reject exactly the URLs this component receives.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={name ?? ""} className="size-full object-cover" />
      ) : (
        initials
      )}
    </span>
  );
}

export { Avatar, avatarVariants };
