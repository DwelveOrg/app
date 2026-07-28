"use client";

import { useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";

import { Modal } from "@/app/(root)/_components/Modal";
import Textarea from "@/components/ui/textarea";
import {
  feedbackMinLength,
  feedbackModalTitleKeys,
  feedbackSubjectPrefix,
  rowActionClassName,
  supportEmail,
} from "../_constants";
import type { FeedbackModalKind } from "../_types";
import { buildAccountContext, buildMailtoHref } from "../_utils/mailto";

type FeedbackModalProps = {
  kind: FeedbackModalKind;
  /** Label for the row's trailing trigger button. */
  children: ReactNode;
  accountName?: string | null;
  accountEmail?: string | null;
  schoolName?: string | null;
  role?: string | null;
};

/**
 * Bug-report / feature-request composer.
 *
 * The backend exposes no feedback endpoint, so submitting composes a real
 * message to {@link supportEmail} in the user's mail client rather than posting
 * into a void. Swap `handleSubmit` for a server action once an endpoint exists —
 * the validation and copy stay as-is. Attachments cannot ride along a `mailto:`
 * URL, so the modal asks for them in the mail client instead of showing a file
 * input that would silently drop the file.
 */
export function FeedbackModal({
  kind,
  children,
  accountName,
  accountEmail,
  schoolName,
  role,
}: Readonly<FeedbackModalProps>) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [showError, setShowError] = useState(false);

  const trimmed = message.trim();
  const isTooShort = trimmed.length < feedbackMinLength;

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) {
      setMessage("");
      setShowError(false);
    }
  };

  const handleSubmit = () => {
    if (isTooShort) {
      setShowError(true);
      return;
    }

    const href = buildMailtoHref({
      to: supportEmail,
      subject: `${feedbackSubjectPrefix[kind]} — Dwelve`,
      body:
        trimmed +
        buildAccountContext({
          fullName: accountName,
          email: accountEmail,
          schoolName,
          role,
        }),
    });

    window.location.href = href;
    handleOpenChange(false);
    toast.success(t("root.settings.support.feedbackModal.opened"));
  };

  return (
    <Modal
      className={rowActionClassName}
      open={open}
      onOpenChange={handleOpenChange}
      title={t(feedbackModalTitleKeys[kind])}
      description={t("root.settings.support.feedbackModal.description")}
      trigger={children}
      isSubmit
      onSubmit={handleSubmit}
      submitDisabled={isTooShort}
      closeLabel={t("root.settings.support.feedbackModal.close")}
      submitLabel={t("root.settings.support.feedbackModal.submit")}
    >
      <div className="space-y-2">
        <label
          htmlFor={`feedback-message-${kind}`}
          className="block text-sm font-semibold text-[var(--foreground)]"
        >
          {t("root.settings.support.feedbackModal.messageLabel")}
        </label>
        <Textarea
          id={`feedback-message-${kind}`}
          value={message}
          onChange={(event) => {
            setMessage(event.target.value);
            if (showError) setShowError(false);
          }}
          placeholder={t("root.settings.support.feedbackModal.placeholder")}
          aria-invalid={showError}
          className="min-h-[140px] resize-y bg-[var(--muted)]"
        />
        {showError ? (
          <p className="text-xs text-[var(--destructive)]">
            {t("root.settings.support.feedbackModal.tooShort", {
              count: feedbackMinLength,
            })}
          </p>
        ) : (
          <p className="text-xs text-[var(--muted-foreground)]">
            {t("root.settings.support.feedbackModal.attachmentHint")}
          </p>
        )}
      </div>
    </Modal>
  );
}
