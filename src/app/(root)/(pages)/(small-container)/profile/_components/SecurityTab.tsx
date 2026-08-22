"use client";

import { LogOut, ShieldEllipsis, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";

import ListRow from "@/app/(root)/_components/ListRow";
import { ChangePasswordForm } from "@/app/(root)/_components/account/ChangePasswordForm";
import { SessionsPanel } from "@/app/(root)/_components/account/SessionsPanel";
import { AccountGroup } from "./AccountGroup";
import { DeleteAccountButton } from "./DeleteAccountButton";
import { LogoutAllButton } from "./LogoutAllButton";

type SecurityTabProps = {
  /**
   * From `account.authMethods.password`: true → change flow, false → first-time
   * setup. Defaults to the change flow when the bootstrap is unavailable, so an
   * existing-password user is never shown the passwordless setup form.
   */
  hasPassword: boolean;
};

/**
 * Password, active sessions, and the account-level actions that end a session or
 * the account itself.
 *
 * These were three separate Settings routes (`/settings/change-password`,
 * `/settings/sessions`, and the rows on `/settings` itself). Inlining them costs
 * nothing per navigation — the password panel reads `hasPassword` from the one
 * bootstrap this route already made, and the sessions list fetches on mount,
 * which only happens once this tab is opened.
 */
export function SecurityTab({ hasPassword }: Readonly<SecurityTabProps>) {
  const { t } = useTranslation();

  return (
    <div className="space-y-7">
      <ChangePasswordForm hasPassword={hasPassword} />

      <SessionsPanel />

      <AccountGroup label={t("root.profile.groups.accountActions")}>
        {/* No 2FA model on the backend yet — stays a signposted placeholder. */}
        <ListRow
          icon={ShieldEllipsis}
          title={t("root.settings.security.twoFactor.title")}
          description={t("root.settings.security.twoFactor.description")}
          soon
          soonLabel={t("root.settings.actions.comingSoon")}
        />
        <ListRow
          icon={LogOut}
          title={t("root.settings.security.logoutAllDevices.title")}
          description={t("root.settings.security.logoutAllDevices.description")}
          action={<LogoutAllButton />}
        />
        <ListRow
          icon={Trash2}
          danger
          title={t("root.settings.security.deleteAccount.title")}
          description={t("root.settings.security.deleteAccount.description")}
          action={<DeleteAccountButton />}
        />
      </AccountGroup>
    </div>
  );
}
