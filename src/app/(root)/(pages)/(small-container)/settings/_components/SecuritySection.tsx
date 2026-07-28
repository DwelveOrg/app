"use client";

import { KeyRound, Laptop, LogOut, ShieldEllipsis, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { SettingsGroup } from "./SettingsGroup";
import { SettingsRow } from "./SettingsRow";
import { LogoutAllButton } from "./LogoutAllButton";
import { DeleteAccountButton } from "./DeleteAccountButton";
import type { SettingsAccountContext } from "../_types";

export function SecuritySection({
  account,
}: Readonly<{ account: SettingsAccountContext }>) {
  const { t } = useTranslation();

  return (
    <SettingsGroup label={t("root.settings.security.title")}>
      <SettingsRow
        icon={KeyRound}
        title={t("root.settings.security.changePassword.title")}
        description={t("root.settings.security.changePassword.description")}
        href="/settings/change-password"
      />
      {/* No 2FA model on the backend yet — stays a signposted placeholder. */}
      <SettingsRow
        icon={ShieldEllipsis}
        title={t("root.settings.security.twoFactor.title")}
        description={t("root.settings.security.twoFactor.description")}
        soon
      />
      <SettingsRow
        icon={Laptop}
        title={t("root.settings.security.activeSessions.title")}
        description={t("root.settings.security.activeSessions.description")}
        href="/settings/sessions"
      />
      <SettingsRow
        icon={LogOut}
        title={t("root.settings.security.logoutAllDevices.title")}
        description={t("root.settings.security.logoutAllDevices.description")}
        action={<LogoutAllButton />}
      />
      <SettingsRow
        icon={Trash2}
        danger
        title={t("root.settings.security.deleteAccount.title")}
        description={t("root.settings.security.deleteAccount.description")}
        action={
          <DeleteAccountButton
            accountName={account.name}
            accountEmail={account.email}
            schoolName={account.schoolName}
            role={account.role}
          />
        }
      />
    </SettingsGroup>
  );
}
