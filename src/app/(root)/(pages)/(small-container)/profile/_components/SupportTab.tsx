"use client";

import { BookOpenText, Bug, Mail, Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";
import ListRow from "@/app/(root)/_components/ListRow";
import SectionHeader from "@/app/(root)/_components/SectionHeader";
import { Button } from "@/components/ui/Button";
import Surface from "@/components/ui/Surface";
import { AccountGroup } from "./AccountGroup";
import { FeedbackModal } from "./FeedbackModal";
import { supportEmail } from "../_constants";
import type { AccountContext } from "../_types";

/**
 * Support and documentation. Frontend-owned in full: there is no backend
 * feedback endpoint, so the composers open a real message instead of posting
 * into a void, and the product overview is rendered here rather than behind the
 * `/settings/documentation` route it used to occupy — four paragraphs do not
 * earn a destination of their own.
 */
export function SupportTab({ account }: Readonly<{ account: AccountContext }>) {
  const { t } = useTranslation();

  const paragraphKeys = [0, 1, 2, 3] as const;

  return (
    <div className="space-y-7">
      <AccountGroup label={t("root.settings.support.title")}>
        <ListRow
          icon={Bug}
          title={t("root.settings.support.reportBug.title")}
          description={t("root.settings.support.reportBug.description")}
          action={
            <FeedbackModal kind="bug" account={account}>
              {t("root.settings.actions.send")}
            </FeedbackModal>
          }
        />
        <ListRow
          icon={Sparkles}
          title={t("root.settings.support.requestFeature.title")}
          description={t("root.settings.support.requestFeature.description")}
          action={
            <FeedbackModal kind="feature" account={account}>
              {t("root.settings.actions.share")}
            </FeedbackModal>
          }
        />
        <ListRow
          icon={Mail}
          title={t("root.settings.support.contactSupport.title")}
          description={t("root.settings.support.contactSupport.description")}
          action={
            <Button asChild variant="outline" size="sm">
              <a href={`mailto:${supportEmail}`}>{t("root.settings.actions.contact")}</a>
            </Button>
          }
        />
      </AccountGroup>

      <Surface as="section">
        <SectionHeader
          icon={BookOpenText}
          title={t("root.settings.documentation.page.title")}
          description={t("root.settings.documentation.page.description")}
        />
        <div className="mt-5 space-y-4 text-15 leading-7 text-muted-foreground">
          {paragraphKeys.map((index) => (
            <p key={index}>{t(`root.settings.documentation.page.paragraphs.${index}`)}</p>
          ))}
        </div>
      </Surface>
    </div>
  );
}
