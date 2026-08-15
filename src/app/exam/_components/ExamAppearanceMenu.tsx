"use client";

import { Check, Contrast, Moon, Settings2, Sun, Type } from "lucide-react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";
import {
  EXAM_TEXT_SIZES,
  EXAM_THEMES,
  type ExamAppearance,
  type ExamTextSize,
  type ExamTheme,
} from "../_lib/exam-environment";
import ExamPopover from "./ExamPopover";


const THEME_ICONS: Record<ExamTheme, typeof Sun> = {
  paper: Sun,
  slate: Moon,
  contrast: Contrast,
};

export default function ExamAppearanceMenu({
  appearance,
  onThemeChange,
  onTextSizeChange,
  className,
}: {
  appearance: ExamAppearance;
  onThemeChange: (theme: ExamTheme) => void;
  onTextSizeChange: (size: ExamTextSize) => void;
  className?: string;
}) {
  const { t } = useTranslation();

  return (
    <ExamPopover
      align="end"
      className={className}
      label={t("exam.appearance.title")}
      panelClassName="w-64"
      trigger={() => (
        <>
          <Settings2 className="size-4" aria-hidden="true" />
          <span className="hidden sm:inline">{t("exam.appearance.title")}</span>
        </>
      )}
    >
      {() => (
        <div className="space-y-4">
          <fieldset>
            <legend className="type-micro mb-2 text-muted-foreground">
              {t("exam.appearance.theme")}
            </legend>
            <div className="space-y-1">
              {EXAM_THEMES.map((theme) => {
                const Icon = THEME_ICONS[theme];
                const active = appearance.theme === theme;

                return (
                  <button
                    key={theme}
                    type="button"
                    onClick={() => onThemeChange(theme)}
                    aria-pressed={active}
                    className={cn(
                      "interactive-flat flex w-full cursor-pointer items-center gap-2.5 rounded-lg border px-2.5 py-2 text-13 outline-none",
                      "focus-visible:ring-2 focus-visible:ring-ring/50",
                      active
                        ? "border-primary/50 bg-accent text-accent-foreground"
                        : "border-transparent text-foreground hover:bg-muted",
                    )}
                  >
                    <Icon className="size-4 shrink-0" aria-hidden="true" />
                    <span className="flex-1 text-left">
                      {t(`exam.appearance.themes.${theme}`)}
                    </span>
                    {active ? <Check className="size-3.5 shrink-0" aria-hidden="true" /> : null}
                  </button>
                );
              })}
            </div>
          </fieldset>

          <fieldset className="border-t border-border pt-3">
            <legend className="type-micro mb-2 flex items-center gap-1.5 text-muted-foreground">
              <Type className="size-3" aria-hidden="true" />
              {t("exam.appearance.textSize")}
            </legend>
            <div className="grid grid-cols-4 gap-1">
              {EXAM_TEXT_SIZES.map((size, index) => {
                const active = appearance.textSize === size;

                return (
                  <button
                    key={size}
                    type="button"
                    onClick={() => onTextSizeChange(size)}
                    aria-pressed={active}
                    aria-label={t(`exam.appearance.sizes.${size}`)}
                    className={cn(
                      "interactive-flat cursor-pointer rounded-lg border py-1.5 font-semibold outline-none",
                      "focus-visible:ring-2 focus-visible:ring-ring/50",
                      active
                        ? "border-primary/50 bg-accent text-accent-foreground"
                        : "border-border text-muted-foreground hover:bg-muted hover:text-foreground",
                    )}
                    style={{ fontSize: `${0.75 + index * 0.125}rem` }}
                  >
                    A
                  </button>
                );
              })}
            </div>
          </fieldset>
        </div>
      )}
    </ExamPopover>
  );
}
