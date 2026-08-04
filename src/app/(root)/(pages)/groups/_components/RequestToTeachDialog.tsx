"use client";

import { useTranslation } from "react-i18next";

import MessagePromptDialog from "@/app/(root)/_components/MessagePromptDialog";

type RequestToTeachDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  className: string;
  isSubmitting: boolean;
  onConfirm: (message: string) => void;
};

/** Optional-message dialog shown before a teacher asks to be assigned to a class. */
export default function RequestToTeachDialog({
  open,
  onOpenChange,
  className,
  isSubmitting,
  onConfirm,
}: RequestToTeachDialogProps) {
  const { t } = useTranslation();

  return (
    <MessagePromptDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t("root.enrollment.requestToTeachDialog.title", { name: className })}
      description={t("root.enrollment.requestToTeachDialog.description")}
      label={t("root.enrollment.requestToTeachDialog.messageLabel")}
      placeholder={t("root.enrollment.requestToTeachDialog.messagePlaceholder")}
      cancelLabel={t("root.enrollment.requestToTeachDialog.cancel")}
      confirmLabel={t("root.enrollment.requestToTeachDialog.submit")}
      isSubmitting={isSubmitting}
      onConfirm={onConfirm}
    />
  );
}
