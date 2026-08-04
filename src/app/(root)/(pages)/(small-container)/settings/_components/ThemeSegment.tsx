"use client";

import { useSyncExternalStore } from "react";
import { useTheme } from "next-themes";
import { Monitor, Moon, Sun } from "lucide-react";
import { useTranslation } from "react-i18next";

import type { ThemeOption } from "@/app/(root)/_types";
import Segmented, { type SegmentedOption } from "@/components/ui/Segmented";

export function ThemeSegment() {
  const { t } = useTranslation();
  const { theme, resolvedTheme, setTheme } = useTheme();
  // The stored theme is client-only, so the control cannot render its value on the server.
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  const current = (theme ?? resolvedTheme ?? "system") as ThemeOption;

  const options: SegmentedOption<ThemeOption>[] = [
    { value: "light", label: t("root.settings.appearance.themes.light"), icon: Sun },
    { value: "dark", label: t("root.settings.appearance.themes.dark"), icon: Moon },
    { value: "system", label: t("root.settings.appearance.themes.system"), icon: Monitor },
  ];

  return (
    <Segmented
      pending={!mounted}
      layoutId="settings-theme"
      ariaLabel={t("root.settings.appearance.themeLabel")}
      value={current}
      onChange={setTheme}
      options={options}
    />
  );
}
