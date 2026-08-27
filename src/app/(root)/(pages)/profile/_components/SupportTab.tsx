"use client";

import { useState } from "react";
import { Bug, Mail, Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";
import ListRow from "@/app/(root)/_components/ListRow";
import { Button } from "@/components/ui/Button";
import ReportProblemDialog from "@/components/Custom/ReportProblem/ReportProblemDialog";
import type { ReportKind } from "@/lib/reports/reports.schemas";
import { AccountGroup } from "./AccountGroup";
import { DocumentationPanel } from "./DocumentationPanel";
import { supportEmail } from "../_constants";

/**
 * Support and documentation.
 *
 * The two feedback rows used to open a composer that built a `mailto:` URL,
 * because there was no backend feedback endpoint. There is one now, so they
 * open the same dialog the floating report control does — one report path, one
 * place the text and browser context land, without depending on a configured
 * mail client.
 *
 * "Contact support" stays an email link. It is not a report; it is a
 * conversation, and it should start in the user's own inbox where they can
 * follow it.
 *
 * Two columns from `lg` up: the three ways to reach a person on the left, the
 * answers to read instead on the right. They are alternatives to each other
 * rather than steps, so sitting level is the honest arrangement — and both
 * halves are now the same object, a labelled panel of hairline-separated rows,
 * because the right-hand side used to be four paragraphs of prose beside a list
 * and read as a brochure someone had left in the settings.
 */
export function SupportTab() {
  const { t } = useTranslation();
  const [reportKind, setReportKind] = useState<ReportKind | null>(null);

  return (
    <>
      <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
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

        <DocumentationPanel />
      </div>

      {/*
        Kept outside the grid: a conditional child of it would claim a cell of
        its own the moment it opened and push the documentation panel onto a
        second row.

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
    </>
  );
}
