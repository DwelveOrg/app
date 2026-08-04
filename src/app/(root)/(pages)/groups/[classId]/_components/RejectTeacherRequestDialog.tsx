"use client";

import { useTranslation } from "react-i18next";

import MessagePromptDialog from "@/app/(root)/_components/MessagePromptDialog";

type RejectTeacherRequestDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teacherName: string;
  isSubmitting: boolean;
  onConfirm: (message: string) => void;
};

/** Confirms rejecting a teacher's request, with an optional reason for them. */
export default function RejectTeacherRequestDialog({
  open,
  onOpenChange,
  teacherName,
  isSubmitting,
  onConfirm,
}: RejectTeacherRequestDialogProps) {
  const { t } = useTranslation();

  return (
    <MessagePromptDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t("root.enrollment.teacherRequests.rejectTitle", { name: teacherName })}
      description={t("root.enrollment.teacherRequests.rejectDescription")}
      label={t("root.enrollment.teacherRequests.reasonLabel")}
      placeholder={t("root.enrollment.teacherRequests.reasonPlaceholder")}
      cancelLabel={t("root.enrollment.teacherRequests.cancel")}
      confirmLabel={t("root.enrollment.teacherRequests.confirmReject")}
      tone="destructive"
      isSubmitting={isSubmitting}
      onConfirm={onConfirm}
    />
  );
}
