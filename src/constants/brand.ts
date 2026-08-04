/** Canonical product name — import this everywhere instead of using the raw string. */
export const BRAND_NAME = "Dwelve" as const;

/**
 * Tailwind classes applied to the wordmark text inside DwelveLogo.
 *
 * Manrope 700, not the display serif: the delivered logo artwork uses a bold geometric sans, and
 * design-system §2 requires the wordmark to match the mark it sits beside. Kept here so the
 * wordmark style is identical everywhere.
 */
export const BRAND_WORDMARK_CLASSES =
  "font-sans font-bold leading-none tracking-[-0.02em]" as const;
