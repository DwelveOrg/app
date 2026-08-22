import type { ElementType, ComponentPropsWithoutRef, ReactNode } from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

/**
 * The one bordered container in the product.
 *
 * Before this existed, `rounded-2xl border border-border bg-card` was written out
 * by hand in fifty places, which meant fifty places to miss when the surface treatment changed.
 * Everything that used to be a `Panel`, a `SectionCard`, a stat tile, a settings group, a roster
 * shell or an inline `<section className="rounded-2xl …">` is this component with different props.
 *
 * Depth model: a hairline defines an edge, elevation separates a *layer*, and after the elevation
 * ramp was rebuilt those are no longer the same claim. Levels 1–2 are resting surfaces and are now
 * very nearly flat — the border draws the panel and a single contact pixel keeps it off the canvas.
 * Levels 3 and hand-rolled `elev-4` are for chrome that genuinely floats over the page: menus,
 * popovers, dialogs, sheets.
 *
 * Most of a page rests at `elevation={1}`. Two adjacent surfaces at different levels means one is
 * wrong. A resting panel at `elevation={3}` is now conspicuously wrong, which is the point.
 */
const surfaceVariants = cva("relative", {
  variants: {
    variant: {
      /** Default: sits above the canvas. */
      card: "border border-border bg-card text-card-foreground",
      /** Recedes into the canvas — for wells, insets, and secondary groupings. */
      muted: "border border-border bg-muted text-foreground",
      /** No fill at all; the canvas shows through. For grouping without a box. */
      plain: "border border-border bg-transparent",
      /** A slot waiting to be filled: "add a question", "no classes yet". */
      dashed: "border border-dashed border-border bg-transparent",
      /** A destructive zone — delete account, remove member. */
      danger:
        "border border-destructive/30 bg-[color-mix(in_srgb,var(--destructive)_7%,var(--card))] text-foreground",
      /** Genuinely floating chrome only — sticky bars, scrolled nav. Never an ordinary panel. */
      glass:
        "border border-border bg-[color-mix(in_srgb,var(--card)_82%,transparent)] supports-backdrop-filter:backdrop-blur-md",
    },
    padding: {
      none: "",
      sm: "p-4",
      md: "p-5",
      lg: "p-5 sm:p-6",
    },
    radius: {
      md: "rounded-xl",
      lg: "rounded-2xl",
    },
    elevation: {
      0: "",
      1: "shadow-elev-1",
      2: "shadow-elev-2",
      3: "shadow-elev-3",
    },
    /*
     * Hover, without the lift.
     *
     * This used to translate the whole surface up 2px on hover (`--lift`, now 0), so moving a
     * pointer across a grid of cards made the page ripple. The signal is carried by the edge
     * instead: the hairline goes from `--border` to a real ink edge, and the fill steps once
     * toward `--muted`. That is a change you can see on a still screen — which is the test a
     * hover state should pass, since the user is looking at the card, not at the transition.
     */
    interactive: {
      true: "interactive cursor-pointer hover:border-foreground/25 hover:bg-[color-mix(in_srgb,var(--muted)_55%,var(--card))] focus-within:border-foreground/40",
      false: "",
    },
    /** Turns the surface into a divided list container. Children become rows. */
    divided: {
      true: "divide-y divide-border overflow-hidden",
      false: "",
    },
  },
  defaultVariants: {
    variant: "card",
    padding: "md",
    radius: "lg",
    elevation: 1,
    interactive: false,
    divided: false,
  },
});

type SurfaceOwnProps<E extends ElementType> = VariantProps<typeof surfaceVariants> & {
  as?: E;
  className?: string;
  children?: ReactNode;
};

/**
 * Polymorphic in `as`: a Surface rendered as a `form` must accept a form's `onSubmit`, not a div's.
 * Typing this against `"div"` only silently blocked every non-div call site.
 */
export type SurfaceProps<E extends ElementType = "div"> = SurfaceOwnProps<E> &
  Omit<ComponentPropsWithoutRef<E>, keyof SurfaceOwnProps<E>>;

export default function Surface<E extends ElementType = "div">({
  as,
  variant,
  padding,
  radius,
  elevation,
  interactive,
  divided,
  className,
  children,
  ...props
}: SurfaceProps<E>) {
  const Comp = (as ?? "div") as ElementType;

  return (
    <Comp
      data-slot="surface"
      className={cn(
        surfaceVariants({
          variant,
          // A divided list owns its own row padding, so the container must not add any.
          padding: divided ? "none" : padding,
          radius,
          elevation,
          interactive,
          divided,
        }),
        className,
      )}
      {...props}
    >
      {children}
    </Comp>
  );
}

export { Surface, surfaceVariants };
