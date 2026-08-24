"use client";

import { useTransition } from "react";
import { UserMinus } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";

import ConfirmDialog from "@/app/(root)/_components/ConfirmDialog";
import { removeSchoolMemberAction } from "@/app/(root)/_lib/school-actions";
import { useRefreshSchoolDirectory } from "../_hooks/useSchoolDirectory";

type RemoveTeacherDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  memberId: string;
  teacherName: string;
};

/** Admin removal of a teacher, including their active class assignments. */
export default function RemoveTeacherDialog({
  open,
  onOpenChange,
  memberId,
  teacherName,
}: RemoveTeacherDialogProps) {
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
        toast.error(t("root.schoolPage.teachers.remove.error"));
        return;
      }
      toast.success(t("root.schoolPage.teachers.remove.success", { name: teacherName }));
      onOpenChange(false);
      void refreshDirectory();
    });
  };

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      icon={<UserMinus />}
      title={t("root.schoolPage.teachers.remove.title", { name: teacherName })}
      description={t("root.schoolPage.teachers.remove.description")}
      cancelLabel={t("root.schoolPage.teachers.remove.cancel")}
      confirmLabel={t("root.schoolPage.teachers.remove.confirm")}
      isPending={isPending}
      onConfirm={handleRemove}
    />
  );
}
