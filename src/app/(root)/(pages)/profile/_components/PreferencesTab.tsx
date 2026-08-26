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
 *
 * Two settings is too few to fill a wide panel as one stacked list, so they sit
 * side by side from `lg` up under their own labels rather than under a single
 * "Appearance & language" heading. That heading only ever existed to name a
 * group of two unrelated things; once each has room for its own label the
 * combined one is the redundant part, not the split.
 */
export function PreferencesTab() {
  const { t } = useTranslation();

  return (
    <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
      <AccountGroup label={t("root.settings.appearance.title")}>
        <ListRow
          icon={Palette}
          title={t("root.settings.appearance.themeLabel")}
          description={t("root.settings.appearance.themeHelp")}
          control={<ThemeSegment />}
        />
      </AccountGroup>

      <AccountGroup label={t("root.settings.language.title")}>
        <ListRow
          icon={Languages}
          title={t("root.settings.language.primary.title")}
          description={t("root.settings.language.primary.description")}
          control={<LanguageSegment />}
        />
      </AccountGroup>
    </div>
  );
}
