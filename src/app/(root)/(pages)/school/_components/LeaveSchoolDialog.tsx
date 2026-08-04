"use client";

import { useTransition } from "react";
import { LogOut } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";

import ConfirmDialog from "@/app/(root)/_components/ConfirmDialog";
import { leaveSchoolAction } from "@/app/(root)/_lib/school-actions";

type LeaveSchoolDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  schoolName: string;
};

/** Teachers and students can safely revoke their own school membership. */
export default function LeaveSchoolDialog({
  open,
  onOpenChange,
  schoolName,
}: LeaveSchoolDialogProps) {
  const { t } = useTranslation();
  const [isPending, startTransition] = useTransition();

  const handleLeave = () => {
    startTransition(async () => {
      const result = await leaveSchoolAction({});
      // Successful actions redirect to the dashboard; reaching this branch
      // means the backend rejected the request or a network call failed.
      if (result?.serverError) {
        toast.error(result.serverError);
        return;
      }
      toast.error(t("root.schoolPage.leave.error"));
    });
  };

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      icon={<LogOut />}
      title={t("root.schoolPage.leave.title", { name: schoolName })}
      description={t("root.schoolPage.leave.description")}
      cancelLabel={t("root.schoolPage.leave.cancel")}
      confirmLabel={t("root.schoolPage.leave.confirm")}
      isPending={isPending}
      onConfirm={handleLeave}
    />
  );
}
