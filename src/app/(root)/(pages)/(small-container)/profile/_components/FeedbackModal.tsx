"use client";

import { useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";

import Dialog, { DialogFooterActions } from "@/app/(root)/_components/Dialog";
import { Button } from "@/components/ui/Button";
import Field from "@/components/ui/Field";
import Textarea from "@/components/ui/textarea";
import {
  feedbackMinLength,
  feedbackModalTitleKeys,
  feedbackSubjectPrefix,
  supportEmail,
} from "../_constants";
import type { AccountContext, FeedbackModalKind } from "../_types";
import { buildAccountContext, buildMailtoHref } from "../_utils/mailto";

type FeedbackModalProps = {
  kind: FeedbackModalKind;
  /** Label for the row's trailing trigger button. */
  children: ReactNode;
  account: AccountContext;
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
  account,
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
          fullName: account.name,
          email: account.email,
          schoolName: account.schoolName,
          role: account.role,
        }),
    });

    window.location.href = href;
    handleOpenChange(false);
    toast.success(t("root.settings.support.feedbackModal.opened"));
  };

  return (
    <Dialog
      open={open}
      onOpenChange={handleOpenChange}
      title={t(feedbackModalTitleKeys[kind])}
      description={t("root.settings.support.feedbackModal.description")}
      trigger={
        <Button type="button" variant="outline" size="sm">
          {children}
        </Button>
      }
      showClose
      closeLabel={t("root.settings.support.feedbackModal.close")}
      footer={
        <DialogFooterActions
          cancelLabel={t("root.settings.support.feedbackModal.close")}
          submitLabel={t("root.settings.support.feedbackModal.submit")}
          submitDisabled={isTooShort}
          onSubmit={handleSubmit}
        />
      }
    >
      <Field
        label={t("root.settings.support.feedbackModal.messageLabel")}
        htmlFor={`feedback-message-${kind}`}
        error={
          showError
            ? t("root.settings.support.feedbackModal.tooShort", { count: feedbackMinLength })
            : undefined
        }
        hint={t("root.settings.support.feedbackModal.attachmentHint")}
      >
        <Textarea
          id={`feedback-message-${kind}`}
          surface="muted"
          value={message}
          onChange={(event) => {
            setMessage(event.target.value);
            if (showError) setShowError(false);
          }}
          placeholder={t("root.settings.support.feedbackModal.placeholder")}
          aria-invalid={showError}
          className="min-h-[140px]"
        />
      </Field>
    </Dialog>
  );
}
