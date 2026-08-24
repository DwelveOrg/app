"use client";

import { useTransition } from "react";
import { UserMinus } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";

import ConfirmDialog from "@/app/(root)/_components/ConfirmDialog";
import { removeSchoolMemberAction } from "@/app/(root)/_lib/school-actions";
import { useRefreshSchoolDirectory } from "../_hooks/useSchoolDirectory";

type RemoveStudentDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  memberId: string;
  studentName: string;
};

/**
 * Admin-only removal of a student from the selected school. The lazy roster
 * cache and server-rendered aggregate counts are refreshed together.
 */
export default function RemoveStudentDialog({
  open,
  onOpenChange,
  memberId,
  studentName,
}: RemoveStudentDialogProps) {
  const { t } = useTranslation();
  const refreshDirectory = useRefreshSchoolDirectory();
  const [isPending, startTransition] = useTransition();

  const handleRemove = () => {
    startTransition(async () => {
      const result = await removeSchoolMemberAction({ memberId });
      if (result?.serverError) {
        toast.error(result.serverError);
        return;
      }
      if (result?.validationErrors) {
        toast.error(t("root.schoolPage.students.remove.error"));
        return;
      }
      toast.success(t("root.schoolPage.students.remove.success", { name: studentName }));
      onOpenChange(false);
      void refreshDirectory();
    });
  };

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      icon={<UserMinus />}
      title={t("root.schoolPage.students.remove.title", { name: studentName })}
      description={t("root.schoolPage.students.remove.description")}
      cancelLabel={t("root.schoolPage.students.remove.cancel")}
      confirmLabel={t("root.schoolPage.students.remove.confirm")}
      isPending={isPending}
      onConfirm={handleRemove}
    />
  );
}
