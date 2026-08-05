"use client";

import { UserMinus } from "lucide-react";
import { useTranslation } from "react-i18next";

import ConfirmDialog from "@/app/(root)/_components/ConfirmDialog";

type RemoveClassTeacherDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teacherName: string;
  isSubmitting: boolean;
  onConfirm: () => void;
};

/**
 * Confirms unassigning a teacher from a class. They lose their management
 * access to it — including the request queue — so this is worth confirming;
 * the caller runs the mutation and refreshes the class afterwards.
 */
export default function RemoveClassTeacherDialog({
  open,
  onOpenChange,
  teacherName,
  isSubmitting,
  onConfirm,
}: RemoveClassTeacherDialogProps) {
  const { t } = useTranslation();

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      icon={<UserMinus />}
      title={t("root.classDetail.removeTeacher.title", { name: teacherName })}
      description={t("root.classDetail.removeTeacher.description")}
      cancelLabel={t("root.classDetail.removeTeacher.cancel")}
      confirmLabel={t("root.classDetail.removeTeacher.confirm")}
      isPending={isSubmitting}
      onConfirm={onConfirm}
    />
  );
}
