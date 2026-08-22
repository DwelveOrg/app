"use client";

import { Languages, Palette } from "lucide-react";
import { useTranslation } from "react-i18next";
import ListRow from "@/app/(root)/_components/ListRow";
import { AccountGroup } from "./AccountGroup";
import { ThemeSegment } from "./ThemeSegment";
import { LanguageSegment } from "./LanguageSegment";

/**
 * Theme and language. Both are frontend-owned — the backend persists neither and
 * `GET /profile` carries neither — so this panel renders identically whether or
 * not the bootstrap request succeeded.
 */
export function PreferencesTab() {
  const { t } = useTranslation();

  return (
    <AccountGroup label={t("root.settings.groups.preferences")}>
      <ListRow
        icon={Palette}
        title={t("root.settings.appearance.themeLabel")}
        description={t("root.settings.appearance.themeHelp")}
        control={<ThemeSegment />}
      />
      <ListRow
        icon={Languages}
        title={t("root.settings.language.primary.title")}
        description={t("root.settings.language.primary.description")}
        control={<LanguageSegment />}
      />
    </AccountGroup>
  );
}
