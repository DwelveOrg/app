"use client";

import { KeyRound, Laptop, LogOut, ShieldEllipsis, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import ListRow from "@/app/(root)/_components/ListRow";
import { SettingsGroup } from "./SettingsGroup";
import { LogoutAllButton } from "./LogoutAllButton";
import { DeleteAccountButton } from "./DeleteAccountButton";
export function SecuritySection() {
  const { t } = useTranslation();

  return (
    <SettingsGroup label={t("root.settings.security.title")}>
      <ListRow
        icon={KeyRound}
        title={t("root.settings.security.changePassword.title")}
        description={t("root.settings.security.changePassword.description")}
        href="/settings/change-password"
      />
      {/* No 2FA model on the backend yet — stays a signposted placeholder. */}
      <ListRow
        icon={ShieldEllipsis}
        title={t("root.settings.security.twoFactor.title")}
        description={t("root.settings.security.twoFactor.description")}
        soon
        soonLabel={t("root.settings.actions.comingSoon")}
      />
      <ListRow
        icon={Laptop}
        title={t("root.settings.security.activeSessions.title")}
        description={t("root.settings.security.activeSessions.description")}
        href="/settings/sessions"
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
    </SettingsGroup>
  );
}
