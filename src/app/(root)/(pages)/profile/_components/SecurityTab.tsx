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
 *
 * The two panels sit side by side from `lg` up, but the account actions stay
 * full width *below* them rather than becoming a third column. Deleting an
 * account is the most destructive control in the product, and "last thing on
 * the page" is only a meaningful position while the page still has a last
 * thing — in a three-column row it would sit level with a password field.
 *
 * `items-start` on purpose: the sessions list grows with the number of signed-in
 * devices, and stretching the password panel to match would leave a tall empty
 * card next to it.
 */
export function SecurityTab({ hasPassword }: Readonly<SecurityTabProps>) {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
        <ChangePasswordForm hasPassword={hasPassword} />

        <SessionsPanel />
      </div>

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
