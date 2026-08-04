/** Canonical product name — import this everywhere instead of using the raw string. */
export const BRAND_NAME = "Dwelve" as const;

/**
 * Tailwind classes applied to the wordmark text inside DwelveLogo.
 *
 * Manrope 700, not the display serif: the delivered logo artwork uses a bold geometric sans, and
 * design-system §2 requires the wordmark to match the mark it sits beside. Kept here so the
 * wordmark style is identical everywhere.
 *
 * The size is part of the lockup, not a typographic choice — 22px is what sits level with the 36px
 * mark — so it lives here rather than as a loose `text-[22px]` in the component. It is the one
 * place in the product where a raw size is correct; see design-system §2.
 */
export const BRAND_WORDMARK_CLASSES =
  "text-[22px] font-sans font-bold leading-none tracking-[-0.02em]" as const;
