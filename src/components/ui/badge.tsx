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
        /**
         * Selection / current state — "current", "selected", "your role".
         *
         * Fill and label are both the ink. This paired a wash of --primary with
         * `text-accent-foreground`, which was coherent only while --primary was
         * itself the violet; once action moved to ink it rendered violet type on
         * a grey wash. Same defect the sidebar's active row had, same fix: a
         * selected thing reads by value, and nothing on it disagrees.
         */
        primary:
          "bg-[color-mix(in_srgb,var(--foreground)_10%,transparent)] text-foreground",
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
      /*
       * Radius comes from `--radius-pill`, not from `rounded-full`.
       *
       * A badge is a *label on a thing*, and a half-circle label is a decision —
       * one that was being made 45 times a screen by default. Squaring it lets
       * the badge sit in the same geometric family as the card it annotates and
       * the button beside it, which is what makes a set of controls read as one
       * system. The token means the whole product's chips change shape from one
       * line if that call is ever reversed.
       */
      size: {
        xs: "h-4 rounded-[var(--radius-pill)] px-1.5 text-3xs",
        sm: "h-5 rounded-[var(--radius-pill)] px-2 text-2xs",
        md: "h-6 rounded-[var(--radius-pill)] px-2.5 text-xs",
      },
      /** `count` stays square-ish and grows only when the number needs the room. */
      shape: {
        pill: "",
        /* `numeric` puts the figure in the mono face with tabular digits — an
           unread count that changes width as it climbs is the one badge on
           screen guaranteed to be re-read. */
        count: "numeric min-w-5 px-1",
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
