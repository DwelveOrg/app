"use client";

import { useTransition } from "react";
import { UserMinus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";

import ConfirmDialog from "@/app/(root)/_components/ConfirmDialog";
import { removeSchoolMemberAction } from "@/app/(root)/_lib/school-actions";

type RemoveStudentDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  memberId: string;
  studentName: string;
};

/**
 * Admin-only removal of a student from the selected school. The roster is
 * server-rendered from `getStudents()`, so on success we `router.refresh()` to
 * re-fetch the roster and the overview counts.
 */
export default function RemoveStudentDialog({
  open,
  onOpenChange,
  memberId,
  studentName,
}: RemoveStudentDialogProps) {
  const { t } = useTranslation();
  const router = useRouter();
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
      router.refresh();
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
