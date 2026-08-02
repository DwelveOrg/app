import type { TFunction } from "i18next";

/**
 * The question-type catalogue, the format blueprints, and the validation issues
 * all arrive as i18n **key strings** the client simply `t()`s. A key the
 * catalogs do not carry yet must not render as a raw dotted path in front of a
 * teacher, so every lookup falls back to something readable.
 */

/** `SAT_RW_MCQ` -> `SAT RW MCQ`. Last-resort label for an untranslated key. */
export function humanizeToken(token: string): string {
  return token.replace(/_/g, " ").trim();
}

/** Translates a backend-supplied key, falling back when it is missing. */
export function translateKey(
  t: TFunction,
  key: string | null | undefined,
  fallback: string,
): string {
  if (!key) return fallback;
  const translated = t(key, { defaultValue: "" });
  return typeof translated === "string" && translated ? translated : fallback;
}
