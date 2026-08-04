"use client";

import { useTranslation } from "react-i18next";

import MessagePromptDialog from "@/app/(root)/_components/MessagePromptDialog";

type RejectRequestDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studentName: string;
  isSubmitting: boolean;
  onConfirm: (message: string) => void;
};

/** Confirms rejecting a join request, with an optional reason for the student. */
export default function RejectRequestDialog({
  open,
  onOpenChange,
  studentName,
  isSubmitting,
  onConfirm,
}: RejectRequestDialogProps) {
  const { t } = useTranslation();

  return (
    <MessagePromptDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t("root.enrollment.classRequests.rejectTitle", { name: studentName })}
      description={t("root.enrollment.classRequests.rejectDescription")}
      label={t("root.enrollment.classRequests.reasonLabel")}
      placeholder={t("root.enrollment.classRequests.reasonPlaceholder")}
      cancelLabel={t("root.enrollment.classRequests.cancel")}
      confirmLabel={t("root.enrollment.classRequests.confirmReject")}
      tone="destructive"
      isSubmitting={isSubmitting}
      onConfirm={onConfirm}
    />
  );
}
