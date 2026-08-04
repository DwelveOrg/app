"use client";

import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";

import { deleteAccountAction } from "@/app/(root)/_lib/profile-actions";
import ConfirmDialog from "@/app/(root)/_components/ConfirmDialog";
import { rowDangerActionClassName } from "../_constants";

/**
 * Account deletion control. The server action removes the signed-in account and redirects, so only
 * the failure path is handled here.
 */
export function DeleteAccountButton() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleConfirm = () => {
    startTransition(async () => {
      const result = await deleteAccountAction();

      if (result.error) {
        toast.error(result.error);
      }
    });
  };

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={(next) => !isPending && setOpen(next)}
      trigger={
        <button type="button" className={rowDangerActionClassName}>
          {t("root.settings.actions.delete")}
        </button>
      }
      icon={<Trash2 />}
      title={t("root.settings.security.deleteAccount.confirmTitle")}
      description={t("root.settings.security.deleteAccount.confirmDescription")}
      cancelLabel={t("root.settings.security.deleteAccount.cancel")}
      confirmLabel={t("root.settings.security.deleteAccount.confirm")}
      isPending={isPending}
      onConfirm={handleConfirm}
    />
  );
}
