"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";

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
import { rowDangerActionClassName, supportEmail } from "../_constants";
import { buildAccountContext, buildMailtoHref } from "../_utils/mailto";

type DeleteAccountButtonProps = {
  accountName?: string | null;
  accountEmail?: string | null;
  schoolName?: string | null;
  role?: string | null;
};

/**
 * Account deletion request.
 *
 * The backend has no account-deletion endpoint (nothing under `/profile` or
 * `/auth` removes a user), so this cannot delete anything client-side. Rather
 * than a dead button, it confirms intent and composes a deletion request to
 * {@link supportEmail}. Replace the mailto with a `DELETE /profile` call once
 * that endpoint ships — the confirmation copy already sets the right
 * expectations about permanence.
 */
export function DeleteAccountButton({
  accountName,
  accountEmail,
  schoolName,
  role,
}: Readonly<DeleteAccountButtonProps>) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  const handleConfirm = () => {
    const href = buildMailtoHref({
      to: supportEmail,
      subject: "Account deletion request — Dwelve",
      body:
        t("root.settings.security.deleteAccount.requestBody") +
        buildAccountContext({
          fullName: accountName,
          email: accountEmail,
          schoolName,
          role,
        }),
    });

    window.location.href = href;
    setOpen(false);
    toast.success(t("root.settings.security.deleteAccount.requested"));
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
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
          <AlertDialogCancel>
            {t("root.settings.security.deleteAccount.cancel")}
          </AlertDialogCancel>
          <button
            type="button"
            onClick={handleConfirm}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-[var(--destructive)] px-4 py-2 text-sm font-semibold text-[var(--destructive-foreground)] transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--destructive)_45%,transparent)]"
          >
            {t("root.settings.security.deleteAccount.confirm")}
          </button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
