import type { ComponentProps } from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

/**
 * Every status pill, count chip, and category tag.
 *
 * The previous version of this file was a stock shadcn `Badge` with zero consumers, while the app
 * hand-rolled 45 inline `rounded-full` spans in five recurring shapes. These variants are those
 * shapes, so the badge finally matches what the product actually renders.
 *
 * Tints are `color-mix` against the live token rather than a fixed pastel, so a badge stays legible
 * on `--card`, `--muted`, and `--sidebar` in both themes without a hand-written `dark:` variant.
 */
const badgeVariants = cva(
  [
    "inline-flex w-fit shrink-0 items-center justify-center gap-1 whitespace-nowrap",
    "font-semibold transition-colors duration-[var(--dur-1)]",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-3",
  ].join(" "),
  {
    variants: {
      variant: {
        /** The action accent — "current", "selected", "your role". */
        primary:
          "bg-[color-mix(in_srgb,var(--primary)_13%,transparent)] text-accent-foreground",
        /** Identity, not state. Reserve for brand moments. */
        brand: "bg-[color-mix(in_srgb,var(--brand)_14%,transparent)] text-brand",
        /** The quiet default — counts, "soon", type labels. */
        neutral: "bg-muted text-muted-foreground",
        /** Same weight as neutral but reads as a boundary rather than a fill. */
        outline: "border border-border bg-card text-muted-foreground",
        success:
          "bg-[color-mix(in_srgb,var(--success)_14%,transparent)] text-success",
        warning:
          "bg-[color-mix(in_srgb,var(--warning)_14%,transparent)] text-warning",
        destructive:
          "bg-[color-mix(in_srgb,var(--destructive)_14%,transparent)] text-destructive",
        info: "bg-[color-mix(in_srgb,var(--info)_14%,transparent)] text-info",
        /** Solid — for the one badge on screen that must be seen (unread count). */
        solid: "bg-destructive text-destructive-foreground",
      },
      size: {
        xs: "h-4 rounded-full px-1.5 text-3xs",
        sm: "h-5 rounded-full px-2 text-2xs",
        md: "h-6 rounded-full px-2.5 text-xs",
      },
      /** `count` keeps a circle until the number needs more room. */
      shape: {
        pill: "",
        count: "min-w-5 px-1 tabular-nums",
      },
      uppercase: {
        true: "uppercase tracking-[0.06em]",
        false: "",
      },
    },
    defaultVariants: {
      variant: "neutral",
      size: "sm",
      shape: "pill",
      uppercase: false,
    },
  }
)

export type BadgeVariant = NonNullable<VariantProps<typeof badgeVariants>["variant"]>;

export type BadgeProps = ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }

function Badge({
  className,
  variant,
  size,
  shape,
  uppercase,
  asChild = false,
  ...props
}: BadgeProps) {
  const Comp = asChild ? Slot.Root : "span"

  return (
    <Comp
      data-slot="badge"
      data-variant={variant}
      className={cn(badgeVariants({ variant, size, shape, uppercase }), className)}
      {...props}
    />
  )
}

export default Badge
export { Badge, badgeVariants }
