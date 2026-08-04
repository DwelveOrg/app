"use client";

import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";

import ConfirmDialog from "@/app/(root)/_components/ConfirmDialog";
import { useDeleteClassMutation } from "@/app/(root)/(pages)/school/_hooks/useDeleteClassMutation";

type DeleteClassDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  classId: string;
  className: string;
  /**
   * When the delete happens from the detail page, we route back to `/groups`.
   * Cards on the list refresh in place, so leave this off there.
   */
  redirectOnSuccess?: string;
};

export default function DeleteClassDialog({
  open,
  onOpenChange,
  classId,
  className,
  redirectOnSuccess,
}: DeleteClassDialogProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const deleteClass = useDeleteClassMutation();

  const isBusy = deleteClass.isPending;

  const handleDelete = () => {
    deleteClass.mutate(
      { classId },
      {
        onSuccess: () => {
          toast.success(t("root.classDetail.delete.success", { name: className }));
          onOpenChange(false);
          if (redirectOnSuccess) {
            router.push(redirectOnSuccess);
          }
          router.refresh();
        },
        onError: (error) => {
          toast.error(
            error instanceof Error ? error.message : t("root.classDetail.delete.error"),
          );
        },
      },
    );
  };

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      icon={<Trash2 />}
      title={t("root.classDetail.delete.title", { name: className })}
      description={t("root.classDetail.delete.description")}
      cancelLabel={t("root.classDetail.delete.cancel")}
      confirmLabel={t("root.classDetail.delete.confirm")}
      isPending={isBusy}
      onConfirm={handleDelete}
    />
  );
}
