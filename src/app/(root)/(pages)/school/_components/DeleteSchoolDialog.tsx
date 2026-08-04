"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";

import ConfirmDialog from "@/app/(root)/_components/ConfirmDialog";
import { deleteSchoolAction } from "@/app/(root)/_lib/school-actions";

type DeleteSchoolDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  schoolName: string;
};

/**
 * Admin-only school deletion. On success the server action re-syncs the session
 * and redirects to `/dashboard`, so we only handle the error path here (mirrors
 * `SessionsPanel`'s redirecting-action pattern).
 */
export default function DeleteSchoolDialog({
  open,
  onOpenChange,
  schoolName,
}: DeleteSchoolDialogProps) {
  const { t } = useTranslation();
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    startTransition(async () => {
      const result = await deleteSchoolAction({});
      // Reaching here means no redirect happened — i.e. the delete failed.
      if (result?.serverError) {
        toast.error(result.serverError);
        return;
      }
      toast.error(t("root.schoolPage.delete.error"));
    });
  };

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      icon={<Trash2 />}
      title={t("root.schoolPage.delete.title", { name: schoolName })}
      description={t("root.schoolPage.delete.description")}
      cancelLabel={t("root.schoolPage.delete.cancel")}
      confirmLabel={t("root.schoolPage.delete.confirm")}
      isPending={isPending}
      onConfirm={handleDelete}
    />
  );
}
