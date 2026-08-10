import type { Transition, Variants } from "motion/react";

/**
 * The product's motion vocabulary, in one module.
 *
 * `docs/design/design-system.md` §5 sets the rules — motion conveys state, not
 * personality; ease out, no bounce; every animation needs a still equivalent —
 * and `globals.css` holds the tokens that implement them for CSS. Motion
 * components cannot read a CSS custom property as a number, so the same values
 * are mirrored here **once**. Two call sites that each pick their own 0.25s and
 * their own cubic-bezier is the drift this module prevents.
 *
 * Keep these in step with the `--dur-*` and `--ease-*` blocks in `globals.css`.
 */

/** `--dur-1` … `--dur-4`, in seconds, which is what motion wants. */
export const DUR = {
  /** 120ms — colour and state. */
  colour: 0.12,
  /** 180ms — hover, press. */
  press: 0.18,
  /** 260ms — enter, exit, reveal. */
  reveal: 0.26,
  /** 360ms — genuine layout moves. */
  layout: 0.36,
} as const;

/** `--ease-out-quint`, the default. */
export const EASE_OUT = [0.22, 1, 0.36, 1] as const;
/** `--ease-out-expo`, for longer reveals. */
export const EASE_OUT_LONG = [0.16, 1, 0.3, 1] as const;

export const revealTransition: Transition = {
  duration: DUR.reveal,
  ease: EASE_OUT,
};

/**
 * The transition for a row that is genuinely moving through a list.
 *
 * Longer than a reveal because the eye has to follow it: a question sliding
 * from position 12 to position 3 at 260ms reads as a jump, and the whole point
 * of animating a reorder is that the teacher can see *what* moved.
 */
export const listMoveTransition: Transition = {
  duration: DUR.layout,
  ease: EASE_OUT,
};

/* -------------------------------------------------------------------------- */
/* Variants                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * A row entering or leaving a list — a question added to a part, a material
 * card, a result row.
 *
 * `height` animates alongside opacity so the rows below close the gap rather
 * than snapping into it. That is the part that makes a deletion legible: the
 * list visibly heals where the row was.
 */
export const listRowVariants: Variants = {
  hidden: { opacity: 0, y: -4, height: 0 },
  shown: { opacity: 1, y: 0, height: "auto", transition: revealTransition },
  exit: {
    opacity: 0,
    height: 0,
    // Leaving is quicker than arriving: the row is gone as a decision the
    // moment it is pressed, and holding it on screen reads as lag.
    transition: { duration: DUR.press, ease: EASE_OUT },
  },
};

/** A panel or disclosure opening in place. */
export const disclosureVariants: Variants = {
  hidden: { opacity: 0, height: 0 },
  shown: { opacity: 1, height: "auto", transition: revealTransition },
  exit: { opacity: 0, height: 0, transition: { duration: DUR.press, ease: EASE_OUT } },
};

/** A staggered list arrival — a results table, a set of cards. */
export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  shown: {
    opacity: 1,
    transition: { staggerChildren: 0.04, delayChildren: 0.02 },
  },
};

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 8 },
  shown: { opacity: 1, y: 0, transition: revealTransition },
};

/**
 * Moving between questions in `ONE_AT_A_TIME` delivery.
 *
 * Directional, because direction is the information: a student pressing Back
 * must see the paper move the other way, or they cannot tell whether the press
 * registered. `custom` carries `1` for forward and `-1` for back.
 */
export const paperTurnVariants: Variants = {
  hidden: (direction: number) => ({ opacity: 0, x: direction * 24 }),
  shown: { opacity: 1, x: 0, transition: revealTransition },
  exit: (direction: number) => ({
    opacity: 0,
    x: direction * -24,
    transition: { duration: DUR.press, ease: EASE_OUT },
  }),
};

/* -------------------------------------------------------------------------- */
/* Reduced motion                                                              */
/* -------------------------------------------------------------------------- */

/**
 * The still equivalent of any variant set above: the same states, reached
 * instantly.
 *
 * `prefers-reduced-motion` is not optional (§5), and the failure mode it guards
 * against is specific — a student with vestibular sensitivity should not have
 * the paper slide sideways every time they answer a question. Callers select
 * with `useReducedMotion()`, so the content still arrives; it just arrives at
 * once.
 */
export const stillVariants: Variants = {
  hidden: { opacity: 1, y: 0, x: 0, height: "auto" },
  shown: { opacity: 1, y: 0, x: 0, height: "auto" },
  exit: { opacity: 0 },
};

/** Picks the animated or still set for a caller that already knows the preference. */
export function motionVariants(reduced: boolean | null, variants: Variants): Variants {
  return reduced ? stillVariants : variants;
}

/**
 * A transition that collapses to nothing under reduced motion, for the cases
 * that animate a single property inline rather than through a variant set.
 */
export function motionTransition(
  reduced: boolean | null,
  transition: Transition = revealTransition,
): Transition {
  return reduced ? { duration: 0 } : transition;
}
