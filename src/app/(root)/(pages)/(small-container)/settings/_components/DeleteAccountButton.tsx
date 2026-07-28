"use client";

import { useState, useTransition } from "react";
import { LoaderCircle, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";

import { deleteAccountAction } from "@/app/(root)/_lib/profile-actions";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { rowDangerActionClassName } from "../_constants";

/**
 * Account deletion control. Its confirmation dialog preserves the existing
 * settings-page treatment while the server action removes the signed-in account.
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
    <AlertDialog open={open} onOpenChange={(next) => !isPending && setOpen(next)}>
      <AlertDialogTrigger asChild>
        <button type="button" className={rowDangerActionClassName}>
          {t("root.settings.actions.delete")}
        </button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogMedia className="bg-[color-mix(in_srgb,var(--destructive)_12%,transparent)] text-[var(--destructive)]">
            <Trash2 />
          </AlertDialogMedia>
          <AlertDialogTitle>
            {t("root.settings.security.deleteAccount.confirmTitle")}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {t("root.settings.security.deleteAccount.confirmDescription")}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>
            {t("root.settings.security.deleteAccount.cancel")}
          </AlertDialogCancel>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isPending}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-[var(--destructive)] px-4 py-2 text-sm font-semibold text-[var(--destructive-foreground)] transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--destructive)_45%,transparent)] disabled:opacity-70"
          >
            {isPending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
            {t("root.settings.security.deleteAccount.confirm")}
          </button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
