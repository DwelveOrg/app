"use client";

import { BookOpenText, Bug, Mail, Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";
import ListRow from "@/app/(root)/_components/ListRow";
import { SettingsGroup } from "./SettingsGroup";
import { FeedbackModal } from "./FeedbackModal";
import { rowActionClassName, supportEmail } from "../_constants";
import type { SettingsAccountContext } from "../_types";

export function SupportSection({
  account,
}: Readonly<{ account: SettingsAccountContext }>) {
  const { t } = useTranslation();

  return (
    <SettingsGroup label={t("root.settings.support.title")}>
      <ListRow
        icon={Bug}
        title={t("root.settings.support.reportBug.title")}
        description={t("root.settings.support.reportBug.description")}
        action={
          <FeedbackModal
            kind="bug"
            accountName={account.name}
            accountEmail={account.email}
            schoolName={account.schoolName}
            role={account.role}
          >
            {t("root.settings.actions.send")}
          </FeedbackModal>
        }
      />
      <ListRow
        icon={Sparkles}
        title={t("root.settings.support.requestFeature.title")}
        description={t("root.settings.support.requestFeature.description")}
        action={
          <FeedbackModal
            kind="feature"
            accountName={account.name}
            accountEmail={account.email}
            schoolName={account.schoolName}
            role={account.role}
          >
            {t("root.settings.actions.share")}
          </FeedbackModal>
        }
      />
      <ListRow
        icon={Mail}
        title={t("root.settings.support.contactSupport.title")}
        description={t("root.settings.support.contactSupport.description")}
        action={
          <a href={`mailto:${supportEmail}`} className={rowActionClassName}>
            {t("root.settings.actions.contact")}
          </a>
        }
      />
      <ListRow
        icon={BookOpenText}
        title={t("root.settings.support.documentation.title")}
        description={t("root.settings.support.documentation.description")}
        href="/settings/documentation"
      />
    </SettingsGroup>
  );
}
