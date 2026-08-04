"use client";

import { useState, useTransition } from "react";
import { LogOut } from "lucide-react";
import { useTranslation } from "react-i18next";

import { logoutAll } from "@/app/(authentication)/_lib/actions";
import ConfirmDialog from "@/app/(root)/_components/ConfirmDialog";
import { rowActionClassName } from "../_constants";

/**
 * Trailing control for the "logout from all devices" row. Confirms intent, then calls the
 * {@link logoutAll} server action which clears every Redis refresh session and redirects to login.
 * The dialog stays open (and locked) while the action is in flight so the navigation always
 * follows a deliberate confirm.
 */
export function LogoutAllButton() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleConfirm = () => {
    startTransition(async () => {
      await logoutAll();
    });
  };

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={(next) => !isPending && setOpen(next)}
      trigger={
        <button type="button" className={rowActionClassName}>
          {t("root.settings.actions.logout")}
        </button>
      }
      icon={<LogOut />}
      title={t("root.settings.security.logoutAllDevices.confirmTitle")}
      description={t("root.settings.security.logoutAllDevices.confirmDescription")}
      cancelLabel={t("root.settings.security.logoutAllDevices.cancel")}
      confirmLabel={t("root.settings.security.logoutAllDevices.confirm")}
      isPending={isPending}
      onConfirm={handleConfirm}
    />
  );
}
