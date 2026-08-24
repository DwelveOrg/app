"use client";

import { useTransition } from "react";
import { ShieldOff } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";

import ConfirmDialog from "@/app/(root)/_components/ConfirmDialog";
import { updateMemberRoleAction } from "@/app/(root)/_lib/school-actions";
import { useRefreshSchoolDirectory } from "../_hooks/useSchoolDirectory";

/** Owner-only: return an admin to the teacher role, restoring their teacher profile. */
export default function DemoteAdminDialog({
  open,
  onOpenChange,
  memberId,
  adminName,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  memberId: string;
  adminName: string;
}) {
  const { t } = useTranslation();
  const refreshDirectory = useRefreshSchoolDirectory();
  const [isPending, startTransition] = useTransition();

  const demote = () => {
    startTransition(async () => {
      const result = await updateMemberRoleAction({ memberId, role: "TEACHER" });
      if (result?.serverError) {
        toast.error(result.serverError);
        return;
      }
      if (result?.validationErrors) {
        toast.error(t("root.schoolPage.access.demote.error"));
        return;
      }
      toast.success(t("root.schoolPage.access.demote.success", { name: adminName }));
      onOpenChange(false);
      void refreshDirectory();
    });
  };

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      icon={<ShieldOff />}
      title={t("root.schoolPage.access.demote.title", { name: adminName })}
      description={t("root.schoolPage.access.demote.description")}
      cancelLabel={t("root.schoolPage.access.cancel")}
      confirmLabel={t("root.schoolPage.access.demote.confirm")}
      isPending={isPending}
      onConfirm={demote}
    />
  );
}
