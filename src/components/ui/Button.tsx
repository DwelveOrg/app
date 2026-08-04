import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { LoaderCircle } from "lucide-react"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

/**
 * The one button in the product — every button and button-shaped link.
 *
 * It replaced three competing implementations: this one, a `BrandButton` that rendered only a
 * `<Link>` and hard-coded four hexes, and a `CustomButton` that baked a `mt-2` margin into the
 * primitive so every caller had to fight it. `asChild` covers the link case; `variant="brand"`
 * covers the marketing case; `loading` covers the 33 places that hand-rolled a spinner.
 *
 * Accent rule (design-system §3): teal is action, violet is identity. `brand` is for the landing
 * and auth surfaces where the button *is* the brand moment — not for ordinary primary actions.
 */
const buttonVariants = cva(
  [
    "group/button relative inline-flex shrink-0 cursor-pointer items-center justify-center gap-1.5",
    "rounded-lg border border-transparent bg-clip-padding font-medium whitespace-nowrap select-none",
    "interactive outline-none",
    "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40",
    "disabled:pointer-events-none disabled:opacity-50",
    "aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  ].join(" "),
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-elev-1 hover:bg-primary-hover hover:shadow-elev-2",
        outline:
          "border-border bg-card text-foreground shadow-elev-1 hover:border-primary/35 hover:bg-muted hover:shadow-elev-2 aria-expanded:border-primary/35 aria-expanded:bg-muted",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-accent hover:text-accent-foreground aria-expanded:bg-accent aria-expanded:text-accent-foreground",
        ghost:
          "hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground",
        destructive:
          "bg-destructive/10 text-destructive hover:bg-destructive/18 focus-visible:border-destructive/40 focus-visible:ring-destructive/25",
        "destructive-solid":
          "bg-destructive text-destructive-foreground shadow-elev-1 hover:shadow-elev-2 hover:brightness-110 focus-visible:ring-destructive/30",
        link: "text-primary underline-offset-4 hover:underline",
        /** Identity moment — landing nav, hero, CTA. Violet, glowing, white label in both themes. */
        brand:
          "border-transparent bg-[image:var(--brand-gradient)] text-white shadow-elev-brand hover:brightness-108 hover:shadow-elev-3",
      },
      size: {
        xs: "h-7 gap-1 rounded-md px-2 text-2xs [&_svg:not([class*='size-'])]:size-3",
        sm: "h-8 gap-1 rounded-md px-2.5 text-xs [&_svg:not([class*='size-'])]:size-3.5",
        default: "h-9 px-3 text-sm",
        lg: "h-10 px-4 text-sm",
        xl: "h-12 px-6 text-sm font-semibold",
        icon: "size-9",
        "icon-xs": "size-7 rounded-md [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-8 rounded-md",
        "icon-lg": "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export type ButtonProps = React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
    /**
     * Swaps the button's icons for a spinner and blocks interaction. The label stays mounted so
     * the button keeps its width and the row it sits in never reflows mid-submit.
     *
     * Icons are hidden in CSS rather than by the caller, so a button with a leading icon is
     * `loading={isPending}` with the icon left in place — no `{pending ? <Spinner/> : <Check/>}`
     * ternary. That ternary was hand-written in 27 places precisely because the earlier version of
     * this prop prepended a spinner instead of replacing what was already there.
     */
    loading?: boolean
  }

export default function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  loading = false,
  disabled,
  children,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot.Root : "button"

  // `asChild` hands rendering to the child (usually a Link), which can only take a single element —
  // so the spinner treatment is only available on a real <button>.
  if (asChild) {
    return (
      <Comp
        data-slot="button"
        data-variant={variant}
        data-size={size}
        className={cn(buttonVariants({ variant, size, className }))}
        {...props}
      >
        {children}
      </Comp>
    )
  }

  return (
    <button
      data-slot="button"
      data-variant={variant}
      data-size={size}
      data-loading={loading || undefined}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(
        buttonVariants({ variant, size, className }),
        // The spinner stands in for whatever icons the caller passed, so they are hidden rather
        // than unmounted — unmounting would change the button's width mid-submit.
        loading && "[&>svg:not([data-slot=button-spinner])]:hidden",
      )}
      {...props}
    >
      {loading ? (
        <LoaderCircle
          data-slot="button-spinner"
          aria-hidden
          className="animate-spin motion-reduce:animate-none"
        />
      ) : null}
      {children}
    </button>
  )
}

export { Button, buttonVariants }
