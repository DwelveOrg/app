"use client";

import { useState } from "react";
import { BookOpenText, Bug, Mail, Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";
import ListRow from "@/app/(root)/_components/ListRow";
import SectionHeader from "@/app/(root)/_components/SectionHeader";
import { Button } from "@/components/ui/Button";
import Surface from "@/components/ui/Surface";
import ReportProblemDialog from "@/components/Custom/ReportProblem/ReportProblemDialog";
import type { ReportKind } from "@/lib/reports/reports.schemas";
import { AccountGroup } from "./AccountGroup";
import { supportEmail } from "../_constants";

/**
 * Support and documentation.
 *
 * The two feedback rows used to open a composer that built a `mailto:` URL,
 * because there was no backend feedback endpoint. There is one now, so they
 * open the same dialog the floating report control does — one report path, one
 * place the messages land, and a screenshot can ride along, which a `mailto:`
 * could never carry.
 *
 * "Contact support" stays an email link. It is not a report; it is a
 * conversation, and it should start in the user's own inbox where they can
 * follow it.
 */
export function SupportTab() {
  const { t } = useTranslation();
  const [reportKind, setReportKind] = useState<ReportKind | null>(null);

  const paragraphKeys = [0, 1, 2, 3] as const;

  return (
    <div className="space-y-7">
      <AccountGroup label={t("root.settings.support.title")}>
        <ListRow
          icon={Bug}
          title={t("root.settings.support.reportBug.title")}
          description={t("root.settings.support.reportBug.description")}
          action={
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setReportKind("BUG")}
            >
              {t("root.settings.actions.send")}
            </Button>
          }
        />
        <ListRow
          icon={Sparkles}
          title={t("root.settings.support.requestFeature.title")}
          description={t("root.settings.support.requestFeature.description")}
          action={
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setReportKind("FEEDBACK")}
            >
              {t("root.settings.actions.share")}
            </Button>
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

      {/*
        Keyed on the kind so opening "Suggest a feature" after "Report a bug"
        remounts the dialog and picks up the new default, rather than keeping
        the selection from the row pressed first.
      */}
      {reportKind ? (
        <ReportProblemDialog
          key={reportKind}
          open
          defaultKind={reportKind}
          onOpenChange={(next) => {
            if (!next) setReportKind(null);
          }}
        />
      ) : null}

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
