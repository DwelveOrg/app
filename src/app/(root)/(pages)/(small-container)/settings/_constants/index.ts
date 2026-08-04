import type { FeedbackModalKind } from "../_types";

/** Compact trailing button for rows that perform an action (send, contact, ...). */
export const rowActionClassName =
  "inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-[13px] font-semibold text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

/** Compact trailing button for destructive actions (delete account). */
export const rowDangerActionClassName =
  "inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-[color-mix(in_srgb,var(--destructive)_12%,transparent)] px-3 py-1.5 text-[13px] font-semibold text-destructive transition-colors hover:bg-[color-mix(in_srgb,var(--destructive)_20%,transparent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--destructive)_45%,transparent)]";

/**
 * Support inbox for the feedback, contact and account-deletion rows. There is no
 * backend feedback or account-deletion endpoint yet, so these rows compose a
 * real message to this address instead of pretending to submit. Override per
 * environment with `NEXT_PUBLIC_SUPPORT_EMAIL`.
 */
export const supportEmail =
  process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "abdulazizyusupaliev009@gmail.com";

export const feedbackModalTitleKeys: Record<FeedbackModalKind, string> = {
  bug: "root.settings.support.reportBug.modalTitle",
  feature: "root.settings.support.requestFeature.modalTitle",
};

/** Subject line prefix per feedback kind, so support can triage from the inbox. */
export const feedbackSubjectPrefix: Record<FeedbackModalKind, string> = {
  bug: "Bug report",
  feature: "Feature request",
};

/** Minimum message length before the feedback modal will submit. */
export const feedbackMinLength = 10;
