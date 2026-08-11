import type { FeedbackModalKind } from "../_types";

/**
 * Support inbox for the feedback and contact rows. There is no backend feedback
 * endpoint, so these rows compose a real message to this address instead of
 * pretending to submit. Override per environment with `NEXT_PUBLIC_SUPPORT_EMAIL`.
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
