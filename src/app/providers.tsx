"use client";

import { useEffect } from "react";
import { ThemeProvider } from "next-themes";

import i18n from "@/i18n";
import { defaultLanguage, supportedLanguages, type AppLanguage } from "@/i18n/resources";
import QueryProvider from "@/lib/query/QueryProvider";

export default function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const updateHtmlLanguage = (language: string) => {
      document.documentElement.lang = language;
      window.localStorage.setItem("gf-language", language);
    };

    const savedLanguage = window.localStorage.getItem("gf-language") as AppLanguage | null;
    if (savedLanguage && supportedLanguages.includes(savedLanguage)) {
      void i18n.changeLanguage(savedLanguage);
    } else {
      updateHtmlLanguage(defaultLanguage);
    }

    updateHtmlLanguage(i18n.resolvedLanguage ?? i18n.language ?? "en");
    i18n.on("languageChanged", updateHtmlLanguage);

    return () => {
      i18n.off("languageChanged", updateHtmlLanguage);
    };
  }, []);

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      storageKey="dwelve-theme"
      // Without this, next-themes leaves the body's colour transition running
      // during a theme swap, so every surface cross-fades one at a time and the
      // flip reads as a smear rather than a switch.
      disableTransitionOnChange
    >
      <QueryProvider>{children}</QueryProvider>
    </ThemeProvider>
  );
}

