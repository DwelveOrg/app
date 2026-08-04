"use client";

import { BookOpenText } from "lucide-react";
import { SectionCard } from "../../../_components/layout/SectionCard";
import { useTranslation } from "react-i18next";

export default function Documentation() {
  const { t } = useTranslation();
  return (
    <div className="space-y-5">
      <SectionCard
        icon={BookOpenText}
        title={t("root.settings.documentation.page.title")}
        description={t("root.settings.documentation.page.description")}
      >
        <div className="space-y-4 text-15 leading-7 text-muted-foreground">
          <p>{t("root.settings.documentation.page.paragraphs.0")}</p>
          <p>{t("root.settings.documentation.page.paragraphs.1")}</p>
          <p>{t("root.settings.documentation.page.paragraphs.2")}</p>
          <p>{t("root.settings.documentation.page.paragraphs.3")}</p>
        </div>
      </SectionCard>
    </div>
  );
}
