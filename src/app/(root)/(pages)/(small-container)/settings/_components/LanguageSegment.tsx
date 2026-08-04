"use client";

import { useSyncExternalStore } from "react";
import { useTranslation } from "react-i18next";

import Segmented, { type SegmentedOption } from "@/components/ui/Segmented";
import { supportedLanguages, type AppLanguage } from "@/i18n/resources";

export function LanguageSegment() {
  const { i18n, t } = useTranslation();
  // The stored language is client-only, so the control cannot render its value on the server.
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  const current = (i18n.resolvedLanguage ?? i18n.language ?? "en") as AppLanguage;
  const value = supportedLanguages.includes(current) ? current : "en";

  const options: SegmentedOption<AppLanguage>[] = supportedLanguages.map((language) => ({
    value: language,
    label: language.toUpperCase(),
  }));

  const handleChange = (next: AppLanguage) => {
    if (!supportedLanguages.includes(next)) return;
    window.localStorage.setItem("gf-language", next);
    void i18n.changeLanguage(next);
  };

  return (
    <Segmented
      pending={!mounted}
      layoutId="settings-language"
      ariaLabel={t("language.label")}
      value={value}
      onChange={handleChange}
      options={options}
    />
  );
}
