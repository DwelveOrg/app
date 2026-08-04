"use client";

import { UserMinus } from "lucide-react";
import { useTranslation } from "react-i18next";

import ConfirmDialog from "@/app/(root)/_components/ConfirmDialog";

type RemoveClassStudentDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studentName: string;
  isSubmitting: boolean;
  onConfirm: () => void;
};

/**
 * Confirms unenrolling a student from a class. Removal drops their roster
 * entry, so it is destructive enough to confirm — the caller runs the mutation
 * and refreshes the class data afterwards.
 */
export default function RemoveClassStudentDialog({
  open,
  onOpenChange,
  studentName,
  isSubmitting,
  onConfirm,
}: RemoveClassStudentDialogProps) {
  const { t } = useTranslation();

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      icon={<UserMinus />}
      title={t("root.classDetail.removeStudent.title", { name: studentName })}
      description={t("root.classDetail.removeStudent.description")}
      cancelLabel={t("root.classDetail.removeStudent.cancel")}
      confirmLabel={t("root.classDetail.removeStudent.confirm")}
      isPending={isSubmitting}
      onConfirm={onConfirm}
    />
  );
}
