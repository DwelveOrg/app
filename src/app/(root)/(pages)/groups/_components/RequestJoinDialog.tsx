"use client";

import { useTranslation } from "react-i18next";

import MessagePromptDialog from "@/app/(root)/_components/MessagePromptDialog";

type RequestJoinDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  className: string;
  isSubmitting: boolean;
  onConfirm: (message: string) => void;
};

/** Optional-message dialog shown before a student sends a class join request. The message is
 * optional per the backend contract, so submitting an empty field is allowed. */
export default function RequestJoinDialog({
  open,
  onOpenChange,
  className,
  isSubmitting,
  onConfirm,
}: RequestJoinDialogProps) {
  const { t } = useTranslation();

  return (
    <MessagePromptDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t("root.enrollment.requestDialog.title", { name: className })}
      description={t("root.enrollment.requestDialog.description")}
      label={t("root.enrollment.requestDialog.messageLabel")}
      placeholder={t("root.enrollment.requestDialog.messagePlaceholder")}
      cancelLabel={t("root.enrollment.requestDialog.cancel")}
      confirmLabel={t("root.enrollment.requestDialog.submit")}
      tone="default"
      isSubmitting={isSubmitting}
      onConfirm={onConfirm}
    />
  );
}
