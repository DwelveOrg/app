"use client";

import { useSyncExternalStore } from "react";
import { useTheme } from "next-themes";
import { useTranslation } from "react-i18next";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

type ThemeOption = "light" | "dark" | "system";

export type ThemeSwitchAlternativeProps = {
  compact?: boolean;
  triggerClassName?: string;
  contentClassName?: string;
  itemClassName?: string;
};

export default function ThemeSwitchAlternative({
  compact = false,
  triggerClassName,
  contentClassName,
  itemClassName,
}: ThemeSwitchAlternativeProps) {
  const { t } = useTranslation();
  const { resolvedTheme, theme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  if (!mounted) return null;

  const currentTheme = (theme ?? resolvedTheme ?? "system") as ThemeOption;

  return (
    <div className={`inline-flex items-center gap-2 ${compact ? "justify-center" : ""}`}>
      {!compact ? (
        <span className="text-xs font-medium text-muted-foreground">
          {t("root.settings.appearance.themeLabel")}
        </span>
      ) : null}
      <Select value={currentTheme} onValueChange={(value) => setTheme(value)}>
        <SelectTrigger
          className={cn(
            `${compact ? "h-8 w-24 px-2 text-xs" : "h-9 w-28 text-sm"} cursor-pointer`,
            triggerClassName
          )}
          aria-label={t("root.settings.appearance.themeLabel")}
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent
          className={cn(
            "border-border bg-popover text-popover-foreground",
            contentClassName
          )}
        >
          <SelectItem
            className={cn(
              "cursor-pointer data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground",
              itemClassName
            )}
            value="light"
          >
            {t("root.settings.appearance.themes.light")}
          </SelectItem>
          <SelectItem
            className={cn(
              "cursor-pointer data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground",
              itemClassName
            )}
            value="dark"
          >
            {t("root.settings.appearance.themes.dark")}
          </SelectItem>
          <SelectItem
            className={cn(
              "cursor-pointer data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground",
              itemClassName
            )}
            value="system"
          >
            {t("root.settings.appearance.themes.system")}
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
